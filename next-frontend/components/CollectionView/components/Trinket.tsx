'use client';

import { useRef, Suspense, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ProcessedTrinket } from '../types';
import { ModelErrorBoundary } from '../../ModelErrorBoundary';

interface TrinketProps {
  trinket: ProcessedTrinket;
  position?: [number, number, number];
  radius?: number;
  isFocused?: boolean;
  enableBobbing?: boolean;
}

// Debug component to test model URL accessibility
function ModelDebugger({ modelPath }: { modelPath: string }) {
  useEffect(() => {
    const testModel = async () => {
      try {
        console.log('🧪 ModelDebugger: Testing model URL:', modelPath);
        const response = await fetch(modelPath, { method: 'HEAD' });
        console.log('🧪 ModelDebugger: Response status:', response.status);
        console.log('🧪 ModelDebugger: Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          console.log('🧪 ModelDebugger: ✅ Model accessible');
        } else {
          console.log('🧪 ModelDebugger: ❌ Model not accessible');
        }
      } catch (error) {
        console.error('🧪 ModelDebugger: Fetch error:', error);
      }
    };
    
    testModel();
  }, [modelPath]);
  
  return null; // This component only logs debug info
}

// Component for loading GLTF models with proper error handling
function GLTFModel({ modelPath }: { modelPath: string }) {
  console.log('🔍 GLTFModel: Attempting to load model from:', modelPath);
  const [isReady, setIsReady] = useState(false);
  
  let gltfResult;
  try {
    gltfResult = useGLTF(modelPath);
  } catch (error) {
    console.error('❌ GLTFModel: useGLTF hook failed for:', modelPath);
    console.error('❌ GLTFModel: Hook error type:', typeof error);
    console.error('❌ GLTFModel: Hook error:', error);
    
    if (error instanceof Error) {
      console.error('❌ GLTFModel: Error message:', error.message);
      console.error('❌ GLTFModel: Error stack:', error.stack);
    } else {
      console.error('❌ GLTFModel: Non-Error object thrown:', error);
    }
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
      console.error('🔐 GLTFModel: Authentication required for model access');
    }
    
    // For promises or other async errors, create a proper Error object
    if (error && typeof error === 'object' && 'then' in error) {
      throw new Error('Model loading failed: Authentication or network error');
    }
    
    throw error; // Re-throw to trigger error boundary
  }
  
  if (!gltfResult || !gltfResult.scene) {
    const error = new Error(`Invalid GLTF result for model: ${modelPath}`);
    console.error('❌ GLTFModel: Invalid GLTF result:', gltfResult);
    throw error;
  }
  
  const { scene } = gltfResult;
  
  // Wait for model and materials to be fully ready
  useEffect(() => {
    if (scene) {
      // Small delay to ensure materials are properly loaded and applied
      const timer = setTimeout(() => {
        console.log('✅ GLTFModel: Model ready after delay for:', modelPath);
        setIsReady(true);
      }, 150); // 150ms delay to ensure proper material loading
      
      return () => clearTimeout(timer);
    }
  }, [scene, modelPath]);
  
  // Don't render until we're ready
  if (!isReady) {
    return (
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.3}
          roughness={0.8}
          metalness={0.0}
          wireframe
        />
      </mesh>
    );
  }
  
  console.log('✅ GLTFModel: Successfully loaded model from:', modelPath);
  console.log('📊 GLTFModel: Scene data:', scene);
  
  // Clone the scene to avoid sharing the same instance
  const clonedScene = scene.clone();
  
  // Ensure proper material setup for lighting
  clonedScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Ensure materials respond to lighting properly
      if (mesh.material && 'needsUpdate' in mesh.material) {
        mesh.material.needsUpdate = true;
      }
    }
  });
  
  console.log('🎨 GLTFModel: Scene setup complete for:', modelPath);
  return <primitive object={clonedScene} />;
}

