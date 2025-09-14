"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ScrollingColumn from "./ScrollingColumn";

// Custom Button component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "glass" | "glass-primary" | "default";
  size?: "sm" | "xl" | "default";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "default",
  size = "default",
  className = "",
  children,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    glass:
      "glass-button bg-gray-900/20 text-gray-900 font-bold hover:bg-gray-900/30 hover:glow-strong active:scale-95",
    "glass-primary":
      "glass-button bg-blue-600/20 text-white font-bold hover:bg-blue-600/30 hover:glow-strong active:scale-95",
  };

  const sizeClasses = {
    default: "h-10 py-2 px-4 rounded-full",
    sm: "h-9 px-3 text-sm rounded-full",
    xl: "h-14 px-10 text-lg rounded-full",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
// Using public images as strings
const trinketLogo = "/trinket_logo.png";

const LandingPage: React.FC = () => {
  const router = useRouter();

  // State for responsive column count
  const [numColumns, setNumColumns] = useState(8);

  // Images from public/images
  const imagesSet1 = [
    "/images/badge.png",
    "/images/matcha.png",
    "/images/mentra.png",
    "/images/sculpture.png",
    "/images/throatmic.png",
  ];

  // Images from public/images2
  const imagesSet2 = [
    "/images2/chill.png",
    "/images2/liberty.png",
    "/images2/oreo.png",
    "/images2/peanutbutter.png",
    "/images2/tokyo.png",
  ];

  // Function to determine number of columns based on screen width
  const getColumnCount = (width: number) => {
    if (width < 640) return 3; // Mobile: 3 columns
    if (width < 768) return 4; // Large mobile: 4 columns
    if (width < 1024) return 6; // Tablet: 6 columns
    if (width < 1280) return 8; // Desktop: 8 columns
    return 10; // Large desktop: 10 columns
  };

  // State for hydration-safe rendering
  const [isClient, setIsClient] = useState(false);

  // Effect to handle responsive column count and client-side hydration
  useEffect(() => {
    setIsClient(true);

    const handleResize = () => {
      setNumColumns(getColumnCount(window.innerWidth));
    };

    // Set initial column count
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Don't render background columns during SSR to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Main content - centered */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 space-y-6">
          {/* Logo - Large and centered */}
          <div className="flex justify-center">
            <img
              src={trinketLogo}
              alt="Trinket"
              className="h-48 md:h-56 lg:h-64 xl:h-72 drop-shadow-2xl object-contain max-w-full"
            />
          </div>

          {/* Subtitle with clean glass effect */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-3 border border-white/20 text-center max-w-md shadow-lg">
            <h2 className="text-lg md:text-xl font-medium text-gray-800 tracking-wide">
              Collect your world...
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button
              variant="glass-primary"
              size="xl"
              className="text-lg font-semibold shadow-xl hover:shadow-blue-500/30 transition-all duration-300 px-8 py-3 bg-blue-600/30 hover:bg-blue-600/40 backdrop-blur-sm border border-blue-400/20 hover:scale-105"
              onClick={() => router.push("/login")}
            >
              Sign In
            </Button>
            
            <a
              href="https://discord.gg/6MfbJqCMA8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center text-lg font-semibold px-8 py-3 rounded-full shadow-xl hover:shadow-purple-500/30 transition-all duration-300 bg-purple-600/30 hover:bg-purple-600/40 backdrop-blur-sm border border-purple-400/20 hover:scale-105"
            >
              Join our Discord
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <p className="text-sm text-gray-600 bg-white/90 px-4 py-2 rounded-full shadow-lg">
            Built for HackMIT 2025
          </p>
        </footer>
      </div>
    );
  }

  // Helper function to create deterministic arrangements from an image set
  const createDeterministicArrangements = (
    imageSet: string[],
    numArrangements: number,
    seed: number
  ) => {
    const arrangements = [];
    for (let i = 0; i < numArrangements; i++) {
      // Create a deterministic shuffle using the seed and column index
      const shuffled = [...imageSet];
      for (let j = shuffled.length - 1; j > 0; j--) {
        // Simple linear congruential generator for deterministic "random" numbers
        const pseudoRandom =
          ((seed + i * 31 + j * 17) * 1103515245 + 12345) % Math.pow(2, 31);
        const randomIndex = pseudoRandom % (j + 1);
        [shuffled[j], shuffled[randomIndex]] = [
          shuffled[randomIndex],
          shuffled[j],
        ];
      }
      // Take 3 images for each column arrangement
      arrangements.push(shuffled.slice(0, 3));
    }
    return arrangements;
  };

  // Create alternating column arrangements based on responsive column count
  const allBackgroundImages = [];
  const seed = 42; // Fixed seed for consistent results

  for (let i = 0; i < numColumns; i++) {
    if (i % 2 === 0) {
      // Even columns use imagesSet1
      const arrangements = createDeterministicArrangements(
        imagesSet1,
        1,
        seed + i
      );
      allBackgroundImages.push(arrangements[0]);
    } else {
      // Odd columns use imagesSet2
      const arrangements = createDeterministicArrangements(
        imagesSet2,
        1,
        seed + i
      );
      allBackgroundImages.push(arrangements[0]);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background scrolling columns */}
      <div className="absolute inset-0 flex pointer-events-none overflow-hidden justify-evenly">
        {allBackgroundImages.map((images, index) => {
          // Calculate responsive column width and spacing based on column count
          const getColumnStyles = () => {
            if (numColumns <= 3) {
              return {
                className:
                  "w-20 sm:w-24 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: "1rem" },
              };
            } else if (numColumns <= 4) {
              return {
                className:
                  "w-16 sm:w-20 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: "0.75rem" },
              };
            } else if (numColumns <= 6) {
              return {
                className:
                  "w-14 sm:w-16 md:w-20 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: "0.5rem" },
              };
            } else if (numColumns <= 8) {
              return {
                className:
                  "w-12 sm:w-14 md:w-16 lg:w-20 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: "0.25rem" },
              };
            } else {
              return {
                className:
                  "w-10 sm:w-12 md:w-14 lg:w-16 xl:w-18 flex-shrink-0 transform rotate-12 opacity-20",
                marginStyle: { marginX: "0.125rem" },
              };
            }
          };

          const { className, marginStyle } = getColumnStyles();

          return (
            <ScrollingColumn
              key={`${index}-${numColumns}`}
              images={images}
              direction={index % 2 === 0 ? "up" : "down"}
              className={className}
              style={{
                marginLeft: index === 0 ? marginStyle.marginX : "0",
                marginRight: marginStyle.marginX,
              }}
            />
          );
        })}
      </div>

      {/* Main content - centered */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 space-y-6">
        {/* Logo - Large and centered */}
        <div className="flex justify-center">
          <img
            src={trinketLogo}
            alt="Trinket"
            className="h-48 md:h-56 lg:h-64 xl:h-72 drop-shadow-2xl object-contain max-w-full"
          />
        </div>

        {/* Subtitle with clean glass effect */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-3 border border-white/20 text-center max-w-md shadow-lg">
          <h2 className="text-lg md:text-xl font-medium text-gray-800 tracking-wide">
            Collect your world...
          </h2>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button
            variant="glass-primary"
            size="xl"
            className="text-lg font-semibold shadow-xl hover:shadow-blue-500/30 transition-all duration-300 px-8 py-3 bg-blue-600/30 hover:bg-blue-600/40 backdrop-blur-sm border border-blue-400/20 hover:scale-105"
            onClick={() => router.push("/login")}
          >
            Sign In
          </Button>
          
          <a
            href="#" // Replace with actual Discord server link
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-lg font-semibold px-8 py-3 rounded-full shadow-xl hover:shadow-purple-500/30 transition-all duration-300 bg-purple-600/30 hover:bg-purple-600/40 backdrop-blur-sm border border-purple-400/20 hover:scale-105"
          >
            Join our Discord!
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
        <p className="text-sm text-gray-600 bg-white/90 px-4 py-2 rounded-full shadow-lg">
          Built for HackMIT 2025
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
