'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DynamicLightingProps {
  currentViewIndex: number;
  trinketPositions: [number, number, number][];
  trinketCount: number;
}

export function DynamicLighting({
  currentViewIndex,
  trinketPositions
}: DynamicLightingProps) {
  const { camera } = useThree();

  const spotlightRef = useRef<THREE.SpotLight>(null);
  const overheadLightRef = useRef<THREE.DirectionalLight>(null);

  const currentSpotlightIntensity = useRef<number>(0);
  const currentOverheadIntensity = useRef<number>(0.9);
  const targetSpotlightIntensity = useRef<number>(0);
  const targetOverheadIntensity = useRef<number>(0.9);

  const spotlightPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const spotlightTarget = useRef<THREE.Vector3>(new THREE.Vector3());

  useEffect(() => {
    const isOverviewMode = currentViewIndex === 0;

    if (isOverviewMode) {
      // Overview mode - use overhead lighting
      targetSpotlightIntensity.current = 0;
      targetOverheadIntensity.current = 0.9;
    } else {
      // Focus mode - use spotlight from camera position
      targetSpotlightIntensity.current = 2.0; // Moderate intensity with city environment
      targetOverheadIntensity.current = 0.4; // Less dramatic dimming with city environment

      // Set spotlight target to focused trinket
      const focusedTrinketIndex = currentViewIndex - 1;
      if (trinketPositions[focusedTrinketIndex]) {
        const [x, y, z] = trinketPositions[focusedTrinketIndex];
        spotlightTarget.current.set(x, y, z);
      }
    }
  }, [currentViewIndex, trinketPositions]);

  useFrame(() => {
    // Faster transitions for more responsive lighting
    const lerpFactor = 0.08; // Increased from 0.05 for faster response
    currentSpotlightIntensity.current = THREE.MathUtils.lerp(
      currentSpotlightIntensity.current,
      targetSpotlightIntensity.current,
      lerpFactor
    );
    currentOverheadIntensity.current = THREE.MathUtils.lerp(
      currentOverheadIntensity.current,
      targetOverheadIntensity.current,
      lerpFactor
    );

    // Update spotlight
    if (spotlightRef.current) {
      // Position spotlight slightly above and offset from camera for better illumination
      const cameraPos = camera.position;
      const offsetVector = new THREE.Vector3(0, 1, 0); // Slight upward offset
      spotlightPosition.current.copy(cameraPos).add(offsetVector);
      spotlightRef.current.position.copy(spotlightPosition.current);

      // Point spotlight at target
      spotlightRef.current.target.position.copy(spotlightTarget.current);
      spotlightRef.current.target.updateMatrixWorld();

      // Update intensity
      spotlightRef.current.intensity = currentSpotlightIntensity.current;
    }

    // Update overhead light
    if (overheadLightRef.current) {
      overheadLightRef.current.intensity = currentOverheadIntensity.current;
    }
  });

  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />

      {/* Dynamic spotlight for focused trinkets */}
      <spotLight
        ref={spotlightRef}
        angle={Math.PI / 4} // Wider 45 degree cone for better coverage
        penumbra={0.4} // Softer edge transition
        intensity={currentSpotlightIntensity.current}
        distance={25} // Increased range
        decay={1.5} // Less aggressive decay
        color="#ffffff" // Pure white for maximum contrast
        castShadow
        shadow-mapSize={[2048, 2048]} // Higher resolution shadows
        shadow-camera-near={0.1}
        shadow-camera-far={25}
      />

      {/* Overhead directional light for overview mode */}
      <directionalLight
        ref={overheadLightRef}
        position={[5, 15, 3]}
        intensity={currentOverheadIntensity.current}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
    </>
  );
}