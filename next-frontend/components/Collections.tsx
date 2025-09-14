// @/next-frontend/components/Collections.tsx
"use client";

import { useEffect, useState } from "react";
import { Trinket } from "@/lib/types";
import CollectionCard from "./CollectionCard";
import { SpinningCarousel } from "./SpinningCarousel";

interface CollectionsProps {
  maxCollections?: number;
  user?: { id: string };
}

export function Collections({ maxCollections = 8, user }: CollectionsProps) {
  const [collections, setCollections] = useState<Array<{ id: string; name: string; created_at: string }>>([]);
  const [trinkets, setTrinkets] = useState<Trinket[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, tRes] = await Promise.all([
          fetch("/api/collections", { credentials: "include", cache: "no-store" }),
          fetch("/api/trinkets", { credentials: "include", cache: "no-store" }),
        ]);
        if (!cRes.ok) return;
        const cJson: Array<{ id: string; name: string; created_at: string }> = await cRes.json();
        const tJson: Trinket[] = tRes.ok ? await tRes.json() : [];

        // If user provided, filter both
        const filteredCollections = user ? cJson.filter(() => true) : cJson;
        const filteredTrinkets = user
          ? tJson.filter(t => t.owner_id === user.id)
          : tJson;

        setCollections(filteredCollections.slice(0, maxCollections));
        setTrinkets(filteredTrinkets);
      } catch (e) {
        console.error("Failed to load collections", e);
      }
    };
    load();
  }, [user, maxCollections]);

  const startingIndex = 0;
  const [currentIndex, setCurrentIndex] = useState<null | number>(
    startingIndex
  );

  return (
    <SpinningCarousel
      gapSpacing={110}
      className="h-96 w-full"
      handleFocused={setCurrentIndex}
    >
      {collections.map((col, idx) => {
        const inCollection = trinkets
          .filter(t => t.collection_id === col.id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const cover = inCollection.length > 0 ? inCollection[0] : null;
        return (
          <CollectionCard
            key={col.id}
            collection={col}
            coverTrinket={cover}
            subtitle={`${inCollection.length} item${inCollection.length === 1 ? "" : "s"}`}
            focused={currentIndex === idx}
          />
        );
      })}
    </SpinningCarousel>
  );
}
