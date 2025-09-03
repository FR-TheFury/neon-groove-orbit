import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { useAudioStore } from '@/stores/audio';

const STAR_COUNT = 1000;

export default function StarField() {
  const meshRef = useRef<InstancedMesh>(null);
  const { trebleLevel, midLevel } = useAudioStore();

  const dummy = useMemo(() => new Object3D(), []);
  
  const stars = useMemo(() => {
    const temp = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      temp.push({
        position: new Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        ),
        speed: 0.1 + Math.random() * 0.5,
        size: 0.1 + Math.random() * 0.3,
        color: Math.random()
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    
    stars.forEach((star, i) => {
      // Move stars outward from center
      const direction = star.position.clone().normalize();
      star.position.add(direction.multiplyScalar(star.speed * (1 + trebleLevel)));
      
      // Reset stars that are too far
      if (star.position.length() > 50) {
        star.position.set(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
      }
      
      // Set position and scale
      dummy.position.copy(star.position);
      const scale = star.size * (1 + midLevel * 0.5);
      dummy.scale.setScalar(scale);
      
      // Add slight rotation
      dummy.rotation.set(
        time * star.speed,
        time * star.speed * 0.5,
        0
      );
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]}>
      <sphereGeometry args={[0.05, 4, 4]} />
      <meshBasicMaterial
        color="#FFFFFF"
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}