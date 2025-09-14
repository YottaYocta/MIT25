import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const title = (form.get("title") as string) || null;
  const note = (form.get("note") as string) || null;
  const collectionIdRaw = (form.get("collection_id") as string) || null;
  const collection_id = collectionIdRaw && collectionIdRaw.length > 0 ? collectionIdRaw : null;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const storagePath = `images/${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("trinkets")
    .upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
  if (uploadError)
    return NextResponse.json(
      { error: uploadError.message },
      { status: 400 },
    );

  const { data: momento, error: insertError } = await supabase
    .from("trinkets")
    .insert({
      owner_id: user.id,
      title,
      note,
      image_path: storagePath,
      model_path: "",
      visibility: "public",
      collection_id,
    })
    .select("*")
    .single();

  if (insertError)
    return NextResponse.json(
      { error: insertError.message },
      { status: 400 },
    );

  return NextResponse.json(momento, { status: 201 });
}


