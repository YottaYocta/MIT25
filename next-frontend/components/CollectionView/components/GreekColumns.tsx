'use client';

import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface GreekColumnsProps {
  positions: [number, number, number][];
}

export function GreekColumns({ positions }: GreekColumnsProps) {
  const { scene } = useGLTF('/models/column/scene.gltf');

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
      {positions.map((position, index) => {
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

        return (
          <group
            key={`column-${index}`}
            position={position}
            scale={[0.004, 0.004, 0.004]}
            castShadow
            receiveShadow
          >
            <primitive object={columnClone} />
          </group>
        );
      })}
    </group>
  );
}