'use client';

import React, { useMemo } from 'react';
import { CollectionViewProps, ProcessedTrinket, TrinketData } from './types';
import { Scene } from './components/Scene';

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#FF8A65', '#81C784', '#64B5F6', '#FFB74D'
];

function generateTrinketId(trinket: TrinketData, index: number): string {
  if (trinket.id) return trinket.id;

  const sanitizedTitle = trinket.title?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'trinket';
  return `${sanitizedTitle}-${index}`;
}

export function CollectionView({
  trinkets = [],
  backgroundColor = '#f5f5f5',
  showMetadata = true,
  enableTouch = true,
  enableKeyboard = true,
  className = '',
  onTrinketFocus
}: CollectionViewProps) {
  const processedTrinkets: ProcessedTrinket[] = useMemo(() =>
    trinkets.map((trinket, index) => ({
      ...trinket,
      id: generateTrinketId(trinket, index),
      color: trinket.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    })), [trinkets]
  );

  if (!processedTrinkets.length) {
    return (
      <div
        className={`w-full h-screen flex items-center justify-center ${className}`}
        style={{ backgroundColor }}
      >
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No trinkets to display</p>
          <p className="text-sm mt-2">Add some trinkets to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-screen ${className}`} style={{ backgroundColor }}>
      <Scene
        trinkets={processedTrinkets}
        backgroundColor={backgroundColor}
        showMetadata={showMetadata}
        enableTouch={enableTouch}
        enableKeyboard={enableKeyboard}
        onTrinketFocus={onTrinketFocus}
      />
    </div>
  );
}