// @/next-frontend/components/Collections.tsx
"use client";

import { useEffect, useState } from "react";
import { Trinket } from "@/lib/types";
import RandomTrinketCard from "./RandomTrinketCard";
import { SpinningCarousel } from "./SpinningCarousel";

interface GroupedRandomTrinketsProps {
  minGroupSize?: number;
  maxGroupSize?: number;
  maxGroups?: number; // Optional: limit total number of groups/cards rendered
  user?: { id: string }; // optional user prop to filter trinkets by owner_id
}

function groupTrinketsRandomly<T>(
  trinkets: T[],
  minGroupSize = 2,
  maxGroupSize = 5
): T[][] {
  const shuffled = [...trinkets].sort(() => Math.random() - 0.5);
  const groups: T[][] = [];
  let i = 0;
  while (i < shuffled.length) {
    const groupSize =
      Math.floor(Math.random() * (maxGroupSize - minGroupSize + 1)) +
      minGroupSize;
    groups.push(shuffled.slice(i, i + groupSize));
    i += groupSize;
  }
  return groups;
}

export function Collections({
  minGroupSize = 2,
  maxGroupSize = 4,
  maxGroups = 5,
  user,
}: GroupedRandomTrinketsProps) {
  const [allTrinkets, setAllTrinkets] = useState<Trinket[]>([]);
  const [trinketGroups, setTrinketGroups] = useState<Trinket[][]>([]);

  useEffect(() => {
    const fetchTrinkets = async () => {
      try {
        const res = await fetch("/api/trinkets", { credentials: "include" });
        const json: Trinket[] = await res.json();
        setAllTrinkets(json);
      } catch (e) {
        console.error("Failed to fetch trinkets", e);
      }
    };
    fetchTrinkets();
  }, []);

  useEffect(() => {
    if (allTrinkets.length === 0) {
      setTrinketGroups([]);
      return;
    }

    // Filter trinkets if user is provided
    let filteredTrinkets = allTrinkets;
    if (user) {
      filteredTrinkets = allTrinkets.filter(
        (trinket) => trinket.owner_id === user.id
      );
    }

    const grouped = groupTrinketsRandomly(
      filteredTrinkets,
      minGroupSize,
      maxGroupSize
    );
    setTrinketGroups(grouped.slice(0, maxGroups));
  }, [allTrinkets, minGroupSize, maxGroupSize, maxGroups, user]);

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
      {trinketGroups.map((group, idx) => (
        <RandomTrinketCard
          key={idx}
          trinkets={group}
          renderSubtitle={(t) => t.note ?? "No note"}
          renderDate={(t) => new Date(t.created_at).toLocaleDateString()}
          focused={currentIndex === idx}
        />
      ))}
    </SpinningCarousel>
  );
}
