"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { PlusIcon, CheckIcon, XIcon, LoaderIcon } from "lucide-react";
import Button from "./Button";
import { convertToPng } from "@/lib/convertToPng";

type UploadStep = {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  errorMessage?: string;
};

export const NavUpload = ({ className = "" }: { className?: string }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([
    { name: "Photo Uploaded", status: 'pending' },
    { name: "Connected to Server", status: 'pending' },
    { name: "Trinket Generated", status: 'pending' },
  ]);

  const updateStep = (stepIndex: number, status: UploadStep['status'], errorMessage?: string) => {
    setUploadSteps(prev => prev.map((step, index) => 
      index === stepIndex 
        ? { ...step, status, errorMessage }
        : step
    ));
  };

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
      try {
        updateStep(2, 'in-progress');
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
        updateStep(2, 'completed');
        return json;
      } catch (err) {
        updateStep(2, 'error', err instanceof Error ? err.message : "Generation failed");
        throw err;
      }
    },
    []
  );

  const handleFileSelect = () => {
    if (isUploading) {
      setShowPopover(!showPopover);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setShowPopover(false);
    
    // Reset all steps
    setUploadSteps([
      { name: "Photo Uploaded", status: 'pending' },
      { name: "Connected to Server", status: 'pending' },
      { name: "Trinket Generated", status: 'pending' },
    ]);

    try {
      // Step 1: Process photo
      updateStep(0, 'in-progress');
      const pngFile = await convertToPng(file, { maxDimension: 1280 });
      const base64 = await readFileAsBase64(pngFile);
      updateStep(0, 'completed');

      // Step 2: Upload to server
      updateStep(1, 'in-progress');
      const form = new FormData();
      form.append("file", pngFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const trinketJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(trinketJson.error || "Upload failed");
      updateStep(1, 'completed');

      // Step 3: Generate trinket
      await startGeneration(trinketJson.id as string, base64);
      
      setUploadSuccess(true);
      
      // Navigate to the trinket after a short delay
      setTimeout(() => {
        router.push(`/trinkets/${trinketJson.id}`);
      }, 1500);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setUploadError(errorMessage);
      
      // Mark current step as error if not already set
      const currentStepIndex = uploadSteps.findIndex(step => step.status === 'in-progress');
      if (currentStepIndex !== -1) {
        updateStep(currentStepIndex, 'error', errorMessage);
      }
    } finally {
      // Reset after delay if there was an error
      if (uploadError) {
        setTimeout(() => {
          setIsUploading(false);
          setUploadError(null);
          setShowPopover(false);
        }, 5000);
      } else if (uploadSuccess) {
        // Reset after navigation
        setTimeout(() => {
          setIsUploading(false);
          setUploadSuccess(false);
          setShowPopover(false);
        }, 2000);
      }
    }

    // Clear the input value so the same file can be selected again
    event.target.value = '';
  };

  const resetUpload = () => {
    setIsUploading(false);
    setUploadError(null);
    setUploadSuccess(false);
    setShowPopover(false);
    setUploadSteps([
      { name: "Photo Uploaded", status: 'pending' },
      { name: "Connected to Server", status: 'pending' },
      { name: "Trinket Generated", status: 'pending' },
    ]);
  };

  const getStepIcon = (step: UploadStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckIcon className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <LoaderIcon className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <XIcon className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getButtonContent = () => {
    if (uploadSuccess) {
      return <CheckIcon className="h-6 w-6 text-green-600" />;
    }
    if (uploadError) {
      return <XIcon className="h-6 w-6 text-red-600" />;
    }
    if (isUploading) {
      return <LoaderIcon className="h-6 w-6 text-blue-600 animate-spin" />;
    }
    return <PlusIcon className="h-6 w-6" />;
  };

  const getButtonClassName = () => {
    const baseClass = `w-16 h-16 rounded-full flex items-center justify-center transition-all ${className}`;
    if (uploadSuccess) {
      return `${baseClass} bg-green-500/20 hover:bg-green-500/30 border-green-500/30`;
    }
    if (uploadError) {
      return `${baseClass} bg-red-500/20 hover:bg-red-500/30 border-red-500/30`;
    }
    if (isUploading) {
      return `${baseClass} bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30`;
    }
    return baseClass;
  };

  return (
    <div className="relative">
      <Button 
        className={getButtonClassName()}
        handleClick={uploadError ? resetUpload : handleFileSelect}
      >
        {getButtonContent()}
      </Button>

      {/* Status Popover */}
      {showPopover && isUploading && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-48 z-50">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Upload Progress</h3>
            {uploadSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                {getStepIcon(step)}
                <span className={`text-sm ${
                  step.status === 'completed' ? 'text-green-600' :
                  step.status === 'in-progress' ? 'text-blue-600' :
                  step.status === 'error' ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
            ))}
            {uploadError && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {uploadError}
              </div>
            )}
          </div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white"></div>
        </div>
      )}

      {/* Simple status text for non-popover states */}
      {uploadError && !showPopover && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-xs text-red-600 whitespace-nowrap max-w-32 text-center">
          Failed - Tap to retry
        </div>
      )}
      
      {uploadSuccess && !showPopover && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-xs text-green-600 whitespace-nowrap">
          Success!
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
