'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TrinketView } from '@/components/TrinketView';
import { TrinketData } from '@/components/CollectionView/types';
import { Trinket } from '@/lib/types';
import FloatingShareButton from '@/components/FloatingShareButton';
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
        // console.log('🔍 TrinketPage: Fetching trinket with ID:', params.id);
        
        const response = await fetch(`/api/trinkets/${params.id}`, {
          credentials: 'include',
        });

        // console.log('📡 TrinketPage: API response status:', response.status);
        // console.log('📡 TrinketPage: API response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          console.error('❌ TrinketPage: API request failed with status:', response.status);
          if (response.status === 404) {
            setError('Trinket not found');
          } else if (response.status === 401) {
            setError('This trinket is private. Please sign in to view it.');
          } else {
            setError('Failed to load trinket');
          }
          return;
        }

        const apiTrinket: Trinket = await response.json();
        // console.log('📊 TrinketPage: Received trinket data:', apiTrinket);
        
        // Check if trinket has a valid model
        const modelPath = apiTrinket.model_url || apiTrinket.model_path;
        // console.log('🔍 TrinketPage: Raw model path from API:', modelPath);
        // console.log('🔍 TrinketPage: model_url:', apiTrinket.model_url);
        // console.log('🔍 TrinketPage: model_path:', apiTrinket.model_path);
        
        if (!modelPath || modelPath.trim() === '') {
          // console.error('❌ TrinketPage: No model path found in trinket data');
          setError('This trinket is missing its 3D model');
          return;
        }

        // Basic validation for model URL format
        if (!modelPath.includes('.glb') && !modelPath.includes('.gltf')) {
          console.warn('⚠️ TrinketPage: Model path may not be a valid GLB/GLTF file:', modelPath);
        }
        
        // Construct proper API URL for the model file
        const modelApiUrl = `/api/trinkets/${apiTrinket.id}/files/model`;
        // console.log('🔍 TrinketPage: Constructed model API URL:', modelApiUrl);
        
        // Test if the model endpoint is accessible
        try {
          // console.log('🔍 TrinketPage: Testing model endpoint accessibility...');
          const modelTestResponse = await fetch(modelApiUrl, { 
            method: 'HEAD',
            credentials: 'include' 
          });
          // console.log('📡 TrinketPage: Model endpoint test status:', modelTestResponse.status);
          // console.log('📡 TrinketPage: Model endpoint headers:', Object.fromEntries(modelTestResponse.headers.entries()));
          
          if (!modelTestResponse.ok) {
            console.error('❌ TrinketPage: Model endpoint not accessible, status:', modelTestResponse.status);
          } else {
            console.log('✅ TrinketPage: Model endpoint is accessible');
          }
        } catch (modelTestError) {
          console.error('❌ TrinketPage: Error testing model endpoint:', modelTestError);
        }

        const res = await fetch(`/api/profiles/${apiTrinket.owner_id}`, {
          method: "GET",
          cache: "no-store" // no stale profiles
        });
        if (!res.ok) throw new Error("Failed to load profile");

        const body = await res.json();
        const creatorName = body.data.full_name;
        
        // Map API data to TrinketView format
        const trinketData: TrinketData = {
          id: apiTrinket.id,
          modelPath: modelApiUrl,
          title: apiTrinket.title,
          note: apiTrinket.note,
          creatorName: creatorName, 
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
      <FloatingShareButton />
    </div>
  );
}


