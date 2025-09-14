'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { ProcessedTrinket } from '../types';
import { Room } from './Room';
import { GreekColumns } from './GreekColumns';
import { TrinketCollection } from './TrinketCollection';
import { CameraController } from './CameraController';
import { ResponsiveControls } from './ResponsiveControls';
import { PlaquePanel } from './PlaquePanel';
import { DynamicLighting } from './DynamicLighting';

interface SceneProps {
  trinkets: ProcessedTrinket[];
  backgroundColor?: string;
  showMetadata?: boolean;
  enableTouch?: boolean;
  enableKeyboard?: boolean;
  onTrinketFocus?: (trinket: ProcessedTrinket | null, index: number) => void;
}

export function Scene({
  trinkets,
  backgroundColor = '#f5f5f5',
  showMetadata = true,
  enableTouch = true,
  enableKeyboard = true,
  onTrinketFocus
}: SceneProps) {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [trinketPositions, setTrinketPositions] = useState<[number, number, number][]>([]);
  const [columnPositions, setColumnPositions] = useState<[number, number, number][]>([]);
  const [navigationDirection, setNavigationDirection] = useState<'increment' | 'decrement' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const mouseStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const totalViews = trinkets.length + 1;
  const currentTrinket = currentViewIndex > 0 ? trinkets[currentViewIndex - 1] : null;

  const handleNavigation = useCallback((direction: 'prev' | 'next') => {
    setNavigationDirection(direction === 'next' ? 'increment' : 'decrement');

    setCurrentViewIndex(prev => {
      const newIndex = direction === 'next'
        ? (prev + 1) % totalViews
        : prev === 0 ? totalViews - 1 : prev - 1;

      if (onTrinketFocus) {
        const focusedTrinket = newIndex > 0 ? trinkets[newIndex - 1] : null;
        onTrinketFocus(focusedTrinket, newIndex);
      }

      return newIndex;
    });

    setTimeout(() => setNavigationDirection(null), 100);
  }, [totalViews, trinkets, onTrinketFocus]);

  const handlePositionsCalculated = useCallback((positions: [number, number, number][]) => {
    setTrinketPositions(positions);
  }, []);

  const handleColumnPositionsCalculated = useCallback((positions: [number, number, number][]) => {
    setColumnPositions(positions);
  }, []);


  // Gesture handling functions
  const handleGestureStart = useCallback((clientX: number, clientY: number, isTouch: boolean) => {
    if (!enableTouch && isTouch) return;

    const startPos = { x: clientX, y: clientY };
    if (isTouch) {
      touchStartRef.current = startPos;
    } else {
      mouseStartRef.current = startPos;
      isDraggingRef.current = true;
    }
  }, [enableTouch]);

  const handleGestureEnd = useCallback((clientX: number, clientY: number, isTouch: boolean) => {
    if (!enableTouch && isTouch) return;

    const startPos = isTouch ? touchStartRef.current : mouseStartRef.current;
    if (!startPos) return;

    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    const threshold = 50;

    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        handleNavigation('prev');
      } else {
        handleNavigation('next');
      }
    }

    if (isTouch) {
      touchStartRef.current = null;
    } else {
      mouseStartRef.current = null;
      isDraggingRef.current = false;
    }
  }, [enableTouch, handleNavigation]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      handleGestureStart(touch.clientX, touch.clientY, true);
    }
  }, [handleGestureStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      e.preventDefault();
      const touch = e.changedTouches[0];
      handleGestureEnd(touch.clientX, touch.clientY, true);
    }
  }, [handleGestureEnd]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleGestureStart(e.clientX, e.clientY, false);
  }, [handleGestureStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      handleGestureEnd(e.clientX, e.clientY, false);
    }
  }, [handleGestureEnd]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
    }
  }, []);

  // Keyboard navigation
  React.useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleNavigation('prev');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleNavigation('next');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, handleNavigation]);

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-screen touch-manipulation"
        style={{ backgroundColor }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      >
        <Canvas
          camera={{
            position: [8, 6, 8],
            fov: 50
          }}
          shadows
          className="touch-none"
        >
          <color attach="background" args={[backgroundColor]} />
          <fog attach="fog" args={[backgroundColor, 15, 50]} />

          <DynamicLighting
            currentViewIndex={currentViewIndex}
            trinketPositions={trinketPositions}
            trinketCount={trinkets.length}
          />

          <Room />
          <GreekColumns positions={columnPositions} />
          <TrinketCollection
            trinkets={trinkets}
            focusedIndex={currentViewIndex > 0 ? currentViewIndex : undefined}
            onPositionsCalculated={handlePositionsCalculated}
            onColumnPositionsCalculated={handleColumnPositionsCalculated}
          />

          <Environment preset="city" />

          <CameraController
            currentViewIndex={currentViewIndex}
            trinketCount={trinkets.length}
            trinketPositions={trinketPositions}
            navigationDirection={navigationDirection}
          />
        </Canvas>
      </div>

      <ResponsiveControls
        currentIndex={currentViewIndex}
        totalViews={totalViews}
        onNavigate={handleNavigation}
        currentTrinket={currentTrinket}
        showMetadata={showMetadata}
      />

      <PlaquePanel
        trinket={currentTrinket}
        isVisible={currentViewIndex > 0}
      />

    </>
  );
}