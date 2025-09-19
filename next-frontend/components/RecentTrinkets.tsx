// @/next-frontend/components/RecentTrinkets.tsx
"use client";

import { useState, useEffect } from "react";
import { SpinningCarousel } from "./SpinningCarousel";
import TrinketPedestal from "./TrinketPedestal";
import { Trinket } from "@/lib/types";

interface RecentTrinketsProps {
  count?: number; // how many recent trinkets to show, default 10
  filterType?: 'private' | 'public'; // filter type for API query
  user?: { id: string }; // optional user prop to filter trinkets by owner_id (deprecated)
}

export function RecentTrinkets({ count = 100, filterType = 'public' }: RecentTrinketsProps) {
  const [allTrinkets, setAllTrinkets] = useState<Trinket[]>([]);
  const [recentTrinkets, setRecentTrinkets] = useState<Trinket[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Fetch trinkets based on filterType
  useEffect(() => {
    const fetchTrinkets = async () => {
      try {
        const params = new URLSearchParams();
        if (filterType) {
          params.set('filterType', filterType);
        }
        
        const res = await fetch(`/api/trinkets?${params.toString()}`, { 
          credentials: "include" 
        });
        const json: Trinket[] = await res.json();
        setAllTrinkets(json);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTrinkets();
  }, [filterType]);

  // Process trinkets when data changes (API now handles filtering and sorting)
  useEffect(() => {
    if (!allTrinkets.length) {
      setRecentTrinkets([]);
      setFocusedIndex(0);
      return;
    }

    // Filter out trinkets without models and apply count limit
    const trinketsWithModels = allTrinkets.filter((trinket) => {
      return trinket.model_path !== '' && trinket.model_path != null;
    });

    setRecentTrinkets(trinketsWithModels.slice(0, count));
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
