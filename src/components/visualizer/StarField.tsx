import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { useAudioStore } from '@/stores/audio';

const STAR_COUNT = 50;

export default function StarField() {
  const meshRef = useRef<InstancedMesh>(null);
  const { smoothedTreble, smoothedMid } = useAudioStore();

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
      // Ultra-simplified movement for performance
      const speedMultiplier = star.speed * (1.5 + smoothedTreble * 4);
      star.position.multiplyScalar(1 + speedMultiplier * 0.01);
      
      // Reset if too far
      if (star.position.lengthSq() > 1600) {
        star.position.multiplyScalar(0.1);
      }
      
      dummy.position.copy(star.position);
      const scale = star.size * (1 + smoothedMid * 2);
      dummy.scale.setScalar(scale);
      
      // Minimal rotation for performance
      dummy.rotation.set(0, 0, 0);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]}>
      <sphereGeometry args={[0.05, 3, 3]} />
      <meshBasicMaterial
        color="#FFFFFF"
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}