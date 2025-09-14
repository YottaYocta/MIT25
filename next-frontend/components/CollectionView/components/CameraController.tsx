'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  currentViewIndex: number;
  trinketCount: number;
  trinketPositions?: [number, number, number][];
  navigationDirection?: 'increment' | 'decrement' | null;
}

interface CameraPosition {
  position: [number, number, number];
  target: [number, number, number];
}

export function CameraController({
  currentViewIndex,
  trinketCount,
  trinketPositions = [],
  navigationDirection = null
}: CameraControllerProps) {
  const { camera, size } = useThree();
  const targetPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3());
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3());
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3());

  const getCameraPositions = useCallback((): CameraPosition[] => {
    const positions: CameraPosition[] = [];

    // Smart overview positioning - minimal scaling, mostly fixed for reliability
    let overviewDistance = 8;
    let overviewHeight = 6;

    // Only scale for very large object counts (8+) to avoid getting too close
    if (trinketCount >= 8) {
      const sceneRadius = trinketPositions.length > 0
        ? Math.max(...trinketPositions.map(pos => Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2])))
        : 2.5;
      overviewDistance = Math.max(8, sceneRadius * 1.3); // More conservative scaling
      overviewHeight = Math.max(6, sceneRadius * 0.9);
    }

    // Additional mobile scaling for narrow screens
    const aspectRatio = size.width / size.height;
    if (aspectRatio < 0.7 && trinketCount >= 4) {
      const mobileScaleFactor = 1 + (trinketCount - 3) * 0.15;
      overviewDistance *= Math.min(mobileScaleFactor, 2.2);
      overviewHeight *= Math.min(mobileScaleFactor * 0.8, 1.8);
    }

    positions.push({
      position: [overviewDistance, overviewHeight, overviewDistance],
      target: [0, 2, 0]
    });

    if (trinketPositions.length > 0) {
      trinketPositions.forEach((trinketPos) => {
        let x, z;

        if (trinketCount === 1) {
          // Closer positioning for single object
          x = 1.6;
          z = 1.6;
        } else {
          // Closer positioning for multiple objects
          const angle = Math.atan2(trinketPos[2], trinketPos[0]);
          const distance = 2.0; // Reduced distance - closer to objects
          x = trinketPos[0] + Math.cos(angle) * distance;
          z = trinketPos[2] + Math.sin(angle) * distance;
        }

        const height = trinketCount === 1 ? 4.2 : 4.2; // Lowered camera heights

        positions.push({
          position: [x, height, z],
          target: trinketCount === 1 ? [0, 4.0, 0] : [trinketPos[0], trinketPos[1], trinketPos[2]]
        });
      });
    }

    return positions;
  }, [trinketCount, trinketPositions, size]);

  useEffect(() => {
    const positions = getCameraPositions();
    const targetPos = positions[currentViewIndex];

    if (targetPos) {
      targetPosition.current.set(...targetPos.position);
      targetLookAt.current.set(...targetPos.target);
    }
  }, [currentViewIndex, getCameraPositions]);

  useEffect(() => {
    currentPosition.current.copy(camera.position);
    const lookAtVector = new THREE.Vector3();
    camera.getWorldDirection(lookAtVector);
    lookAtVector.multiplyScalar(5).add(camera.position);
    currentLookAt.current.copy(lookAtVector);
  }, [camera]);

  useFrame(() => {
    const lerpFactor = currentViewIndex === 0 ? 0.04 : 0.07; // Increased base rotating speed

    // Calculate orbital interpolation for smoother curved movement
    const currentPos = currentPosition.current;
    const targetPos = targetPosition.current;

    // Use spherical interpolation for more natural orbital movement
    const currentSpherical = new THREE.Spherical();
    const targetSpherical = new THREE.Spherical();

    currentSpherical.setFromVector3(currentPos);
    targetSpherical.setFromVector3(targetPos);

    // Interpolate radius, phi (polar angle), and theta (azimuthal angle) separately
    currentSpherical.radius = THREE.MathUtils.lerp(currentSpherical.radius, targetSpherical.radius, lerpFactor);

    // Handle theta (azimuthal) interpolation with direction-aware paths
    let thetaDiff = targetSpherical.theta - currentSpherical.theta;

    // For two trinkets, force directional paths when navigation direction is specified
    if (trinketCount === 2 && navigationDirection && currentViewIndex > 0) {
      if (navigationDirection === 'increment') {
        // Force counter-clockwise (longer path) - increment should go the long way
        if (thetaDiff < 0) thetaDiff += 2 * Math.PI;
        if (thetaDiff > Math.PI) thetaDiff = thetaDiff; // Keep longer path
      } else if (navigationDirection === 'decrement') {
        // Force clockwise (shorter path) - decrement should go the short way
        if (thetaDiff > Math.PI) thetaDiff -= 2 * Math.PI;
        if (thetaDiff < -Math.PI) thetaDiff += 2 * Math.PI;
      }
    } else {
      // Default behavior: shortest path
      if (thetaDiff > Math.PI) thetaDiff -= 2 * Math.PI;
      if (thetaDiff < -Math.PI) thetaDiff += 2 * Math.PI;
    }

    currentSpherical.theta += thetaDiff * lerpFactor;

    // Interpolate phi (polar angle)
    currentSpherical.phi = THREE.MathUtils.lerp(currentSpherical.phi, targetSpherical.phi, lerpFactor);

    // Convert back to Cartesian and update position
    currentPos.setFromSpherical(currentSpherical);

    // Standard lerp for look-at target
    currentLookAt.current.lerp(targetLookAt.current, lerpFactor);

    camera.position.copy(currentPosition.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}