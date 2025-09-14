"use client";

import { useState, useEffect } from "react";

import { SpinningCarousel } from "./SpinningCarousel";
import TrinketPedestal from "./TrinketPedestal";
import { Trinket } from "@/lib/types";

interface RecentTrinketsProps {
  count?: number; // how many recent trinkets to show, default 10
}

export function RecentTrinkets({ count = 10 }: RecentTrinketsProps) {
  const [allTrinkets, setAllTrinkets] = useState<Trinket[]>([]);
  const [recentTrinkets, setRecentTrinkets] = useState<Trinket[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Fetch all trinkets once on mount
  useEffect(() => {
    const fetchAllTrinkets = async () => {
      try {
        const res = await fetch("/api/trinkets", { credentials: "include" });
        const json: Trinket[] = await res.json();
        setAllTrinkets(json);
      } catch (e) {
        console.error(e);
      }
    };

    fetchAllTrinkets();
  }, []);

  // Whenever allTrinkets or count changes, update recentTrinkets sorted by created_at desc
  useEffect(() => {
    if (!allTrinkets.length) {
      setRecentTrinkets([]);
      setFocusedIndex(0);
      return;
    }

    const sorted = [...allTrinkets].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setRecentTrinkets(sorted.slice(0, count));
    setFocusedIndex(0);
  }, [allTrinkets, count]);

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full max-w-full overflow-x-visible h-96 pt-20">
        {recentTrinkets.length > 0 && (
          <SpinningCarousel
            gapSpacing={0}
            coordMapping={{ power: 1.4 }}
            handleFocused={(index) => setFocusedIndex(index)}
            className="h-full"
          >
            {recentTrinkets.map((trinket, index) => (
              <TrinketPedestal
                key={trinket.id}
                trinket={trinket}
                focused={index === focusedIndex}
              />
            ))}
          </SpinningCarousel>
        )}
      </div>
    </div>
  );
}
