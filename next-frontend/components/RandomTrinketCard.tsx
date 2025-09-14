"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!trinkets.length) return;

    const randomIndex = Math.floor(Math.random() * trinkets.length);
    const chosen = trinkets[randomIndex];
    setRandomTrinket(chosen);

    const loadImage = async () => {
      if (chosen.image_url) {
        setImageUrl(chosen.image_url);
        return;
      }

      // Fallback: fetch the image and use a blob URL
      try {
        const res = await fetch(`/api/trinkets/${chosen.id}/files/image`);
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

  return (
    <ModelCard
      title={randomTrinket.title}
      subtitle={renderSubtitle(randomTrinket)}
      date={renderDate(randomTrinket)}
      imageUrl={imageUrl}
      handleClick={() => onClick?.(randomTrinket)}
      focused={focused}
    />
  );
};

export default RandomTrinketCard;
