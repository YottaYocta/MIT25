"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GLBModelViewer } from "@/components/glb-model-viewer";

export function ImageViewer() {
  const [trinketId, setTrinketId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
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
    setModelUrl(null);

    try {
      // First try to get the trinket data which includes both image and model URLs
      const trinketResponse = await fetch(`/api/trinkets/${trinketId}`);

      if (!trinketResponse.ok) {
        const errorData = await trinketResponse.json();
        throw new Error(errorData.error || `Trinket not found: ${trinketResponse.status}`);
      }

      const trinketData = await trinketResponse.json();

      // Handle image loading
      if (trinketData.image_url) {
        setImageUrl(trinketData.image_url);
      } else {
        // Fallback: try the direct download endpoint
        const imageResponse = await fetch(`/api/trinkets/${trinketId}/files/image`);
        if (!imageResponse.ok) {
          console.warn(`Failed to load image: ${imageResponse.status}`);
        } else {
          // Create a blob URL for display
          const blob = await imageResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          setImageUrl(blobUrl);
        }
      }

      // Handle model loading
      if (trinketData.model_url) {
        setModelUrl(trinketData.model_url);
      } else {
        // Fallback: try the direct download endpoint for model
        const modelResponse = await fetch(`/api/trinkets/${trinketId}/files/model`);
        if (!modelResponse.ok) {
          console.warn(`Failed to load model: ${modelResponse.status}`);
        } else {
          // Create a blob URL for display
          const blob = await modelResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          setModelUrl(blobUrl);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trinket content");
    } finally {
      setLoading(false);
    }
  };

  // Check if no content was found after loading completes
  useEffect(() => {
    if (!loading && !error && imageUrl === null && modelUrl === null && trinketId.trim()) {
      setError("No image or 3D model found for this trinket");
    }
  }, [loading, error, imageUrl, modelUrl, trinketId]);

  const handleClear = () => {
    setTrinketId("");
    setImageUrl(null);
    setModelUrl(null);
    setError("");
  };

  return (
    <div className="space-y-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">View Trinket Content</CardTitle>
          <CardDescription>
            Enter a trinket ID to display its associated image and 3D model.
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
              {loading ? "Loading..." : "View Content"}
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

      {(imageUrl || modelUrl) && (
        <div className="w-full">
          <h3 className="font-semibold mb-4 text-center">Trinket Content (ID: {trinketId})</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {imageUrl && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 text-center">Image</h4>
                  <div className="max-w-full overflow-hidden rounded-lg border">
                    <img
                      src={imageUrl}
                      alt={`Trinket ${trinketId}`}
                      className="max-w-full h-auto mx-auto"
                      style={{ maxHeight: "400px" }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {modelUrl && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 text-center">3D Model</h4>
                  <GLBModelViewer modelUrl={modelUrl} />
                </CardContent>
              </Card>
            )}
          </div>

          {(!imageUrl || !modelUrl) && (
            <div className="text-center mt-4 text-sm text-gray-600">
              {!imageUrl && !modelUrl ? (
                "No content available"
              ) : !imageUrl ? (
                "Only 3D model available"
              ) : (
                "Only image available"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
