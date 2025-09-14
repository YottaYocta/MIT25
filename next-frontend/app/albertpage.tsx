'use client';

import { CollectionView, TrinketData } from './components/CollectionView';

const sampleTrinkets: TrinketData[] = [
  {
    id: 'hydroflask-01',
    modelPath: '/models/hydroflask.glb',
    title: 'Hydro Flask Water Bottle',
    note: 'A sustainable stainless steel water bottle that keeps drinks cold for 24 hours or hot for 12 hours. Perfect for outdoor adventures and daily hydration.',
    creatorName: 'Hydro Flask',
    dateCreated: new Date('2009-01-15'),
    color: '#4ECDC4',
    location: 'Bend, Oregon'
  },
  {
    id: 'xai-device-01',
    modelPath: '/models/xai.glb',
    title: 'XAI Computing Device',
    note: 'An innovative AI-powered computing device designed for machine learning applications and advanced data processing.',
    creatorName: 'XAI Technologies',
    dateCreated: new Date('2023-03-10'),
    color: '#FF6B6B',
    location: 'San Francisco, CA'
  },
  {
    id: 'matcha-01',
    modelPath: '/models/matcha.glb',
    title: 'Vintage Camera',
    note: 'A classic 35mm film camera from the golden age of photography. Features manual controls and exceptional build quality.',
    creatorName: 'Leica',
    dateCreated: new Date('1975-08-20'),
    color: '#96CEB4',
    location: 'Wetzlar, Germany'
  },
  {
    id: 'brain-01',
    modelPath: '/models/brain.glb',
    title: 'Smart Watch Series X',
    note: 'Advanced fitness tracking and communication device with health monitoring capabilities and long battery life.',
    creatorName: 'TechCorp',
    dateCreated: new Date('2022-11-05'),
    color: '#45B7D1',
    location: 'Cupertino, CA'
  },
  {
    id: 'matcha-04',
    modelPath: '/models/matcha.glb',
    title: 'Vintage Camera',
    note: 'A classic 35mm film camera from the golden age of photography. Features manual controls and exceptional build quality.',
    creatorName: 'Leica',
    dateCreated: new Date('1975-08-20'),
    color: '#96CEB4',
    location: 'Wetzlar, Germany'
  },
  {
    id: 'matcha-02',
    modelPath: '/models/matcha.glb',
    title: 'Vintage Camera',
    note: 'A classic 35mm film camera from the golden age of photography. Features manual controls and exceptional build quality.',
    creatorName: 'Leica',
    dateCreated: new Date('1975-08-20'),
    color: '#96CEB4',
    location: 'Wetzlar, Germany'
  },
  {
    id: 'hackmit',
    modelPath: '/models/hackmit.glb',
    title: 'HackMIT 2025 Hacker Badge',
    note: 'A classic 35mm film camera from the golden age of photography. Features manual controls and exceptional build quality.',
    creatorName: 'Leica',
    dateCreated: new Date('1975-08-20'),
    color: '#96CEB4',
    location: 'Wetzlar, Germany'
  },
];

export default function Home() {
  const handleTrinketFocus = (trinket: TrinketData | null, index: number) => {
    console.log('Focused on trinket:', trinket?.title || 'Overview', 'at index:', index);
  };

  return (
    <main className="w-full h-screen">
      <CollectionView
        trinkets={sampleTrinkets}
        backgroundColor="#f5f5f5"
        showMetadata={true}
        enableTouch={true}
        enableKeyboard={true}
        onTrinketFocus={handleTrinketFocus}
      />
    </main>
  );
}
