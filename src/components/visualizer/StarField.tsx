import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { useAudioStore } from '@/stores/audio';

const STAR_COUNT = 300;

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
      // Optimized movement calculation
      const speedMultiplier = star.speed * (1 + smoothedTreble * 2);
      star.position.x += Math.cos(star.position.x * 0.01) * speedMultiplier;
      star.position.y += Math.sin(star.position.y * 0.01) * speedMultiplier;
      star.position.z += Math.cos(star.position.z * 0.01) * speedMultiplier;
      
      // Efficient boundary check
      const distanceSquared = star.position.x * star.position.x + 
                             star.position.y * star.position.y + 
                             star.position.z * star.position.z;
      if (distanceSquared > 2500) {
        star.position.multiplyScalar(0.1);
      }
      
      // Set position and scale with interpolation
      dummy.position.copy(star.position);
      const scale = star.size * (0.8 + smoothedMid * 1.2);
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
      <sphereGeometry args={[0.05, 3, 3]} />
      <meshBasicMaterial
        color="#FFFFFF"
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}