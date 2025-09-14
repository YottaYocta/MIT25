import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Simple CORS for public usage. Adjust origin as needed.
const ALLOWED_ORIGIN = process.env.PUBLIC_UPLOAD_ALLOWED_ORIGIN || "*";

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: Request) {
  // Two input formats supported:
  // - multipart/form-data: fields user_id (string), file (File), title (opt), note (opt)
  // - application/json: { user_id: string, image_base64: string, title?: string, note?: string }
  const contentType = req.headers.get("content-type") || "";
  const fixedUserId = process.env.PUBLIC_UPLOAD_FIXED_USER_ID || null;

  try {
    const supabase = createAdminClient();
    let userId: string | null = null;
    let title: string | null = null;
    let note: string | null = null;
    let file: Blob | File | null = null;
    let inferredMime: string | null = null;
    let inferredExt: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      userId = (form.get("user_id") as string) || null;
      title = ((form.get("title") as string) || null) as string | null;
      note = ((form.get("note") as string) || null) as string | null;
      const f = form.get("file");
      if (f instanceof File) {
        file = f;
        inferredMime = f.type || null;
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      userId = body.user_id ?? null;
      title = body.title ?? null;
      note = body.note ?? null;
      if (typeof body.image_base64 === "string" && body.image_base64.length > 0) {
        const b64Str: string = body.image_base64;
        const commaIdx = b64Str.indexOf(",");
        const header = commaIdx >= 0 ? b64Str.slice(0, commaIdx) : "";
        const base64 = commaIdx >= 0 ? b64Str.slice(commaIdx + 1) : b64Str;
        const mimeMatch = header.match(/^data:([^;]+);base64$/i);
        inferredMime = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const binary = Buffer.from(base64, "base64");
        file = new Blob([binary], { type: inferredMime });
        // basic extension inference
        inferredExt = inferredMime?.split("/")[1] || null;
      }
    }

    if (fixedUserId) {
      userId = fixedUserId;
    }
    if (!userId) {
      return cors(
        NextResponse.json({ error: "Missing user_id" }, { status: 400 }),
      );
    }
    if (!file) {
      return cors(
        NextResponse.json({ error: "No image provided" }, { status: 400 }),
      );
    }

    const fileExt = (file instanceof File && file.name.includes("."))
      ? file.name.split(".").pop()?.toLowerCase() || "jpg"
      : (inferredExt || (inferredMime === "image/png" ? "png" : "jpg"));
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const storagePath = `images/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("trinkets")
      .upload(storagePath, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (uploadError) {
      return cors(
        NextResponse.json({ error: uploadError.message }, { status: 400 }),
      );
    }

    const { data: record, error: insertError } = await supabase
      .from("trinkets")
      .insert({
        owner_id: userId,
        title,
        note,
        image_path: storagePath,
        model_path: "",
        visibility: "public",
      })
      .select("*")
      .single();

    if (insertError) {
      return cors(
        NextResponse.json({ error: insertError.message }, { status: 400 }),
      );
    }

    // Optionally include a public URL if the bucket is public
    const { data: publicUrlData } = supabase.storage
      .from("trinkets")
      .getPublicUrl(storagePath);

    return cors(
      NextResponse.json(
        { ...record, image_path: storagePath, image_url: publicUrlData?.publicUrl },
        { status: 201 },
      ),
    );
  } catch (err) {
    const message = (err as Error)?.message || "Unexpected error";
    return cors(NextResponse.json({ error: message }, { status: 500 }));
  }
}


