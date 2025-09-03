import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import GalacticCore from './GalacticCore';
import StarField from './StarField';
import NebulaParticles from './NebulaParticles';
import FrequencyRings from './FrequencyRings';
import EnergyBeams from './EnergyBeams';
import { Color } from 'three';
import { useAudioStore } from '@/stores/audio';

export default function Scene3D() {
  const { beatDetected, bassLevel } = useAudioStore();

  return (
    <div className="w-full h-full">
      <Canvas gl={{ 
        antialias: false, 
        alpha: true, 
        powerPreference: "high-performance",
        stencil: false,
        depth: true
      }}
      performance={{ min: 0.8 }}>
        <PerspectiveCamera 
          makeDefault 
          position={[15, 8, 15]} 
          fov={75}
        />
        
        {/* Dynamic Lighting */}
        <ambientLight intensity={0.1} />
        <pointLight 
          position={[0, 15, 0]} 
          intensity={2 + bassLevel * 3} 
          color="#9E6BFF" 
          distance={50}
        />
        <pointLight 
          position={[20, 10, 20]} 
          intensity={1 + bassLevel * 2} 
          color="#35F0FF" 
          distance={40}
        />
        <pointLight 
          position={[-20, 10, -20]} 
          intensity={1 + bassLevel * 2} 
          color="#FF4FD8" 
          distance={40}
        />
        
        {/* Cosmic Environment */}
        <Environment preset="night" />
        <fog attach="fog" args={[new Color('#000510'), 20, 100]} />

        {/* Galactic Components */}
        <Suspense fallback={null}>
          <StarField />
          <NebulaParticles />
          <GalacticCore />
          <FrequencyRings />
          <EnergyBeams />
        </Suspense>

        {/* Enhanced Cosmic Environment */}

        {/* Enhanced Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={50}
          minDistance={5}
          autoRotate={true}
          autoRotateSpeed={beatDetected ? 1.5 : 0.3}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}