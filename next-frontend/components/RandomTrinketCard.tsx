"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ModelCard from "./ModelCard";
import { Trinket } from "@/lib/types";

interface RandomTrinketCardProps {
  trinkets: Trinket[];
  renderDate?: (trinket: Trinket) => string;
  renderSubtitle?: (trinket: Trinket) => string;
  onClick?: (trinket: Trinket) => void;
  focused?: boolean;
}

const RandomTrinketCard: React.FC<RandomTrinketCardProps> = ({
  trinkets,
  renderDate = (t) => new Date(t.created_at).toLocaleDateString(),
  renderSubtitle = (t) => t.note || "No note",
  onClick,
  focused,
}) => {
  const [randomTrinket, setRandomTrinket] = useState<Trinket | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!trinkets.length) return;

    const randomIndex = Math.floor(Math.random() * trinkets.length);
    const chosen = trinkets[randomIndex];
    setRandomTrinket(chosen);

    const loadImage = async () => {
      // Prefer nano if available
      if (chosen.nano_url) {
        setImageUrl(chosen.nano_url);
        return;
      }

      if (chosen.image_url) {
        setImageUrl(chosen.image_url);
        return;
      }

      // Fallback: fetch the nano image and use a blob URL; if that fails, try full image
      try {
        let res = await fetch(`/api/trinkets/${chosen.id}/files/nano`);
        if (!res.ok) {
          res = await fetch(`/api/trinkets/${chosen.id}/files/image`);
        }
        if (!res.ok) {
          console.warn("Failed to fetch image for trinket", chosen.id);
          return;
        }
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setImageUrl(blobUrl);
      } catch (err) {
        console.error("Error fetching image", err);
      }
    };

    loadImage();
  }, [trinkets]);

  if (!randomTrinket || !imageUrl) return null;

  const handleClick = () => {
    // Call the custom onClick if provided (for existing functionality)
    if (onClick) {
      onClick(randomTrinket);
    }
    // Navigate to the trinket detail page
    router.push(`/trinkets/${randomTrinket.id}`);
  };

  return (
    <ModelCard
      title={randomTrinket.title}
      subtitle={renderSubtitle(randomTrinket)}
      date={renderDate(randomTrinket)}
      imageUrl={imageUrl}
      handleClick={handleClick}
      focused={focused}
    />
  );
};

export default RandomTrinketCard;
