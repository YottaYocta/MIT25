// We use these routes to download any image or model file from trinket
// EXAMPLE USAGE:
// const imageBlob = await fetch('/api/trinkets/trinket-id/files/image').then(r => r.blob());
// const modelBlob = await fetch('/api/trinkets/trinket-id/files/model').then(r => r.blob()); 

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string; filename: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { id, filename } = await ctx.params;
  const supabase = await createClient();

  // First verify the trinket exists and get the file paths
  const { data: trinket, error: trinketError } = await supabase
    .from("trinkets")
    .select("image_path, model_path, nano_image_path")
    .eq("id", id)
    .maybeSingle();

  if (trinketError || !trinket) {
    return NextResponse.json({ error: "Trinket not found" }, { status: 404 });
  }

  // Determine which file to serve based on filename
  let filePath: string | null = null;
  let contentType = "application/octet-stream";
  let fileName = filename;

  if (filename === "image" && trinket.image_path) {
    filePath = trinket.image_path;
    // Extract filename from path for proper download name
    fileName = trinket.image_path.split('/').pop() || 'image';

    // Determine content type from file extension
    const ext = trinket.image_path.toLowerCase();
    if (ext.endsWith('.png')) contentType = "image/png";
    else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) contentType = "image/jpeg";
    else if (ext.endsWith('.webp')) contentType = "image/webp";
    else if (ext.endsWith('.gif')) contentType = "image/gif";
  } else if (filename === "model" && trinket.model_path) {
    filePath = trinket.model_path;
    // Extract filename from path for proper download name
    fileName = trinket.model_path.split('/').pop() || 'model';

    // Determine content type from file extension
    const ext = trinket.model_path.toLowerCase();
    if (ext.endsWith('.glb')) contentType = "model/gltf-binary";
    else if (ext.endsWith('.gltf')) contentType = "model/gltf+json";
    else if (ext.endsWith('.obj')) contentType = "application/octet-stream"; // OBJ files
    else if (ext.endsWith('.fbx')) contentType = "application/octet-stream"; // FBX files
  } else if (filename === "nano" && trinket.nano_image_path) {
    filePath = trinket.nano_image_path;
    fileName = trinket.nano_image_path.split('/').pop() || 'nano';

    const ext = trinket.nano_image_path.toLowerCase();
    if (ext.endsWith('.png')) contentType = "image/png";
    else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) contentType = "image/jpeg";
    else if (ext.endsWith('.webp')) contentType = "image/webp";
    else if (ext.endsWith('.gif')) contentType = "image/gif";
  }

  if (!filePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    // Download the file from Supabase storage
    const { data, error } = await supabase.storage
      .from("trinkets")
      .download(filePath);

    if (error || !data) {
      return NextResponse.json({ error: "File download failed" }, { status: 500 });
    }

    // Convert blob to array buffer for response
    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
