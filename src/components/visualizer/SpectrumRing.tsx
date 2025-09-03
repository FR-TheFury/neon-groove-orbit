import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D } from 'three';
import { useAudioStore } from '@/stores/audio';

const RING_COUNT = 64;

export default function SpectrumRing() {
  const meshRef = useRef<InstancedMesh>(null);
  const { frequencyData } = useAudioStore();

  const dummy = useMemo(() => new Object3D(), []);

  useFrame(() => {
    if (!meshRef.current || !frequencyData) return;

    for (let i = 0; i < RING_COUNT; i++) {
      const angle = (i / RING_COUNT) * Math.PI * 2;
      const radius = 4;
      
      // Get frequency data for this bar
      const freqIndex = Math.floor((i / RING_COUNT) * frequencyData.length);
      const amplitude = frequencyData[freqIndex] / 255;
      
      // Position around the circle
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 0.2 + amplitude * 2;
      
      dummy.position.set(x, height / 2, z);
      dummy.scale.set(0.1, height, 0.1);
      dummy.rotation.y = angle + Math.PI / 2;
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RING_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial
        color="#35F0FF"
        emissive="#35F0FF"
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}