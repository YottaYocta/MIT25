"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FloatingInput from "@/components/Input";
import { convertToPng } from "@/lib/convertToPng";

export default function UploadPage() {
  const router = useRouter();
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

  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [newCollectionName, setNewCollectionName] = useState<string>("");
  const [isCreatingCollection, setIsCreatingCollection] = useState<boolean>(false);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const res = await fetch("/api/collections", { credentials: "include" });
        if (!res.ok) return; // silently ignore
        const data: Array<{ id: string; name: string }> = await res.json();
        setCollections(data);
      } catch {
        // ignore
      }
    };
    void loadCollections();
  }, []);

  const createCollection = useCallback(async () => {
    if (!newCollectionName.trim()) return;
    setIsCreatingCollection(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create collection");
      setCollections(prev => [json, ...prev]);
      setSelectedCollectionId(json.id as string);
      setNewCollectionName("");
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : "Failed to create collection");
    } finally {
      setIsCreatingCollection(false);
    }
  }, [newCollectionName]);

  const readFileAsBase64 = useCallback(async (f: File): Promise<string> => {
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
          body: JSON.stringify({
            trinketId: createdTrinketId,
            imageBase64: base64,
            save_preprocessed_image: true,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Generation failed");
        setGenStatus("success");
        setTrinket((prev) =>
          prev
            ? {
                ...prev,
                model_path: json.model_path ?? prev.model_path,
                nano_image_path: json.nano_image_path ?? prev.nano_image_path,
              }
            : prev
        );
      } catch (err) {
        setGenStatus("error");
        setGenError(err instanceof Error ? err.message : "Generation failed");
      }
    },
    []
  );

  const onStart = async (file: File) => {
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
      if (selectedCollectionId) form.append("collection_id", selectedCollectionId);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const trinketJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(trinketJson.error || "Upload failed");

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
          collection_id: selectedCollectionId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save details");
      setTrinket(json);
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Failed to save details"
      );
    } finally {
      setIsSavingDetails(false);
    }
  };

  const canFinish = genStatus === "success";

  return (
    <main className="min-h-svh flex items-center justify-center p-6 pb-24">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-4">Upload image</h1>

        {/* Loading Indicator */}
        {isUploading && (
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="w-6 h-6 border-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <span>Uploading...</span>
          </div>
        )}

        {stage === "select" && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Image</Label>
              <Input
                id="file"
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onStart(f);
                }}
              />
            </div>
            {globalError && (
              <p className="text-sm text-red-500">{globalError}</p>
            )}
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
                  <p className="text-sm font-medium text-green-600">
                    Model generated
                  </p>
                  <p className="text-xs break-all text-muted-foreground">
                    {trinket.model_path}
                  </p>
                </div>
              )}
              {genStatus === "success" && trinket.nano_image_path && (
                <div>
                  <p className="text-sm font-medium text-green-600">
                    Nano image uploaded
                  </p>
                  <p className="text-xs break-all text-muted-foreground">
                    {trinket.nano_image_path}
                  </p>
                </div>
              )}
              {genStatus === "pending" && (
                <p className="text-sm text-blue-600">Generating model...</p>
              )}
              {genStatus === "error" && genError && (
                <div className="text-sm text-red-600">
                  {genError.includes("3D generation service") ? (
                    <div className="space-y-1">
                      <p className="font-medium">Service Unavailable</p>
                      <p className="text-xs">{genError}</p>
                    </div>
                  ) : (
                    <p>Generation error: {genError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="collection-details">Collection (optional)</Label>
              <select
                id="collection-details"
                className="border rounded h-9 px-3 bg-background"
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
              >
                <option value="">No collection</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-collection-details">Create new collection</Label>
              <div className="flex gap-2">
                <Input
                  id="new-collection-details"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                />
                <Button onClick={createCollection} disabled={isCreatingCollection || !newCollectionName.trim()}>
                  {isCreatingCollection ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <FloatingInput
                label="Title (optional)"
                value={title}
                onChange={(value) => setTitle(value)}
              />
            </div>
            <div className="grid gap-2">
              <FloatingInput
                label="Note (optional)"
                value={note}
                onChange={(value) => setNote(value)}
              />
            </div>

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

            
          </div>
        )}
      </div>
    </main>
  );
}
