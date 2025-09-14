"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ImageViewer() {
  const [trinketId, setTrinketId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleViewImage = async () => {
    if (!trinketId.trim()) {
      setError("Please enter a trinket ID");
      return;
    }

    setLoading(true);
    setError("");
    setImageUrl(null);

    try {
      // First try to get the trinket data which includes the image URL
      const trinketResponse = await fetch(`/api/trinkets/${trinketId}`);

      if (!trinketResponse.ok) {
        const errorData = await trinketResponse.json();
        throw new Error(errorData.error || `Trinket not found: ${trinketResponse.status}`);
      }

      const trinketData = await trinketResponse.json();

      if (trinketData.image_url) {
        setImageUrl(trinketData.image_url);
      } else {
        // Fallback: try the direct download endpoint
        const imageResponse = await fetch(`/api/trinkets/${trinketId}/files/image`);
        if (!imageResponse.ok) {
          throw new Error(`Failed to load image: ${imageResponse.status}`);
        }

        // Create a blob URL for display
        const blob = await imageResponse.blob();
        const blobUrl = URL.createObjectURL(blob);
        setImageUrl(blobUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load image");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTrinketId("");
    setImageUrl(null);
    setError("");
  };

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">View Trinket Image</CardTitle>
          <CardDescription>
            Enter a trinket ID to display its associated image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trinket-id">Trinket ID</Label>
            <Input
              id="trinket-id"
              type="text"
              placeholder="e.g., abc-123-def-456"
              value={trinketId}
              onChange={(e) => setTrinketId(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleViewImage();
                }
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleViewImage}
              disabled={loading || !trinketId.trim()}
              className="flex-1"
            >
              {loading ? "Loading..." : "View Image"}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={loading}
            >
              Clear
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {imageUrl && (
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Trinket Image (ID: {trinketId})</h3>
              <div className="max-w-full overflow-hidden rounded-lg border">
                <img
                  src={imageUrl}
                  alt={`Trinket ${trinketId}`}
                  className="max-w-full h-auto mx-auto"
                  style={{ maxHeight: "600px" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
