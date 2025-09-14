"use client";

import { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ErrorBoundary } from "./ErrorBoundary";

interface ModelProps {
  url: string;
  onLoad?: () => void;
}

function Model({ url, onLoad }: ModelProps) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene && onLoad) {
      onLoad();
    }
  }, [scene, onLoad]);

  useEffect(() => {
    if (modelRef.current && scene) {
      const box = new THREE.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new THREE.Vector3());
      modelRef.current.position.sub(center);

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 2 ? 2 / maxDim : 1;
      modelRef.current.scale.setScalar(scale);
    }
  }, [scene]);

  return <primitive ref={modelRef} object={scene} />;
}

function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

interface GLBModelViewerProps {
  modelUrl: string;
  className?: string;
}

export function GLBModelViewer({
  modelUrl,
  className = "",
}: GLBModelViewerProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [modelUrl]);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div className="text-sm text-gray-600 mt-2">
              Loading 3D model...
            </div>
          </div>
        </div>
      )}

      <div className="h-64 bg-gray-50 rounded-lg overflow-hidden">
        <Canvas
          camera={{ position: [2, 2, 2], fov: 50 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor("#f9fafb");
          }}
        >
          <ErrorBoundary
            fallback={
              <Text fontSize={0.5} color="red">
                Something went wrong
              </Text>
            }
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

              <Model url={modelUrl} onLoad={() => setLoading(false)} />

              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                maxPolarAngle={Math.PI}
                minDistance={1}
                maxDistance={10}
              />

              <gridHelper args={[4, 20]} position={[0, -0.01, 0]} />
            </Suspense>
          </ErrorBoundary>
        </Canvas>
      </div>

      <div className="text-xs text-gray-500 text-center mt-2">
        Click and drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
  );
}
