import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useAudioStore } from '@/stores/audio';

export default function VinylRecord() {
  const meshRef = useRef<Mesh>(null);
  const { isPlaying, frequencyData } = useAudioStore();

  useFrame((state, delta) => {
    if (meshRef.current && isPlaying) {
      // Rotate the vinyl record when playing
      meshRef.current.rotation.z += delta * 2; // 2 rad/sec = ~33 RPM
      
      // Add subtle wobble based on audio
      if (frequencyData) {
        const avgFreq = Array.from(frequencyData).reduce((a, b) => a + b, 0) / frequencyData.length;
        const wobble = (avgFreq / 255) * 0.02;
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 4) * wobble;
      }
    }
  });

  return (
    <group>
      {/* Vinyl Record Base */}
      <mesh ref={meshRef} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2, 2, 0.05, 64]} />
        <meshPhysicalMaterial 
          color="#0a0a0a"
          metalness={0.8}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          emissive="#35F0FF"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Grooves */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={i} position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5 + i * 0.075, 0.52 + i * 0.075, 64]} />
          <meshBasicMaterial 
            color="#35F0FF" 
            transparent 
            opacity={0.3}
          />
        </mesh>
      ))}

      {/* Center Label */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.01, 32]} />
        <meshPhysicalMaterial 
          color="#FF4FD8"
          emissive="#FF4FD8"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Center Hole */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}