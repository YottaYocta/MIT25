import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Params) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trinkets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Generate signed URLs for files if they exist
  const enhancedData = { ...data };
  if (data.image_path) {
    const { data: imageUrl } = supabase.storage
      .from("trinkets")
      .getPublicUrl(data.image_path);
    enhancedData.image_url = imageUrl.publicUrl;
  }
  if (data.model_path) {
    const { data: modelUrl } = supabase.storage
      .from("trinkets")
      .getPublicUrl(data.model_path);
    enhancedData.model_url = modelUrl.publicUrl;
  }
  if (data.nano_image_path) {
    const { data: nanoUrl } = supabase.storage
      .from("trinkets")
      .getPublicUrl(data.nano_image_path);
    enhancedData.nano_url = nanoUrl.publicUrl;
  }

  return NextResponse.json(enhancedData);
}

export async function PATCH(req: Request, ctx: Params) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  for (const key of ["title", "note", "visibility"]) {
    if (key in body) allowed[key] = body[key];
  }

  const { data, error } = await supabase
    .from("trinkets")
    .update(allowed)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}


