import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { useAudioStore } from '@/stores/audio';

const BEAM_COUNT = 8;

export default function EnergyBeams() {
  const meshRef = useRef<InstancedMesh>(null);
  const { bassLevel, midLevel, trebleLevel, beatDetected } = useAudioStore();

  const dummy = useMemo(() => new Object3D(), []);
  
  const beams = useMemo(() => {
    const temp = [];
    for (let i = 0; i < BEAM_COUNT; i++) {
      const angle = (i / BEAM_COUNT) * Math.PI * 2;
      temp.push({
        angle: angle,
        length: 15 + Math.random() * 10,
        speed: 0.01 + Math.random() * 0.02,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    
    beams.forEach((beam, i) => {
      // Calculate beam direction
      const x = Math.cos(beam.angle + time * beam.speed);
      const z = Math.sin(beam.angle + time * beam.speed);
      const y = Math.sin(time * 2 + beam.pulseOffset) * 0.3;
      
      // Position beam from center outward
      const distance = beam.length * (0.3 + bassLevel * 0.7);
      dummy.position.set(x * distance / 2, y, z * distance / 2);
      
      // Scale beam based on audio levels
      const width = 0.1 + midLevel * 0.3;
      const length = distance * (beatDetected ? 1.5 : 1);
      dummy.scale.set(width, width, length);
      
      // Point beam outward from center
      dummy.lookAt(new Vector3(x * beam.length, y, z * beam.length));
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, BEAM_COUNT]}>
      <cylinderGeometry args={[0.05, 0.2, 1, 8]} />
      <meshPhysicalMaterial
        color="#FFFF00"
        emissive="#FFFF00"
        emissiveIntensity={1.5}
        transparent
        opacity={0.8}
        roughness={0}
        metalness={1}
      />
    </instancedMesh>
  );
}