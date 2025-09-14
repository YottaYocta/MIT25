import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type GenerateProxyRequest = {
  image?: string; // base64 or data URL
  image_base64?: string; // legacy key
  imageBase64?: string; // legacy camelCase
  trinketId?: string; // optional: attach generated model to trinket
  texture?: boolean;
  save_preprocessed_image?: boolean;
  type?: "glb";
};

// Default generator endpoint; can be overridden with env if provided
const GENERATOR_URL =
  process.env.GENERATOR_URL?.replace(/\/$/, "") ||
  "https://cb7943f2c7d6.ngrok-free.app";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  let texture = true;
  let save_preprocessed_image = false;
  let type = "glb" as const;
  let image: string | null = null;
  let trinketId: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    texture = (form.get("texture") ?? "true") === "true";
    save_preprocessed_image = (form.get("save_preprocessed_image") ?? "false") === "true";
    type = (((form.get("type") as string) || "glb") === "glb" ? "glb" : "glb") as const;
    trinketId = (form.get("trinketId") as string) || null;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      image = Buffer.from(arrayBuffer).toString("base64");
    } else {
      const maybe = (form.get("image") || form.get("image_base64") || form.get("imageBase64")) as string | null;
      if (maybe) image = maybe;
    }
  } else {
    let body: GenerateProxyRequest;
    try {
      body = (await req.json()) as GenerateProxyRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    texture = body.texture ?? true;
    save_preprocessed_image = body.save_preprocessed_image ?? false;
    type = ((body.type ?? "glb") === "glb" ? "glb" : "glb") as const;
    image = body.image || body.image_base64 || body.imageBase64 || null;
    trinketId = body.trinketId || null;
  }

  if (!image || typeof image !== "string" || image.length === 0) {
    return NextResponse.json(
      { error: "Missing required field: image (base64 string)" },
      { status: 400 },
    );
  }

  // Strip data URL header if present
  const commaIdx = image.indexOf(",");
  if (commaIdx >= 0) {
    image = image.slice(commaIdx + 1);
  }

  try {
    const generatorResponse = await fetch(`${GENERATOR_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        texture,
        save_preprocessed_image,
        type,
      }),
    });

    if (!generatorResponse.ok) {
      const errorText = await generatorResponse.text().catch(() => "");
      return NextResponse.json(
        {
          error:
            errorText ||
            `Generation failed with status ${generatorResponse.status}`,
        },
        { status: generatorResponse.status },
      );
    }

    const result = await generatorResponse.json().catch(async () => {
      // Fallback: some servers might return binary on error
      const text = await generatorResponse.text();
      return { error: text };
    });

    // If no trinket to attach, just pass through the generator response
    if (!trinketId) {
      return NextResponse.json(result, { status: 200 });
    }

    // Attach model to trinket if mesh_file provided
    const meshFile = (result && typeof result === "object" && "mesh_file" in result)
      ? (result as { mesh_file?: string }).mesh_file
      : undefined;
    if (!meshFile) {
      return NextResponse.json(
        { error: "Generator did not return mesh_file" },
        { status: 502 },
      );
    }

    // Must be authenticated to update a trinket
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Download the generated GLB
    const meshResp = await fetch(`${GENERATOR_URL}/files/${encodeURIComponent(meshFile)}`);
    if (!meshResp.ok) {
      return NextResponse.json(
        { error: `Failed to download generated model (${meshResp.status})` },
        { status: 502 },
      );
    }
    const glbArrayBuffer = await meshResp.arrayBuffer();

    // Upload GLB to Supabase Storage
    const modelFileName = `${crypto.randomUUID()}.glb`;
    const modelStoragePath = `models/${user.id}/${modelFileName}`;
    const modelBlob = new Blob([glbArrayBuffer], { type: "model/gltf-binary" });
    const { error: uploadError } = await supabase.storage
      .from("trinkets")
      .upload(modelStoragePath, modelBlob, {
        contentType: "model/gltf-binary",
        upsert: false,
      });
    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    // Update trinket record
    const { data: updated, error: updateError } = await supabase
      .from("trinkets")
      .update({ model_path: modelStoragePath })
      .eq("id", trinketId)
      .eq("owner_id", user.id)
      .select("id, model_path")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `DB update failed: ${updateError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ...result, trinketId: updated.id, model_path: updated.model_path },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to call generator" },
      { status: 502 },
    );
  }
}

