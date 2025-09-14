"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertToPng } from "@/lib/convertToPng";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [stage, setStage] = useState<"select" | "details">("select");
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [trinket, setTrinket] = useState<
    | ({
        id: string;
        owner_id: string;
        image_path: string;
        model_path: string | null;
        nano_image_path: string | null;
        title: string | null;
        note: string | null;
      } & Record<string, unknown>)
    | null
  >(null);
  const [genStatus, setGenStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [genError, setGenError] = useState<string | null>(null);

  const readFileAsBase64 = useCallback(async (f: File): Promise<string> => {
    // Returns base64 without data URL prefix
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(f);
    });
    const base64 = dataUrl.split(",")[1] || "";
    return base64;
  }, []);

  const startGeneration = useCallback(
    async (createdTrinketId: string, base64: string) => {
      setGenStatus("pending");
      setGenError(null);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trinketId: createdTrinketId, imageBase64: base64, save_preprocessed_image: true }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Generation failed");
        setGenStatus("success");
        setTrinket((prev) =>
          prev ? { 
            ...prev, 
            model_path: json.model_path ?? prev.model_path,
            nano_image_path: json.nano_image_path ?? prev.nano_image_path 
          } : prev,
        );
      } catch (err) {
        setGenStatus("error");
        setGenError(err instanceof Error ? err.message : "Generation failed");
      }
    },
    [],
  );

  const onStart = async () => {
    setGlobalError(null);
    setIsUploading(true);
    try {
      if (!file) throw new Error("Please select an image");

      // Convert to PNG first for consistent downstream processing
      const pngFile = await convertToPng(file, { maxDimension: 1280 });

      // Kick off: 1) upload PNG + create trinket 2) background generation
      const base64 = await readFileAsBase64(pngFile);

      const form = new FormData();
      form.append("file", pngFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const trinketJson = await uploadRes.json();
      if (!uploadRes.ok)
        throw new Error(trinketJson.error || "Upload failed");

      setTrinket(trinketJson);
      setStage("details");

      // Start generation but do not await to let user fill details
      void startGeneration(trinketJson.id as string, base64);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const onSaveDetails = async () => {
    if (!trinket) return;
    setIsSavingDetails(true);
    setGlobalError(null);
    try {
      const res = await fetch(`/api/trinkets/${trinket.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          note: note || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save details");
      setTrinket(json);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Failed to save details",
      );
    } finally {
      setIsSavingDetails(false);
    }
  };

  const canFinish = useMemo(() => genStatus === "success", [genStatus]);

  return (
    <main className="min-h-svh flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Upload image</h1>
        {stage === "select" && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Image</Label>
              <Input
                id="file"
                type="file"
                accept="image/*,.heic,.heif"
                capture="environment"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            {globalError && (
              <p className="text-sm text-red-500">{globalError}</p>
            )}
            <Button onClick={onStart} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Continue"}
            </Button>
          </div>
        )}

        {stage === "details" && trinket && (
          <div className="flex flex-col gap-4">
            <div className="rounded border p-3 space-y-2">
              <div>
                <p className="text-sm font-medium">Image uploaded</p>
                <p className="text-xs break-all text-muted-foreground">
                  {trinket.image_path}
                </p>
              </div>
              {genStatus === "success" && trinket.model_path && (
                <div>
                  <p className="text-sm font-medium text-green-600">Model generated</p>
                  <p className="text-xs break-all text-muted-foreground">
                    {trinket.model_path}
                  </p>
                </div>
              )}
              {genStatus === "success" && trinket.nano_image_path && (
                <div>
                  <p className="text-sm font-medium text-green-600">Nano image uploaded</p>
                  <p className="text-xs break-all text-muted-foreground">
                    {trinket.nano_image_path}
                  </p>
                </div>
              )}
              {genStatus === "pending" && (
                <p className="text-sm text-blue-600">Generating model...</p>
              )}
              {genStatus === "error" && genError && (
                <p className="text-sm text-red-600">Generation error: {genError}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {globalError && (
              <p className="text-sm text-red-500">{globalError}</p>
            )}

            <div className="flex gap-2">
              <Button onClick={onSaveDetails} disabled={isSavingDetails}>
                {isSavingDetails ? "Saving..." : "Save details"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/")}
                disabled={!canFinish}
              >
                {genStatus === "pending"
                  ? "Generating..."
                  : genStatus === "error"
                  ? "Generation failed"
                  : "Finish"}
              </Button>
            </div>

            <div className="rounded border p-3">
              {genStatus === "pending" && (
                <p className="text-sm">Generating model...</p>
              )}
              {genStatus === "success" && (
                <div className="text-sm">
                  <p>Model generated.</p>
                  <p className="text-xs break-all text-muted-foreground">
                    {trinket.model_path}
                  </p>
                </div>
              )}
              {genStatus === "error" && (
                <p className="text-sm text-red-500">{genError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}


