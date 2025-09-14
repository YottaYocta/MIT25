"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TrinketsActions() {
  const [result, setResult] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrinkets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/trinkets", { credentials: "include" });
      const json = await res.json();
      setResult(json);
    } finally {
      setIsLoading(false);
    }
  };

  const createTrinket = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/trinkets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test Trinket",
          note: "Created from UI",
          image_path: "images/demo.jpg",
          model_path: "",
          visibility: "public",
        }),
      });
      const json = await res.json();
      setResult(json);
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
        <Button onClick={createTrinket} disabled={isLoading}>
          {isLoading ? "Posting..." : "POST /api/trinkets"}
        </Button>
      </div>
      <pre className="text-xs font-mono p-3 rounded border max-h-64 overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}


