import type { Metadata } from "next";
import React from "react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  let trinketTitle: string | undefined;
  let trinketNote: string | undefined;
  let nanoPublicUrl: string | undefined;
  let imagePublicUrl: string | undefined;

  try {
    const res = await fetch(`/api/trinkets/${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      trinketTitle = data?.title || undefined;
      trinketNote = data?.note || undefined;
      nanoPublicUrl = data?.nano_url || undefined;
      imagePublicUrl = data?.image_url || undefined;
    }
  } catch {
    // Ignore errors; fall back to defaults
  }

  const title = trinketTitle ? `trinket.world - ${trinketTitle}` : "trinket.world";
  const description = trinketNote || "Collect your world.";

  // Prefer nano preview; fall back to full image if available
  const imageUrl = nanoPublicUrl || imagePublicUrl || undefined;

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


