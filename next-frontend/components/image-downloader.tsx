"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ImageDownloader() {
  const [trinketId, setTrinketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDownload = async () => {
    if (!trinketId.trim()) {
      setError("Please enter a trinket ID");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/trinkets/${trinketId}/files/image`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to download image: ${response.status}`);
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `trinket-${trinketId}-image.png`; // fallback

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Image downloaded successfully as ${filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Download Trinket Image</CardTitle>
        <CardDescription>
          Enter a trinket ID to download its associated image file.
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
          />
        </div>

        <Button
          onClick={handleDownload}
          disabled={loading || !trinketId.trim()}
          className="w-full"
        >
          {loading ? "Downloading..." : "Download Image"}
        </Button>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
            {success}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
