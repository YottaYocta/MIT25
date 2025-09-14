import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("trinkets").select("*");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  // Add public URLs for all trinkets
  const enhancedData = data?.map(trinket => {
    const enhanced = { ...trinket };
    if (trinket.image_path) {
      const { data: imageUrl } = supabase.storage
        .from("trinkets")
        .getPublicUrl(trinket.image_path);
      enhanced.image_url = imageUrl.publicUrl;
    }
    if (trinket.model_path) {
      const { data: modelUrl } = supabase.storage
        .from("trinkets")
        .getPublicUrl(trinket.model_path);
      enhanced.model_url = modelUrl.publicUrl;
    }
    return enhanced;
  });

  return NextResponse.json(enhancedData);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("trinkets")
    .insert({ ...body, owner_id: user.id })
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
