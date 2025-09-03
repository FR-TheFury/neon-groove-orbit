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
  
  const { frequencyData, bassLevel, midLevel, trebleLevel } = useAudioStore();
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
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 0.2 + amplitude * heightMultiplier + level * 2;
      
      dummy.position.set(x, height / 2, z);
      dummy.scale.set(0.15, height, 0.15);
      dummy.rotation.y = angle + Math.PI / 2;
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  };

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Update each ring with different properties
    updateRing(bassRingRef, bassLevel, 6, 4, "#FF4FD8");
    updateRing(midRingRef, midLevel, 8, 3, "#35F0FF");
    updateRing(trebleRingRef, trebleLevel, 10, 2, "#9E6BFF");
    
    // Rotate rings
    if (bassRingRef.current) {
      bassRingRef.current.rotation.y = time * 0.2;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.y = -time * 0.15;
    }
    if (trebleRingRef.current) {
      trebleRingRef.current.rotation.y = time * 0.1;
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