'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TrinketView } from '@/components/TrinketView';
import { TrinketData } from '@/components/CollectionView/types';
import { Trinket } from '@/lib/types';
import { ConditionalNav } from '@/components/ConditionalNav';
import { Albert_Sans } from 'next/font/google';

const albertSans = Albert_Sans({
  variable: '--font-albert-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function TrinketPage() {
  const params = useParams();
  const router = useRouter();
  const [trinket, setTrinket] = useState<TrinketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrinket = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/trinkets/${params.id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Trinket not found');
          } else {
            setError('Failed to load trinket');
          }
          return;
        }

        const apiTrinket: Trinket = await response.json();
        
        // Check if trinket has a valid model
        const modelPath = apiTrinket.model_url || apiTrinket.model_path;
          if (!modelPath || modelPath.trim() === '') {
          setError('This trinket is missing its 3D model');
          return;
        }

        // Basic validation for model URL format
        if (!modelPath.includes('.glb') && !modelPath.includes('.gltf')) {
          console.warn('Model path may not be a valid GLB/GLTF file:', modelPath);
        }
        
        // Map API data to TrinketView format
        const trinketData: TrinketData = {
          id: apiTrinket.id,
          modelPath: modelPath,
          title: apiTrinket.title,
          note: apiTrinket.note,
          creatorName: 'Unknown Creator', // API doesn't have creator name, could be enhanced
          dateCreated: new Date(apiTrinket.created_at),
          color: '#4ECDC4', // Default color, could be enhanced with user preferences
          location: 'Unknown Location', // API doesn't have location, could be enhanced
        };

        setTrinket(trinketData);
      } catch (err) {
        console.error('Error fetching trinket:', err);
        setError('Failed to load trinket');
      } finally {
        setLoading(false);
      }
    };

    fetchTrinket();
  }, [params.id]);

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className={`text-gray-600 ${albertSans.className}`}>Loading trinket...</p>
        </div>
      </div>
    );
  }

  if (error || !trinket) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className={`text-2xl font-semibold mb-4 ${albertSans.className}`}>
            {error || 'Trinket not found'}
          </h1>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <TrinketView
        trinket={trinket}
        backgroundColor="#f5f5f5"
        showMetadata={true}
        enableTouch={true}
        enableKeyboard={true}
        onClose={handleClose}
      />
      <ConditionalNav />
    </div>
  );
}


