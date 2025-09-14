import type { Metadata } from "next";
import React from "react";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  let trinketTitle: string | undefined;
  let trinketNote: string | undefined;
  let nanoPublicUrl: string | undefined;
  let imagePublicUrl: string | undefined;
  let ownerId: string | undefined;
  let imageId: string | undefined;
  let nanoImagePath: string | undefined;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trinkets")
      .select("id,title,note,owner_id,image_path,nano_image_path")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      trinketTitle = data.title || undefined;
      trinketNote = data.note || undefined;
      ownerId = data.owner_id || undefined;
      imageId = data.id || undefined;
      nanoImagePath = data.nano_image_path || undefined;

      if (data.nano_image_path) {
        const { data: nanoUrl } = supabase.storage
          .from("trinkets")
          .getPublicUrl(data.nano_image_path);
        nanoPublicUrl = nanoUrl.publicUrl;
      }
      if (data.image_path) {
        const { data: imageUrl } = supabase.storage
          .from("trinkets")
          .getPublicUrl(data.image_path);
        imagePublicUrl = imageUrl.publicUrl;
      }

      console.log("[generateMetadata] Loaded trinket for", id, {
        nanoImagePath,
        nanoPublicUrl,
        imagePublicUrl,
        ownerId,
        imageId,
      });
    }
  } catch {
    // Ignore errors; fall back to defaults
  }

  const title = trinketTitle ? `Trinket - ${trinketTitle}` : "Trinket";
  const description = trinketNote || "Collect your world.";

  // Prefer nano preview; fall back to full image if available
  // Prefer nano public URL; otherwise fall back to image public URL
  const imageUrl = nanoPublicUrl || imagePublicUrl || undefined;
  console.log("[generateMetadata] Using preview image for", id, imageUrl);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default function TrinketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}


