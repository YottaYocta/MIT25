"use client";

import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Component to load and display the GLB model
function Model({ url, onLoad, onError }: { url: string; onLoad?: () => void; onError?: (error: any) => void }) {
  const { scene, error } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (scene && onLoad) {
      onLoad();
    }
  }, [scene, onLoad]);

  useEffect(() => {
    if (modelRef.current && scene) {
      // Center the model
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      modelRef.current.position.sub(center);

      // Scale the model to fit within a reasonable size
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 2 ? 2 / maxDim : 1;
      modelRef.current.scale.setScalar(scale);
    }
  }, [scene]);

  if (error) {
    return null; // Let parent component handle error display
  }

  return <primitive ref={modelRef} object={scene} />;
}

// Camera setup component
function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

// Main GLB Model Viewer component
interface GLBModelViewerProps {
  modelUrl: string;
  className?: string;
}

export function GLBModelViewer({ modelUrl, className = "" }: GLBModelViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle model URL changes
  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [modelUrl]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-sm font-medium">Error loading model</div>
          <div className="text-gray-500 text-xs mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div className="text-sm text-gray-600 mt-2">Loading 3D model...</div>
          </div>
        </div>
      )}

      <div className="h-64 bg-gray-50 rounded-lg overflow-hidden">
        <Canvas
          camera={{ position: [2, 2, 2], fov: 50 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor('#f9fafb'); // Light gray background
          }}
        >
          <Suspense fallback={null}>
            <CameraSetup />
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />

            <Model
              url={modelUrl}
              onLoad={() => setLoading(false)}
              onError={(err) => {
                console.error('Error loading GLB model:', err);
                setLoading(false);
                setError('Failed to load 3D model');
              }}
            />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI}
              minDistance={1}
              maxDistance={10}
            />

            {/* Grid helper for reference */}
            <gridHelper args={[4, 20]} position={[0, -0.01, 0]} />
          </Suspense>
        </Canvas>
      </div>

      <div className="text-xs text-gray-500 text-center mt-2">
        Click and drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
  );
}
