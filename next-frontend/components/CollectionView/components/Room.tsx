'use client';

export function Room() {
  return (
    <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial
        color="#f5f5f5"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}