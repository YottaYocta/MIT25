import React, { useRef, useState, useEffect } from "react";

interface CarouselProps {
  className?: string;
  children: React.ReactNode[];
  gapSpacing?: number;
  handleFocused?: (index: number) => void;
  coordMapping?: "flat" | { power: number };
}

export const SpinningCarousel: React.FC<CarouselProps> = ({
  children,
  className,
  gapSpacing = 8,
  handleFocused,
  coordMapping = "flat",
}) => {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef(0);
  const lastPointerX = useRef(0);
  const isDragging = useRef(false);
  const hasDragged = useRef(false); // Track if actual dragging happened
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
    let y = 0;
    if (coordMapping !== "flat") {
      const power = (coordMapping as { power: number }).power;
      y = -Math.pow(Math.abs(dx), power) * 0.01;
    }
    return { x: dx, y };
  };

  // Threshold in pixels before treating move as drag
  const DRAG_THRESHOLD = 5;

  // ----- Touch handlers -----
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    hasDragged.current = false;
    lastPointerX.current = e.touches[0].clientX;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - lastPointerX.current;

    if (!hasDragged.current && Math.abs(deltaX) < DRAG_THRESHOLD) {
      // Not enough movement yet to count as drag
      return;
    }
    hasDragged.current = true;

    dragOffset.current -= deltaX;
    lastPointerX.current = currentX;

    lastDirectionRef.current =
      deltaX < 0 ? 1 : deltaX > 0 ? -1 : lastDirectionRef.current;

    forceRender({});
  };

  const handleTouchEnd = () => {
    if (!hasDragged.current) {
      // Not a drag, treat as tap - do nothing or your tap logic here
      isDragging.current = false;
      return;
    }

    isDragging.current = false;

    currentIndexRef.current = clamp(
      currentIndexRef.current + lastDirectionRef.current,
      0,
      maxIndex
    );

    easeTargetRef.current = indexToRange(currentIndexRef.current);

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

  // ----- Mouse handlers -----
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent text selection
    isDragging.current = true;
    hasDragged.current = false;
    lastPointerX.current = e.clientX;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const currentX = e.clientX;
    const deltaX = currentX - lastPointerX.current;

    if (!hasDragged.current && Math.abs(deltaX) < DRAG_THRESHOLD) {
      // Not enough movement to treat as drag yet
      return;
    }
    hasDragged.current = true;

    dragOffset.current -= deltaX;
    lastPointerX.current = currentX;

    lastDirectionRef.current =
      deltaX < 0 ? 1 : deltaX > 0 ? -1 : lastDirectionRef.current;

    forceRender({});
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;

    isDragging.current = false;

    if (!hasDragged.current) {
      // Not dragged, treat as click (no scroll)
      return;
    }

    currentIndexRef.current = clamp(
      currentIndexRef.current + lastDirectionRef.current,
      0,
      maxIndex
    );

    easeTargetRef.current = indexToRange(currentIndexRef.current);

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

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp();
    }
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
      className={`relative overflow-x-visible touch-pan-x ${
        className || ""
      } min-h-32`}
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        userSelect: isDragging.current ? "none" : "auto",
        cursor: "grab",
      }}
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
