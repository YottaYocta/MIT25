import { useState } from "react";
import Button from "./components/Button";
import ModelCard from "./components/ModelCard";
import Image from "./assets/image.png";
import { SpinningCarousel } from "./components/SpinningCarousel";
import GlassmorphicPedestal from "./components/GlassmorphicPedestal";
import CameraUpload from "./components/CameraUpload";
import FloatingInput from "./components/Input";

function App() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="w-full h-screen flex-col overflow-x-hidden flex gap-16 items-center py-16">
      <div className="w-96 flex items-center justify-between">
        <p>Public Collections</p>
        <Button>Map View</Button>
      </div>

      <SpinningCarousel
        className="w-96 max-w-96 h-96 max-h-96"
        gapSpacing={120}
        handleFocused={setSelectedIndex}
      >
        {[0, 1, 2].map((_, i) => (
          <ModelCard
            key={i}
            title="Retrofuturism Museum"
            date="Sep 13, 2025"
            subtitle="UserName"
            imageUrl={Image}
            focused={selectedIndex === i}
          />
        ))}
      </SpinningCarousel>
      <SpinningCarousel
        className="w-96 max-w-96 h-96 max-h-96"
        gapSpacing={0}
        handleFocused={setSelectedIndex}
        coordMapping={{ power: 1.5 }}
      >
        {[0, 1, 2].map((_, i) => (
          <GlassmorphicPedestal
            key={i}
            imageUrl={Image}
            focused={selectedIndex === i}
          ></GlassmorphicPedestal>
        ))}
      </SpinningCarousel>

      <div className="h-20"></div>

      <CameraUpload
        handleUpload={async (file: File) => {
          // 1. Validate PNG
          if (file.type !== "image/png") {
            alert("Only PNG images are accepted.");
            return;
          }

          // 2. Upload to the endpoint
          try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(
              "https://cb7943f2c7d6.ngrok-free.app/generate",
              {
                method: "POST",
                body: formData,
              }
            );

            if (!response.ok) {
              throw new Error("Upload failed");
            }

            const data = await response.json(); // or .text() depending on response
            console.log("Upload successful:", data);
            alert("Upload successful!");
          } catch (err) {
            console.error(err);
            alert("Failed to upload image.");
          }
        }}
      />
      <FloatingInput
        type="text"
        label="Test"
        value=""
        onChange={() => {}}
        className="w-32 max-w-32"
      ></FloatingInput>
    </div>
  );
}

export default App;
