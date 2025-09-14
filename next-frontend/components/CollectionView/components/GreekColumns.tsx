'use client';

import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ModelErrorBoundary } from '../../ModelErrorBoundary';
import { Suspense, useState, useEffect } from 'react';

interface GreekColumnsProps {
  positions: [number, number, number][];
}

interface MarbleTextures {
  color: THREE.Texture;
  normal: THREE.Texture;
  roughness: THREE.Texture;
}

function ColumnWithTextures({ marbleTextures }: { marbleTextures: MarbleTextures }) {
  const { scene } = useGLTF('/models/column/scene.gltf');
  const [isReady, setIsReady] = useState(false);
  
  // Wait for model and materials to be fully ready
  useEffect(() => {
    if (scene) {
      // Small delay to ensure materials are properly loaded and applied
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100); // Shorter delay for static models
      
      return () => clearTimeout(timer);
    }
  }, [scene]);
  
  // Don't render until we're ready - show wireframe placeholder
  if (!isReady) {
    return (
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[15, 20, 200, 8]} />
        <meshStandardMaterial 
          color="#e0e0e0" 
          wireframe 
          transparent 
          opacity={0.3}
        />
      </mesh>
    );
  }
  
  // Clone the scene to avoid sharing the same instance
  const columnClone = scene.clone();

  // Apply complete PBR marble material to all meshes in the column
  columnClone.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.material = new THREE.MeshStandardMaterial({
        // Base color and albedo
        map: marbleTextures.color,

        // Normal mapping for surface detail and marble veining
        normalMap: marbleTextures.normal,
        normalScale: new THREE.Vector2(0.8, 0.8),

        // Roughness mapping for realistic shine variation
        roughnessMap: marbleTextures.roughness,
        roughness: 0.3, // Base roughness value

        // Material properties optimized for marble
        metalness: 0.05, // Very low metalness for marble

        // Ensure solid appearance
        transparent: false,
        opacity: 1.0,
        side: THREE.DoubleSide, // Render both sides to fix transparency issues
        alphaTest: 0.0,

        // Remove displacement mapping as it may cause geometry issues
        // For columns, normal mapping provides sufficient surface detail
      });

      mesh.material.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  return <primitive object={columnClone} />;
}

export function GreekColumns({ positions }: GreekColumnsProps) {

  // Load PBR marble texture set
  const marbleTextures = useTexture({
    color: '/textures/Marble010_1K-JPG/Marble010_1K-JPG_Color.jpg',
    normal: '/textures/Marble010_1K-JPG/Marble010_1K-JPG_NormalGL.jpg',
    roughness: '/textures/Marble010_1K-JPG/Marble010_1K-JPG_Roughness.jpg'
  });

  // Configure texture properties for proper UV mapping
  Object.values(marbleTextures).forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2); // Adjust repeat to prevent stretching
    texture.flipY = false;
  });

  return (
    <group>
      {positions.map((position, index) => (
        <group
          key={`column-${index}`}
          position={position}
          scale={[0.004, 0.004, 0.004]}
          castShadow
          receiveShadow
        >
          <ModelErrorBoundary
            fallback={
              // Fallback to a simple cylindrical column if model fails to load
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[15, 20, 200, 8]} />
                <meshStandardMaterial 
                  map={marbleTextures.color}
                  normalMap={marbleTextures.normal}
                  normalScale={new THREE.Vector2(0.8, 0.8)}
                  roughnessMap={marbleTextures.roughness}
                  roughness={0.3}
                  metalness={0.05}
                  color="#f0f0f0"
                />
              </mesh>
            }
          >
            <Suspense fallback={
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[15, 20, 200, 8]} />
                <meshStandardMaterial 
                  color="#e0e0e0" 
                  wireframe 
                  transparent 
                  opacity={0.5}
                />
              </mesh>
            }>
              <ColumnWithTextures marbleTextures={marbleTextures} />
            </Suspense>
          </ModelErrorBoundary>
        </group>
      ))}
    </group>
  );
}