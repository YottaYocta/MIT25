"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

import { SpinningCarousel } from "./SpinningCarousel";
import TrinketPedestal from "./TrinketPedestal";
import { Trinket } from "@/lib/types";

export function TrinketsActions() {
  const [result, setResult] = useState<Trinket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0); // <-- Focused index state

  const fetchTrinkets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/trinkets", { credentials: "include" });
      const json = await res.json();
      setResult(json);
      setFocusedIndex(0); // reset focus on new data
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button onClick={fetchTrinkets} disabled={isLoading}>
          {isLoading ? "Loading..." : "GET /api/trinkets"}
        </Button>
      </div>

      <pre className="text-xs font-mono p-3 rounded border max-h-64 overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>

      <div className="w-full max-w-full overflow-x-clip h-96">
        {Array.isArray(result) && result.length > 0 && (
          <SpinningCarousel
            gapSpacing={32}
            coordMapping={{ power: 1.6 }}
            handleFocused={(index) => setFocusedIndex(index)} // update focused index here
          >
            {result.map((trinket, index) => (
              <TrinketPedestal
                key={trinket.id}
                trinket={trinket}
                focused={index === focusedIndex} // pass focused state
                onClick={() => {
                  setFocusedIndex(index);
                  console.log("Clicked:", trinket);
                }}
              />
            ))}
          </SpinningCarousel>
        )}
      </div>
    </div>
  );
}
