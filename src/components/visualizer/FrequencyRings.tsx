import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';
import { useAudioStore } from '@/stores/audio';

const RING_COUNT = 3;
const SEGMENTS_PER_RING = 24;

export default function FrequencyRings() {
  const bassRingRef = useRef<InstancedMesh>(null);
  const midRingRef = useRef<InstancedMesh>(null);
  const trebleRingRef = useRef<InstancedMesh>(null);
  
  const { frequencyData, smoothedBass, smoothedMid, smoothedTreble, beatDetected } = useAudioStore();
  const dummy = useMemo(() => new Object3D(), []);

  const updateRing = (
    meshRef: React.RefObject<InstancedMesh>,
    level: number,
    radius: number,
    heightMultiplier: number
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
    
    // Instant response like 2D visualizers
    updateRing(bassRingRef, smoothedBass, 4, 8);
    updateRing(midRingRef, smoothedMid, 6, 6);  
    updateRing(trebleRingRef, smoothedTreble, 8, 4);
    
    // Fast rotation with immediate audio response
    if (bassRingRef.current) {
      bassRingRef.current.rotation.y += 0.05 + smoothedBass * 0.2;
      bassRingRef.current.position.y = smoothedBass * 4;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.y -= 0.04 + smoothedMid * 0.15;
      midRingRef.current.position.y = smoothedMid * 3;
    }
    if (trebleRingRef.current) {
      trebleRingRef.current.rotation.y += 0.06 + smoothedTreble * 0.25;
      trebleRingRef.current.position.y = smoothedTreble * 2;
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