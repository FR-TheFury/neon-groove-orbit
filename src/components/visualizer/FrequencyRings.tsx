import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';
import { useAudioStore } from '@/stores/audio';

const RING_COUNT = 3;
const SEGMENTS_PER_RING = 64;

export default function FrequencyRings() {
  const bassRingRef = useRef<InstancedMesh>(null);
  const midRingRef = useRef<InstancedMesh>(null);
  const trebleRingRef = useRef<InstancedMesh>(null);
  
  const { frequencyData, bassLevel, midLevel, trebleLevel, beatDetected } = useAudioStore();
  const dummy = useMemo(() => new Object3D(), []);

  const updateRing = (
    meshRef: React.RefObject<InstancedMesh>,
    level: number,
    radius: number,
    heightMultiplier: number,
    color: string
  ) => {
    if (!meshRef.current || !frequencyData) return;

    for (let i = 0; i < SEGMENTS_PER_RING; i++) {
      const angle = (i / SEGMENTS_PER_RING) * Math.PI * 2;
      
      // Get frequency data for this segment
      const freqIndex = Math.floor((i / SEGMENTS_PER_RING) * frequencyData.length);
      const amplitude = frequencyData[freqIndex] / 255;
      
      // Position around the circle
      const x = Math.cos(angle) * (radius + level * 2);
      const z = Math.sin(angle) * (radius + level * 2);
      
      // More dramatic height with bass boost
      const baseHeight = 0.3;
      const audioHeight = amplitude * heightMultiplier * (1 + level * 2);
      const beatBoost = beatDetected ? 2 : 1;
      const height = baseHeight + audioHeight * beatBoost;
      
      dummy.position.set(x, height / 2, z);
      
      // Dynamic scaling based on audio
      const scaleX = 0.15 + amplitude * 0.3;
      const scaleZ = 0.15 + amplitude * 0.3;
      dummy.scale.set(scaleX, height, scaleZ);
      
      dummy.rotation.y = angle + Math.PI / 2;
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  };

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Update each ring with different properties - more intense
    updateRing(bassRingRef, bassLevel, 6, 6, "#FF4FD8"); // Increased multiplier
    updateRing(midRingRef, midLevel, 8, 4, "#35F0FF");   // Increased multiplier  
    updateRing(trebleRingRef, trebleLevel, 10, 3, "#9E6BFF"); // Increased multiplier
    
    // Rotate rings with audio influence
    if (bassRingRef.current) {
      const bassSpeed = 0.2 + bassLevel * 0.5;
      bassRingRef.current.rotation.y = time * bassSpeed;
      // Tilt with beat
      bassRingRef.current.rotation.x = beatDetected ? 0.2 : 0;
    }
    if (midRingRef.current) {
      const midSpeed = 0.15 + midLevel * 0.4;
      midRingRef.current.rotation.y = -time * midSpeed;
      midRingRef.current.rotation.z = Math.sin(time * 2) * midLevel * 0.3;
    }
    if (trebleRingRef.current) {
      const trebleSpeed = 0.1 + trebleLevel * 0.3;
      trebleRingRef.current.rotation.y = time * trebleSpeed;
      trebleRingRef.current.position.y = Math.sin(time * 3) * trebleLevel * 2;
    }
  });

  return (
    <group>
      {/* Bass Ring */}
      <instancedMesh ref={bassRingRef} args={[undefined, undefined, SEGMENTS_PER_RING]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          color="#FF4FD8"
          emissive="#FF4FD8"
          emissiveIntensity={0.8}
          transparent
          opacity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </instancedMesh>
      
      {/* Mid Ring */}
      <instancedMesh ref={midRingRef} args={[undefined, undefined, SEGMENTS_PER_RING]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
        <meshPhysicalMaterial
          color="#35F0FF"
          emissive="#35F0FF"
          emissiveIntensity={0.6}
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.9}
        />
      </instancedMesh>
      
      {/* Treble Ring */}
      <instancedMesh ref={trebleRingRef} args={[undefined, undefined, SEGMENTS_PER_RING]}>
        <octahedronGeometry args={[0.8, 0]} />
        <meshPhysicalMaterial
          color="#9E6BFF"
          emissive="#9E6BFF"
          emissiveIntensity={0.7}
          transparent
          opacity={0.6}
          roughness={0.3}
          metalness={0.7}
        />
      </instancedMesh>
    </group>
  );
}