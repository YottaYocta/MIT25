// We use these routes to download any image or model file from trinket
// EXAMPLE USAGE:
// const imageBlob = await fetch('/api/trinkets/trinket-id/files/image').then(r => r.blob());
// const modelBlob = await fetch('/api/trinkets/trinket-id/files/model').then(r => r.blob()); 

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string; filename: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { id, filename } = await ctx.params;
  console.log('🔍 API Route: Requested trinket ID:', id, 'filename:', filename);
  
  const supabase = await createClient();

  // First check if the trinket is publicly accessible by checking its visibility
  console.log('🔍 API Route: Checking trinket visibility...');
  const { data: trinketVisibility, error: visibilityError } = await supabase
    .from("trinkets")
    .select("visibility")
    .eq("id", id)
    .maybeSingle();

  if (visibilityError || !trinketVisibility) {
    console.error('❌ API Route: Could not check trinket visibility:', visibilityError);
    return NextResponse.json({ error: "Trinket not found" }, { status: 404 });
  }

  // For non-public trinkets, check authentication
  if (trinketVisibility.visibility !== 'public') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ API Route: Private trinket requires authentication');
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  // First verify the trinket exists and get the file paths
  console.log('🔍 API Route: Querying database for trinket...');
  const { data: trinket, error: trinketError } = await supabase
    .from("trinkets")
    .select("image_path, model_path, nano_image_path")
    .eq("id", id)
    .maybeSingle();

  console.log('📊 API Route: Database query result:', { trinket, trinketError });

  if (trinketError || !trinket) {
    console.error('❌ API Route: Trinket not found or error:', trinketError);
    return NextResponse.json({ error: "Trinket not found" }, { status: 404 });
  }

  // Determine which file to serve based on filename
  let filePath: string | null = null;
  let contentType = "application/octet-stream";
  let fileName = filename;

  console.log('🔍 API Route: Processing filename:', filename);
  console.log('🔍 API Route: Available paths:', {
    image_path: trinket.image_path,
    model_path: trinket.model_path,
    nano_image_path: trinket.nano_image_path
  });

  if (filename === "image" && trinket.image_path) {
    filePath = trinket.image_path;
    fileName = trinket.image_path.split('/').pop() || 'image';
    const ext = trinket.image_path.toLowerCase();
    if (ext.endsWith('.png')) contentType = "image/png";
    else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) contentType = "image/jpeg";
    else if (ext.endsWith('.webp')) contentType = "image/webp";
    else if (ext.endsWith('.gif')) contentType = "image/gif";
    console.log('🖼️ API Route: Serving image file:', filePath);
  } else if (filename === "model" && trinket.model_path) {
    filePath = trinket.model_path;
    fileName = trinket.model_path.split('/').pop() || 'model';
    const ext = trinket.model_path.toLowerCase();
    if (ext.endsWith('.glb')) contentType = "model/gltf-binary";
    else if (ext.endsWith('.gltf')) contentType = "model/gltf+json";
    else if (ext.endsWith('.obj')) contentType = "application/octet-stream";
    else if (ext.endsWith('.fbx')) contentType = "application/octet-stream";
    console.log('🎨 API Route: Serving model file:', filePath, 'with content type:', contentType);
  } else if (filename === "nano" && trinket.nano_image_path) {
    filePath = trinket.nano_image_path;
    fileName = trinket.nano_image_path.split('/').pop() || 'nano';
    const ext = trinket.nano_image_path.toLowerCase();
    if (ext.endsWith('.png')) contentType = "image/png";
    else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) contentType = "image/jpeg";
    else if (ext.endsWith('.webp')) contentType = "image/webp";
    else if (ext.endsWith('.gif')) contentType = "image/gif";
    console.log('🖼️ API Route: Serving nano image file:', filePath);
  }

  if (!filePath) {
    console.error('❌ API Route: No file path found for filename:', filename);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    // Download the file from Supabase storage
    console.log('🔍 API Route: Attempting to download from Supabase storage:', filePath);
    const { data, error } = await supabase.storage
      .from("trinkets")
      .download(filePath);

    console.log('📊 API Route: Supabase storage result:', { hasData: !!data, error });

    if (error || !data) {
      console.error('❌ API Route: File download failed:', error);
      return NextResponse.json({ error: "File download failed" }, { status: 500 });
    }

    console.log('✅ API Route: File downloaded successfully, size:', data.size, 'bytes');
    // Convert blob to array buffer for response
    const arrayBuffer = await data.arrayBuffer();

    console.log('✅ API Route: Sending response with content type:', contentType, 'and size:', arrayBuffer.byteLength, 'bytes');
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        // Remove Content-Disposition for models to allow inline loading
        ...(filename === "model" ? {} : { "Content-Disposition": `attachment; filename="${fileName}"` }),
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
        "Access-Control-Allow-Origin": "*", // Allow CORS for model loading
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (downloadError) {
    console.error('❌ API Route: Exception during file download:', downloadError);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