export function Trinket({
  trinket,
  position = [0, -0.5, 0],
  radius = 0.3,
  isFocused = false,
  enableBobbing = false
}: TrinketProps) {
  console.log('🔍 Trinket: Rendering trinket with data:', trinket);
  console.log('🔍 Trinket: Model path received:', trinket.modelPath);
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(...position));
  const currentRotation = useRef<number>(0);
  const bobbingOffset = useRef<number>(0);

  const { camera } = useThree();

  targetPosition.current.set(...position);

  useFrame((state) => {
    if (groupRef.current) {
      currentPosition.current.lerp(targetPosition.current, 0.02);

      // Add subtle bobbing for focused trinkets or when explicitly enabled
      if (isFocused || enableBobbing) {
        const targetBobbing = Math.sin(state.clock.elapsedTime * 2.5) * 0.05; // Reduced bobbing
        bobbingOffset.current = THREE.MathUtils.lerp(bobbingOffset.current, targetBobbing, 0.1);
      } else {
        bobbingOffset.current = THREE.MathUtils.lerp(bobbingOffset.current, 0, 0.05);
      }

      const finalPosition = currentPosition.current.clone();
      finalPosition.y += bobbingOffset.current;
      groupRef.current.position.copy(finalPosition);

      let targetRotation: number;

      if (isFocused) {
        const trinketPos = currentPosition.current;
        const cameraPos = camera.position;
        targetRotation = Math.atan2(cameraPos.x - trinketPos.x, cameraPos.z - trinketPos.z);
      } else {
        targetRotation = state.clock.elapsedTime * 0.30;
      }

      let rotationDiff = targetRotation - currentRotation.current;
      rotationDiff = ((rotationDiff % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
      const normalizedTarget = currentRotation.current + rotationDiff;

      const lerpFactor = isFocused ? 0.06 : 0.015;
      currentRotation.current = THREE.MathUtils.lerp(
        currentRotation.current,
        normalizedTarget,
        lerpFactor
      );

      groupRef.current.rotation.y = currentRotation.current;
    }
  });

  return (
    <group
      ref={groupRef}
      position={currentPosition.current}
      scale={[radius * 1.2, radius * 1.2, radius * 1.2]}
      castShadow
      receiveShadow
    >
      {isFocused && (
        <pointLight
          position={[0, 1, 0]}
          intensity={2.0}
          distance={3}
          decay={1}
          color="#ffffff"
        />
      )}

      {isFocused && (
        <>
          <pointLight
            position={[1, 0.5, 1]}
            intensity={1.5}
            distance={2}
            decay={2}
            color="#fff8e1"
          />
          <pointLight
            position={[-1, 0.5, -1]}
            intensity={1.5}
            distance={2}
            decay={2}
            color="#fff8e1"
          />
        </>
      )}

      {trinket.modelPath && trinket.modelPath.trim() !== '' ? (
        <>
          <ModelDebugger modelPath={trinket.modelPath} />
          <ModelErrorBoundary
            fallback={
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                  color="#ff9999" 
                  transparent 
                  opacity={0.7}
                  roughness={0.6}
                  metalness={0.1}
                />
              </mesh>
            }
          >
            <Suspense fallback={
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshStandardMaterial 
                  color="#ffffff" 
                  transparent 
                  opacity={0.5}
                  roughness={0.8}
                  metalness={0.0}
                  wireframe
                />
              </mesh>
            }>
              <GLTFModel modelPath={trinket.modelPath} />
            </Suspense>
          </ModelErrorBoundary>
        </>
      ) : (
        // Fallback: Display a placeholder cube when no model path
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#cccccc" 
            transparent 
            opacity={0.7}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

// Preload common models to improve performance
export function preloadTrinketModels(modelPaths: string[]) {
  modelPaths.forEach(path => {
    if (path && path.trim() !== '') {
      try {
        useGLTF.preload(path);
      } catch (error) {
        console.warn('Failed to preload model:', path, error);
      }
    }
  });
}