import { useState } from "react";
import Button from "./components/Button";
import ModelCard from "./components/ModelCard";
import Image from "./assets/image.png";
import { SpinningCarousel } from "./components/SpinningCarousel";
import GlassmorphicPedestal from "./components/GlassmorphicPedestal";

function App() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="w-full h-screen flex-col overflow-x-hidden flex gap-16 items-center">
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
    </div>
  );
}

export default App;
