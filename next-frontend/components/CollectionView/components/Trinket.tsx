'use client';

import { useRef } from 'react';
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
}

// Component for loading GLTF models
function GLTFModel({ modelPath }: { modelPath: string }) {
  const { scene } = useGLTF(modelPath);
  return <primitive object={scene.clone()} />;
}

export function Trinket({
  trinket,
  position = [0, -0.5, 0],
  radius = 0.3,
  isFocused = false
}: TrinketProps) {
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

      // Add subtle bobbing for focused trinkets
      if (isFocused) {
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

      {trinket.modelPath ? (
        <ModelErrorBoundary
          fallback={
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                color="#ff9999" 
                transparent 
                opacity={0.7}
              />
            </mesh>
          }
        >
          <GLTFModel modelPath={trinket.modelPath} />
        </ModelErrorBoundary>
      ) : (
        // Fallback: Display a placeholder cube when no model path
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#cccccc" 
            transparent 
            opacity={0.7}
          />
        </mesh>
      )}
    </group>
  );
}