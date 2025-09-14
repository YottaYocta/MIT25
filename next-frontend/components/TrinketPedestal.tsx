"use client";
import { useEffect, useState } from "react";
import GlassmorphicPedestal from "./GlassmorphicPedestal";
import { Trinket } from "@/lib/types";

interface Props {
  trinket: Trinket;
  focused: boolean;
  onClick?: () => void;
}

export default function TrinketPedestal({ trinket, focused, onClick }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      // Use full URL first if present
      if (trinket.image_url) {
        setImageUrl(trinket.image_url);
        return;
      }

      // Fallback to trying image_path as URL (if accessible)
      if (trinket.image_path) {
        setImageUrl(trinket.image_path);
        return;
      }

      // Optional: fallback to API fetch for blob URL
      try {
        const res = await fetch(`/api/trinkets/${trinket.id}/files/image`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          if (isMounted) setImageUrl(url);
        }
      } catch {
        // fail silently
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [trinket]);

  return (
    <GlassmorphicPedestal
      imageUrl={imageUrl || "/placeholder.png"}
      focused={focused}
      handleClick={onClick}
    />
  );
}
