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
    
    // Ultra-fast rotation for immediate response
    meshRef.current.rotation.y += 0.02 + smoothedBass * 0.15;
    meshRef.current.rotation.z = smoothedBass * 0.8;
    
    innerRef.current.rotation.y -= 0.03 + smoothedMid * 0.2;
    innerRef.current.rotation.x = smoothedMid * 0.6;
    
    // Instant scale response like 2D visualizers
    const coreScale = 1.6 + smoothedBass * 2 + (beatDetected ? 1 : 0);
    meshRef.current.scale.setScalar(coreScale);
    
    const innerScale = 1 + smoothedMid * 2 + (beatDetected ? 1.2 : 0);
    innerRef.current.scale.setScalar(innerScale);
    
    // Instant vertical response
    const coreGroup = meshRef.current.parent;
    if (coreGroup) {
      coreGroup.position.y = smoothedBass * 4;
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