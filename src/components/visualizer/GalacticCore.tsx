import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useAudioStore } from '@/stores/audio';

export default function GalacticCore() {
  const meshRef = useRef<Mesh>(null);
  const innerRef = useRef<Mesh>(null);
  const { bassLevel, midLevel, beatDetected } = useAudioStore();

  useFrame((state) => {
    if (!meshRef.current || !innerRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Main core rotation with bass boost
    const bassRotationSpeed = 0.01 + bassLevel * 0.05;
    meshRef.current.rotation.y += bassRotationSpeed;
    meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.1 + bassLevel * 0.3;
    
    // Inner core counter-rotation with mid frequencies
    const midRotationSpeed = 0.015 + midLevel * 0.08;
    innerRef.current.rotation.y -= midRotationSpeed;
    innerRef.current.rotation.x = Math.cos(time * 0.3) * 0.15 + midLevel * 0.2;
    
    // Scale pulsing with beat - more dramatic
    const baseScale = 1.2;
    const beatScale = beatDetected ? 1.8 : 1 + bassLevel * 0.8;
    const finalScale = baseScale * beatScale;
    meshRef.current.scale.setScalar(finalScale);
    
    // Inner core scaling with mid frequencies
    const innerBaseScale = 0.7;
    const innerScale = innerBaseScale + midLevel * 1.2 + (beatDetected ? 0.5 : 0);
    innerRef.current.scale.setScalar(innerScale);
    
    // Vertical movement with bass
    const coreGroup = meshRef.current.parent;
    if (coreGroup) {
      coreGroup.position.y = Math.sin(time * 2) * 0.5 + bassLevel * 2;
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