import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type GenerateRequestBody = {
  trinketId: string;
  imageBase64: string; // base64 without data URL prefix
  texture?: boolean;
  type?: "glb";
  remove_background?: boolean;
  optimize_mesh?: boolean;
  seed?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  octree_resolution?: number;
  face_count?: number;
};

// Default generator endpoint; can be overridden with env if provided
const GENERATOR_URL =
  process.env.GENERATOR_URL?.replace(/\/$/, "") ||
  "https://cb7943f2c7d6.ngrok-free.app";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const {
    trinketId,
    imageBase64,
    texture = true,
    type = "glb",
    // remove_background = true,
    // optimize_mesh = true,
    // seed,
    // num_inference_steps = 10,
    // guidance_scale = 5.0,
    // octree_resolution = 128,
    // face_count = 40000,
  } = body || ({} as GenerateRequestBody);

  if (!trinketId || !imageBase64) {
    return NextResponse.json(
      { error: "Missing required fields: trinketId, imageBase64" },
      { status: 400 },
    );
  }

  // Call external generator service
  let glbArrayBuffer: ArrayBuffer;
  try {
    const generatorResponse = await fetch(`${GENERATOR_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: imageBase64,
        texture,
        type,
        // remove_background,
        // optimize_mesh,
        // seed,
        // num_inference_steps,
        // guidance_scale,
        // octree_resolution,
        // face_count,
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
        { status: 502 },
      );
    }

    glbArrayBuffer = await generatorResponse.arrayBuffer();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to call generator" },
      { status: 502 },
    );
  }

  // Upload GLB to Supabase Storage
  const modelFileName = `${crypto.randomUUID()}.glb`;
  const modelStoragePath = `models/${user.id}/${modelFileName}`;

  try {
    const modelBlob = new Blob([glbArrayBuffer], {
      type: "model/gltf-binary",
    });
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
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to upload model" },
      { status: 500 },
    );
  }

  // Update trinket row
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
    {
      status: "success",
      trinketId: updated.id,
      model_path: updated.model_path,
    },
    { status: 200 },
  );
}


