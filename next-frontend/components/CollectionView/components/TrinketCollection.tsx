'use client';

import React, { useEffect } from 'react';
import { Trinket } from './Trinket';
import { ProcessedTrinket } from '../types';

interface TrinketCollectionProps {
  trinkets: ProcessedTrinket[];
  pedestalRadius?: number;
  trinketHeight?: number;
  focusedIndex?: number;
  onPositionsCalculated?: (positions: [number, number, number][]) => void;
  onColumnPositionsCalculated?: (positions: [number, number, number][]) => void;
}

const calculateColumnPositions = (
  count: number,
  radius: number
): [number, number, number][] => {
  if (count === 0) return [];
  if (count === 1) return [[0, 0, 0]];

  const positions: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const angle = -(i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    positions.push([x, 0, z]);
  }

  return positions;
};

const calculateTrinketPositions = (
  count: number,
  radius: number,
  height: number
): [number, number, number][] => {
  if (count === 0) return [];
  if (count === 1) return [[0, height, 0]];

  const positions: [number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const angle = -(i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    positions.push([x, height, z]);
  }

  return positions;
};

const calculateColumnRadius = (trinketCount: number): number => {
  if (trinketCount <= 1) return 2.0;

  const columnDiameter = 0.5;
  const baseSpacing = 0.25;
  const scalingFactor = 0.85;

  const adaptiveSpacing = baseSpacing + (trinketCount - 2) * 0.05;
  const circumference = trinketCount * (columnDiameter + adaptiveSpacing);
  const radius = circumference / (2 * Math.PI);

  const scaledRadius = radius * scalingFactor;
  const minRadius = 1.5 + (trinketCount - 1) * 0.2;

  return Math.max(minRadius, scaledRadius);
};

export function TrinketCollection({
  trinkets,
  pedestalRadius,
  trinketHeight = 4.01,
  focusedIndex,
  onPositionsCalculated,
  onColumnPositionsCalculated
}: TrinketCollectionProps) {
  const actualRadius = pedestalRadius || calculateColumnRadius(trinkets.length);
  const columnPositions = calculateColumnPositions(trinkets.length, actualRadius);
  const trinketPositions = calculateTrinketPositions(trinkets.length, actualRadius, trinketHeight);

  useEffect(() => {
    if (onPositionsCalculated) {
      onPositionsCalculated(trinketPositions);
    }
    if (onColumnPositionsCalculated) {
      onColumnPositionsCalculated(columnPositions);
    }
  }, [trinketPositions, columnPositions, onPositionsCalculated, onColumnPositionsCalculated]);

  return (
    <group>
      {trinkets.map((trinket, index) => {
        const isFocused = focusedIndex !== undefined && focusedIndex === index + 1;
        const shouldElevate = isFocused;
        const position: [number, number, number] = [
          trinketPositions[index][0],
          trinketPositions[index][1] + (shouldElevate ? 0.27 : 0),
          trinketPositions[index][2]
        ];

        return (
          <Trinket
            key={trinket.id}
            trinket={trinket}
            position={position}
            radius={0.3}
            isFocused={isFocused}
          />
        );
      })}
    </group>
  );
}