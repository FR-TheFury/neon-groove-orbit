import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useAudioStore } from '@/stores/audio';

export default function GalacticCore() {
  const meshRef = useRef<Mesh>(null);
  const innerRef = useRef<Mesh>(null);
  const { smoothedBass, smoothedMid, beatDetected } = useAudioStore();

  useFrame((state) => {
    if (!meshRef.current || !innerRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Optimized rotation calculations
    const bassRotationSpeed = 0.015 + smoothedBass * 0.08;
    const midRotationSpeed = 0.02 + smoothedMid * 0.1;
    
    meshRef.current.rotation.y += bassRotationSpeed;
    meshRef.current.rotation.z = Math.sin(time * 0.8) * 0.2 + smoothedBass * 0.5;
    
    innerRef.current.rotation.y -= midRotationSpeed;
    innerRef.current.rotation.x = Math.cos(time * 0.5) * 0.3 + smoothedMid * 0.4;
    
    // Dramatic beat-responsive scaling
    const baseScale = 1.4;
    const beatMultiplier = beatDetected ? 2.2 : 1 + smoothedBass * 1.2;
    meshRef.current.scale.setScalar(baseScale * beatMultiplier);
    
    // Enhanced inner core reactivity
    const innerScale = 0.8 + smoothedMid * 1.5 + (beatDetected ? 0.8 : 0);
    innerRef.current.scale.setScalar(innerScale);
    
    // More dramatic vertical movement
    const coreGroup = meshRef.current.parent;
    if (coreGroup) {
      coreGroup.position.y = Math.sin(time * 3) * 0.8 + smoothedBass * 3;
    }
  });

  return (
    <group>
      {/* Outer core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshPhysicalMaterial
          color="#9E6BFF"
          emissive="#9E6BFF"
          emissiveIntensity={0.8}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Inner core */}
      <mesh ref={innerRef}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial
          color="#35F0FF"
          emissive="#35F0FF"
          emissiveIntensity={1.2}
          transparent
          opacity={0.8}
          roughness={0}
          metalness={1}
        />
      </mesh>
      
      {/* Central energy sphere */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshPhysicalMaterial
          color="#FF4FD8"
          emissive="#FF4FD8"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}