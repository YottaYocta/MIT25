import React, { useRef, useState, useEffect } from "react";

interface CarouselProps {
  className?: string;
  children: React.ReactNode[];
  gapSpacing?: number; // space in px between items
}

export const SpinningCarousel: React.FC<CarouselProps> = ({
  children,
  className,
  gapSpacing = 8,
}) => {
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const easeTargetRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef(0);
  const velocityRef = useRef(0);
  const lastTouchTime = useRef<number>(0);
  const lastTouchX = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const isDragging = useRef(false);
  const [, forceRender] = useState({});

  const spacing = 200 + gapSpacing;
  const maxOffset = spacing * (children.length - 1);

  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  const indexToRange = (index: number) => index * spacing;

  const rangeToCoord = (x: number) => {
    const dx = x - dragOffset.current;
    const y = -Math.pow(Math.abs(dx), 1.2) * 0.01;
    return { x: dx, y };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    lastTouchX.current = e.touches[0].clientX;
    lastTouchTime.current = performance.now();

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const currentX = e.touches[0].clientX;
    const currentTime = performance.now();
    const deltaX = currentX - lastTouchX.current;
    const deltaTime = currentTime - lastTouchTime.current;

    dragOffset.current = clamp(dragOffset.current - deltaX, 0, maxOffset);
    velocityRef.current = -(deltaX / deltaTime) * 16;

    lastTouchX.current = currentX;
    lastTouchTime.current = currentTime;

    forceRender({});
  };
  const handleTouchEnd = () => {
    isDragging.current = false;

    const animate = () => {
      const hasVelocity = Math.abs(velocityRef.current) >= 1;

      if (hasVelocity) {
        dragOffset.current = clamp(
          dragOffset.current + velocityRef.current,
          0,
          maxOffset
        );
        velocityRef.current *= 0.95;

        forceRender({});
        animationFrame.current = requestAnimationFrame(animate);
        return;
      }

      // Snap to nearest item based on last fling direction
      if (easeTargetRef.current === null) {
        let nearestIndex = Math.round(dragOffset.current / spacing);

        if (velocityRef.current > 0) {
          nearestIndex += 1;
        } else if (velocityRef.current < 0) {
          nearestIndex -= 1;
        }

        nearestIndex = clamp(nearestIndex, 0, children.length - 1);
        easeTargetRef.current = nearestIndex * spacing;
      }

      const target = easeTargetRef.current!;
      const current = dragOffset.current;
      const next = lerp(current, target, 0.1);

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
