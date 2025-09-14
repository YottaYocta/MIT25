'use client';

import React, { useMemo, Suspense, useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { TrinketViewProps } from './types';
import { ProcessedTrinket } from '../CollectionView/types';
import { Room } from '../CollectionView/components/Room';
import { GreekColumns } from '../CollectionView/components/GreekColumns';
import { Trinket } from '../CollectionView/components/Trinket';
import { PlaquePanel } from '../CollectionView/components/PlaquePanel';
import { DynamicLighting } from '../CollectionView/components/DynamicLighting';

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#FF8A65', '#81C784', '#64B5F6', '#FFB74D'
];

function generateTrinketId(trinket: import('../CollectionView/types').TrinketData): string {
  if (trinket.id) return trinket.id;

  const sanitizedTitle = trinket.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'trinket';
  return `${sanitizedTitle}-single`;
}

export function TrinketView({
  trinket,
  backgroundColor = '#f5f5f5',
  showMetadata = true,
  enableTouch = true,
  enableKeyboard = true,
  className = '',
  onClose
}: TrinketViewProps) {
  const processedTrinket: ProcessedTrinket = useMemo(() => ({
    ...trinket,
    id: generateTrinketId(trinket),
    color: trinket.color || DEFAULT_COLORS[0]
  }), [trinket]);

  // Fixed position and camera for single trinket view
  const trinketPosition: [number, number, number] = [0, 4.28, 0]; // Elevated position (4.01 + 0.27)
  const columnPosition: [number, number, number] = [0, 0, 0];
  const cameraPosition: [number, number, number] = [1.6, 4.2, 1.6];
  const cameraTarget: [number, number, number] = [0, 4.0, 0];

  // Drag-based rotation state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [userRotationY, setUserRotationY] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const baseRotationYRef = useRef<number>(0);

  const startDrag = useCallback((clientX: number) => {
    dragStartXRef.current = clientX;
    baseRotationYRef.current = userRotationY;
    setIsDragging(true);
  }, [userRotationY]);

  const updateDrag = useCallback((clientX: number) => {
    if (!isDragging || dragStartXRef.current === null) return;
    const deltaX = clientX - dragStartXRef.current;
    const rotationPerPixel = 0.006; // radians per pixel
    setUserRotationY(baseRotationYRef.current + deltaX * rotationPerPixel);
  }, [isDragging]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
    dragStartXRef.current = null;
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableTouch) return;
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startDrag(touch.clientX);
  }, [enableTouch, startDrag]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableTouch) return;
    if (!isDragging) return;
    const touch = e.touches[0];
    updateDrag(touch.clientX);
  }, [enableTouch, isDragging, updateDrag]);

  const handleTouchEnd = useCallback(() => {
    if (!enableTouch) return;
    endDrag();
  }, [enableTouch, endDrag]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX);
  }, [startDrag]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateDrag(e.clientX);
  }, [isDragging, updateDrag]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    endDrag();
  }, [isDragging, endDrag]);

  // Keyboard navigation for close functionality
  React.useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          if (onClose) onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, onClose]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-screen touch-manipulation ${className}`}
      style={{ backgroundColor, touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 50
        }}
        shadows
        className="touch-none"
        onCreated={({ camera }) => {
          camera.lookAt(...cameraTarget);
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        <fog attach="fog" args={[backgroundColor, 15, 50]} />

        <DynamicLighting
          currentViewIndex={1} // Always in focused mode
          trinketPositions={[trinketPosition]}
          trinketCount={1}
        />

        <Room />
        <GreekColumns positions={[columnPosition]} />

        <Suspense fallback={
          <mesh position={trinketPosition} castShadow receiveShadow>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial 
              color="#ffffff" 
              wireframe 
              transparent 
              opacity={0.5}
              roughness={0.8}
              metalness={0.0}
            />
          </mesh>
        }>
          <Trinket
            trinket={processedTrinket}
            position={trinketPosition}
            radius={0.3}
            isFocused={false}
            enableBobbing={true}
            userRotationY={userRotationY}
            autoRotate={!isDragging}
          />
        </Suspense>

        <Environment preset="city" />
      </Canvas>

      {showMetadata && (
        <PlaquePanel
          trinket={processedTrinket}
          isVisible={true}
        />
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="Close trinket view"
        >
          ×
        </button>
      )}
    </div>
  );
}