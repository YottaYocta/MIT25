import Button from "./components/Button";
import ModelCard from "./components/ModelCard";
import Image from "./assets/image.png";
import { SpinningCarousel } from "./components/SpinningCarousel";

function App() {
  return (
    <div className="w-full h-screen flex-col overflow-x-hidden flex gap-16 items-center">
      <div className="w-96 flex items-center justify-between">
        <p>Public Collections</p>
        <Button>Map View</Button>
      </div>
      <SpinningCarousel
        className="w-96 max-w-96 h-96 max-h-96"
        gapSpacing={200}
      >
        <ModelCard
          title="Retrofuturism Museum"
          date="Sep 13, 2025"
          subtitle="UserName"
          imageUrl={Image}
          focused
        ></ModelCard>
        <ModelCard
          title="Retrofuturism Museum"
          date="Sep 13, 2025"
          subtitle="UserName"
          imageUrl={Image}
          focused
        ></ModelCard>
        <ModelCard
          title="Retrofuturism Museum"
          date="Sep 13, 2025"
          subtitle="UserName"
          imageUrl={Image}
          focused
        ></ModelCard>
      </SpinningCarousel>
    </div>
  );
}

export default App;
