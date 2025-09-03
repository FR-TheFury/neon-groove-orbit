import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import { useAudioStore } from '@/stores/audio';

const PARTICLE_COUNT = 30;

export default function NebulaParticles() {
  const meshRef = useRef<InstancedMesh>(null);
  const { smoothedBass, smoothedMid, frequencyData } = useAudioStore();

  const dummy = useMemo(() => new Object3D(), []);
  const tempColor = useMemo(() => new Color(), []);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 5 + Math.random() * 15;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 10;
      
      temp.push({
        originalPosition: {
          x: Math.cos(angle) * radius,
          y: height,
          z: Math.sin(angle) * radius
        },
        angle: angle,
        radius: radius,
        speed: 0.001 + Math.random() * 0.002,
        size: 0.2 + Math.random() * 0.5,
        colorHue: Math.random() * 360,
        freqIndex: Math.floor((i / PARTICLE_COUNT) * (frequencyData?.length || 128))
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !frequencyData) return;

    const time = state.clock.elapsedTime;
    
    particles.forEach((particle, i) => {
      // Get frequency data for this particle
      const amplitude = frequencyData[particle.freqIndex] / 255;
      
      // Ultra-simplified orbital motion
      particle.angle += particle.speed * (2 + smoothedBass * 5);
      
      const radiusWithAmp = particle.radius + amplitude * 4;
      const x = Math.cos(particle.angle) * radiusWithAmp;
      const z = Math.sin(particle.angle) * radiusWithAmp;
      const y = particle.originalPosition.y + amplitude * 3;
      
      dummy.position.set(x, y, z);
      
      // Optimized scaling
      const scale = particle.size * (0.6 + amplitude + smoothedMid * 0.8);
      dummy.scale.setScalar(scale);
      
      // Minimal rotation for performance
      dummy.rotation.set(0, particle.angle, 0);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // Color based on frequency and audio levels
      const hue = (particle.colorHue + time * 10 + amplitude * 100) % 360;
      const saturation = 0.8 + amplitude * 0.2;
      const lightness = 0.5 + amplitude * 0.3;
      
      tempColor.setHSL(hue / 360, saturation, lightness);
      meshRef.current.setColorAt(i, tempColor);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[0.1, 4, 4]} />
      <meshPhysicalMaterial
        transparent
        opacity={0.7}
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
      />
    </instancedMesh>
  );
}