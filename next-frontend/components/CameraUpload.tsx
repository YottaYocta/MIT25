import React, { useRef, useState } from "react";
import Button from "./Button";

interface CameraUploadProps {
  handleUpload: (file: File) => void;
  handleCancel?: () => void;
}

const CameraUpload: React.FC<CameraUploadProps> = ({
  handleUpload,
  handleCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const reset = () => {
    setImagePreview(null);
    setLoading(false);
    setCameraActive(false);
    handleCancel?.();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setImagePreview(null);

    handleUpload(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleTakePhoto = async () => {
    setCameraActive(true);
    setImagePreview(null);
    setLoading(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "photo.png", { type: "image/png" });
        processFile(file);
      }
    }, "image/png");

    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setCameraActive(false);
  };

  return (
    <div className="w-80 h-80 relative flex flex-col bg-white rounded-2xl border border-neutral-200 overflow-clip shadow group">
      {/* Top Header */}
      <div className="bg-linear-to-b from-[#86A8FF] to-[#8F98FA] p-4 shadow border-b border-b-[#8CABFF] z-10">
        <p className="text-white font-medium text-sm">
          Choose Trinket Source Image
        </p>
      </div>

      {/* File input */}
      <input
        type="file"
        accept="image/png"
        ref={fileInputRef}
        onChange={onFileChange}
        hidden
      />

      {/* Main Body */}
      <div className="grow flex flex-col items-center justify-center p-4 gap-4">
        {/* Camera active preview */}
        {cameraActive ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <video ref={videoRef} className="w-full rounded-md" />
            <Button handleClick={capturePhoto}>Capture</Button>
          </div>
        ) : loading ? (
          <p className="text-blue-500">Uploading...</p>
        ) : imagePreview ? (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full max-h-40 object-contain rounded-md"
          />
        ) : (
          <div className="w-full h-40 border-2 border-dashed border-neutral-300 rounded-md flex items-center justify-center text-neutral-400 text-sm text-center">
            Image preview will appear here
          </div>
        )}

        {/* Bottom Buttons */}
        {!cameraActive && (
          <div className="flex gap-2 w-full">
            {!imagePreview ? (
              <>
                <Button
                  handleClick={() => fileInputRef.current?.click()}
                  className="text-sm w-full"
                >
                  Upload PNG
                </Button>
                <Button
                  handleClick={handleTakePhoto}
                  className="text-sm w-full"
                >
                  Use Camera
                </Button>
              </>
            ) : (
              <Button handleClick={reset} className="text-sm w-full">
                Clear Upload
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraUpload;
