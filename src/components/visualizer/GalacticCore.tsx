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
    
    // Main core rotation
    meshRef.current.rotation.y += 0.01 + bassLevel * 0.02;
    meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
    
    // Inner core counter-rotation
    innerRef.current.rotation.y -= 0.015 + midLevel * 0.03;
    innerRef.current.rotation.x = Math.cos(time * 0.3) * 0.15;
    
    // Scale pulsing with beat
    const scale = 1 + (beatDetected ? 0.3 : bassLevel * 0.2);
    meshRef.current.scale.setScalar(scale);
    
    // Inner core scaling
    const innerScale = 0.7 + midLevel * 0.5;
    innerRef.current.scale.setScalar(innerScale);
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