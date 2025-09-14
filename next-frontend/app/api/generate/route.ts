import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
const GENERATOR_URL_DEFAULT =
  process.env.GENERATOR_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_GENERATOR_URL?.replace(/\/$/, "") ||
  "https://cb7943f2c7d6.ngrok-free.app";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  let texture = true;
  let save_preprocessed_image = false;
  const type = "glb" as const;
  let image: string | null = null;
  let trinketId: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    texture = (form.get("texture") ?? "true") === "true";
    save_preprocessed_image = (form.get("save_preprocessed_image") ?? "false") === "true";
    // Type is fixed to "glb" for now; ignore form type overrides
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
    // Type is fixed to "glb" for now; ignore body type overrides
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
    // Allow overriding generator URL from body/header for flexibility
    let generatorUrl = GENERATOR_URL_DEFAULT;
    try {
      const maybeBody = contentType.includes("application/json") ? (await req.clone().json().catch(() => null)) as (GenerateProxyRequest & { generator_url?: string }) | null : null;
      const headerOverride = req.headers.get("x-generator-url") || undefined;
      const override = (maybeBody && maybeBody.generator_url) || headerOverride || undefined;
      if (override && typeof override === "string") {
        generatorUrl = override.replace(/\/$/, "");
      }
    } catch {}

    const generatorResponse = await fetch(`${generatorUrl}/generate`, {
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

    // Attach model and nano image to trinket if provided
    const meshFile = (result && typeof result === "object" && "mesh_file" in result)
      ? (result as { mesh_file?: string }).mesh_file
      : undefined;
    const nanoField = (result && typeof result === "object" && "nano_image" in result)
      ? (result as { nano_image?: string }).nano_image
      : undefined;
    const nanoBase64Alt = (result && typeof result === "object" && "nano_image_base64" in result)
      ? (result as { nano_image_base64?: string }).nano_image_base64
      : undefined;
    const preprocessedField = (result && typeof result === "object" && "preprocessed_image" in result)
      ? (result as { preprocessed_image?: string }).preprocessed_image
      : undefined;
    const preprocessedBase64Alt = (result && typeof result === "object" && "preprocessed_image_base64" in result)
      ? (result as { preprocessed_image_base64?: string }).preprocessed_image_base64
      : undefined;
    // Broaden capture: scan for any string fields that likely reference a small image
    const scannedStringFields: string[] = [];
    if (result && typeof result === "object") {
      for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
        if (
          typeof value === "string" &&
          /(nano|preview|thumb|thumbnail|preprocess|preprocessed)/i.test(key)
        ) {
          scannedStringFields.push(value as string);
        }
      }
    }
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
    const meshResp = await fetch(`${generatorUrl}/files/${encodeURIComponent(meshFile)}`);
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

    // Optionally download and upload the nano image
    let nanoStoragePath: string | null = null;
    let nanoSource: string | null = null;
    let nanoUploadErrorMsg: string | null = null;
    {
      let nanoArrayBuffer: ArrayBuffer | null = null;
      let nanoContentType = "image/png";

      // Try to resolve a file/URL candidate first (prefer explicit file/url over base64)
      const rawCandidates = [nanoField, preprocessedField, ...scannedStringFields].filter(
        (v): v is string => typeof v === "string" && !!v,
      );

      for (const candidate of rawCandidates) {
        try {
          // If data URL, handle in base64 branch below
          if (candidate.startsWith("data:")) {
            continue;
          }

          // Absolute URL: fetch directly
          if (/^https?:\/\//i.test(candidate)) {
            const nanoResp = await fetch(candidate);
            if (nanoResp.ok) {
              nanoArrayBuffer = await nanoResp.arrayBuffer();
              nanoContentType = nanoResp.headers.get("content-type") || nanoContentType;
              nanoSource = "url";
              break;
            }
          } else {
            // Treat as a generator files reference
            const candidateNoLead = candidate.replace(/^\/+/, "");
            const hasFilesPrefix = /^\/?files\//i.test(candidate);
            const encodedPath = encodeURIComponent(candidateNoLead);
            const urlEncoded = hasFilesPrefix
              ? `${generatorUrl}/${candidateNoLead.replace(/^\/+/, "")}`
              : `${generatorUrl}/files/${encodedPath}`;
            const urlPlain = hasFilesPrefix
              ? `${generatorUrl}/${candidateNoLead.replace(/^\/+/, "")}`
              : `${generatorUrl}/files/${candidateNoLead}`;

            let nanoResp: Response | null = null;
            try { nanoResp = await fetch(urlEncoded); } catch {}
            if (!nanoResp || !nanoResp.ok) {
              try { nanoResp = await fetch(urlPlain); } catch {}
            }
            if (nanoResp && nanoResp.ok) {
              nanoArrayBuffer = await nanoResp.arrayBuffer();
              nanoContentType = nanoResp.headers.get("content-type") || nanoContentType;
              nanoSource = "generator_file";
              break;
            }
          }
        } catch {}
      }

      // If not downloaded, check for base64/data-url via explicit alt or overloaded fields
      const maybeBase64 = nanoArrayBuffer
        ? null
        : (nanoBase64Alt || preprocessedBase64Alt || scannedStringFields.find(s => typeof s === "string") || nanoField || preprocessedField);
      if (!nanoArrayBuffer && maybeBase64 && typeof maybeBase64 === "string") {
        const commaIdx2 = maybeBase64.indexOf(",");
        const isDataUrl = maybeBase64.startsWith("data:") && commaIdx2 > 0;
        const base64Payload = isDataUrl ? maybeBase64.slice(commaIdx2 + 1) : maybeBase64;
        try {
          const binary = Buffer.from(base64Payload, "base64");
          nanoArrayBuffer = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
          if (isDataUrl) {
            const header = maybeBase64.slice(5, maybeBase64.indexOf(";", 5));
            if (header) nanoContentType = header;
          }
          nanoSource = isDataUrl ? "data_url" : "base64";
        } catch {}
      }

      if (nanoArrayBuffer) {
        const ext = nanoContentType.includes("png")
          ? "png"
          : nanoContentType.includes("webp")
          ? "webp"
          : nanoContentType.includes("jpeg") || nanoContentType.includes("jpg")
          ? "jpg"
          : "png";

        // Build storage path: nano/{user.id}/{image.id}.{ext}
        let imageIdBase = trinketId || "image";
        const { data: trinketRow } = await supabase
          .from("trinkets")
          .select("image_path")
          .eq("id", trinketId)
          .eq("owner_id", user.id)
          .maybeSingle();
        if (trinketRow?.image_path) {
          const base = trinketRow.image_path.split("/").pop() || "image";
          imageIdBase = base.includes(".") ? base.slice(0, base.lastIndexOf(".")) : base;
        }

        nanoStoragePath = `nano/${user.id}/${imageIdBase}.${ext}`;

        const nanoBlob = new Blob([nanoArrayBuffer], { type: nanoContentType });
        const { error: nanoUploadError } = await supabase.storage
          .from("trinkets")
          .upload(nanoStoragePath, nanoBlob, {
            contentType: nanoContentType,
            upsert: true,
          });
        if (nanoUploadError) {
          nanoUploadErrorMsg = nanoUploadError.message || "unknown";
          nanoStoragePath = null;
        }
      }
    }

    // Update trinket record
    const { data: updated, error: updateError } = await supabase
      .from("trinkets")
      .update({ model_path: modelStoragePath, nano_image_path: nanoStoragePath })
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
      { ...result, trinketId: updated.id, model_path: updated.model_path, nano_image_path: nanoStoragePath, _debug: { used_generator_url: generatorUrl, nano_source: nanoSource, nano_target_path: nanoStoragePath, nano_upload_error: nanoUploadErrorMsg, has_nano: Boolean(nanoStoragePath), scanned_fields: scannedStringFields } },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed to call generator" },
      { status: 502 },
    );
  }
}

