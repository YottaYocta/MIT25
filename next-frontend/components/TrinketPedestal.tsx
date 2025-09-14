"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassmorphicPedestal from "./GlassmorphicPedestal";
import { Trinket } from "@/lib/types";

interface Props {
  trinket: Trinket;
  focused: boolean;
  onClick?: () => void;
}

export default function TrinketPedestal({ trinket, focused, onClick }: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      // Prefer nano url if provided
      if (trinket.nano_url) {
        setImageUrl(trinket.nano_url);
        return;
      }
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

      // Optional: fallback to API fetch for blob URL (prefer nano)
      try {
        let res = await fetch(`/api/trinkets/${trinket.id}/files/nano`);
        if (!res.ok) {
          res = await fetch(`/api/trinkets/${trinket.id}/files/image`);
        }
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

  const handleClick = () => {
    // Call the custom onClick if provided (for existing functionality)
    if (onClick) {
      onClick();
    }
    // Navigate to the trinket detail page
    router.push(`/trinkets/${trinket.id}`);
  };

  return (
    <GlassmorphicPedestal
      imageUrl={imageUrl || "/placeholder.png"}
      focused={focused}
      handleClick={handleClick}
    />
  );
}
