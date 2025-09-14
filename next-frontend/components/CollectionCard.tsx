"use client";

import React, { useEffect, useState } from "react";
import ModelCard from "./ModelCard";
import { Trinket } from "@/lib/types";

interface CollectionCardProps {
  collection: { id: string; name: string; created_at: string };
  coverTrinket: Trinket | null;
  subtitle?: string;
  focused?: boolean;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  coverTrinket,
  subtitle = "Collection",
  focused,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!coverTrinket) {
        setImageUrl(null);
        return;
      }

      if (coverTrinket.nano_url) {
        setImageUrl(coverTrinket.nano_url);
        return;
      }
      if (coverTrinket.image_url) {
        setImageUrl(coverTrinket.image_url);
        return;
      }

      try {
        let res = await fetch(`/api/trinkets/${coverTrinket.id}/files/nano`);
        if (!res.ok) {
          res = await fetch(`/api/trinkets/${coverTrinket.id}/files/image`);
        }
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch {
        // ignore
      }
    };

    loadImage();
  }, [coverTrinket]);

  const placeholderSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">' +
        '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="#86A8FF"/><stop offset="100%" stopColor="#8F98FA"/></linearGradient></defs>' +
        '<rect width="100%" height="100%" fill="url(#g)"/>' +
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, Segoe UI, Roboto" font-size="28">No cover yet</text>' +
      "</svg>"
    );

  const displayImage = imageUrl ?? placeholderSvg;

  return (
    <ModelCard
      title={collection.name}
      subtitle={subtitle}
      date={new Date(collection.created_at).toLocaleDateString()}
      imageUrl={displayImage}
      focused={focused}
    />
  );
};

export default CollectionCard;


