import React, { useRef, useState, useEffect } from "react";

interface CarouselProps {
  className?: string;
  children: React.ReactNode[];
  gapSpacing?: number; // space in px between items
  handleFocused?: (index: number) => void;
  coordMapping?: "flat" | { power: number }; // NEW: coordinate mapping
}

export const SpinningCarousel: React.FC<CarouselProps> = ({
  children,
  className,
  gapSpacing = 8,
  handleFocused,
  coordMapping = "flat", // default to flat
}) => {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef(0);
  const lastTouchX = useRef(0);
  const isDragging = useRef(false);
  const animationFrame = useRef<number | null>(null);
  const easeTargetRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<1 | -1 | 0>(0);
  const currentIndexRef = useRef(0);

  const [, forceRender] = useState({});
  const spacing = 200 + gapSpacing;
  const maxIndex = children.length - 1;

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const indexToRange = (index: number) => index * spacing;

  const rangeToCoord = (x: number) => {
    const dx = x - dragOffset.current;

    // NEW: Apply coord mapping
    let y = 0;
    if (coordMapping !== "flat") {
      const power = coordMapping.power;
      y = -Math.pow(Math.abs(dx), power) * 0.01;
    }

    return { x: dx, y };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    lastTouchX.current = e.touches[0].clientX;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - lastTouchX.current;

    dragOffset.current -= deltaX;
    lastTouchX.current = currentX;

    lastDirectionRef.current =
      deltaX < 0 ? 1 : deltaX > 0 ? -1 : lastDirectionRef.current;

    forceRender({});
  };

  const handleTouchEnd = () => {
    isDragging.current = false;

    // Snap based on last direction
    currentIndexRef.current = clamp(
      currentIndexRef.current + lastDirectionRef.current,
      0,
      maxIndex
    );

    easeTargetRef.current = indexToRange(currentIndexRef.current);

    // Fire focus callback early
    handleFocused?.(currentIndexRef.current);

    const animate = () => {
      if (easeTargetRef.current === null) return;

      const current = dragOffset.current;
      const target = easeTargetRef.current;
      const next = lerp(current, target, 0.2);

      dragOffset.current = next;
      forceRender({});

      if (Math.abs(next - target) < 1) {
        dragOffset.current = target;
        easeTargetRef.current = null;
        animationFrame.current = null;
        forceRender({});
        return;
      }

      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return (
    <div
      className={`relative overflow-visible touch-pan-x ${className || ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {children.map((child, index) => {
        const rangeX = indexToRange(index);
        const { x, y } = rangeToCoord(rangeX);

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
              transition: isDragging.current ? "none" : "transform 0.3s ease",
              willChange: "transform",
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};
