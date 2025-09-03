import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import VinylRecord from './VinylRecord';
import SpectrumRing from './SpectrumRing';
import { Color } from 'three';

export default function Scene3D() {
  return (
    <div className="w-full h-full">
      <Canvas gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[6, 3, 6]} fov={60} />
        
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#35F0FF" />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#FF4FD8" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={0.5}
          intensity={1}
          color="#9E6BFF"
          castShadow
        />

        {/* Environment */}
        <Environment preset="night" background />
        <fog attach="fog" args={[new Color('#0B1020'), 5, 50]} />

        {/* 3D Components */}
        <Suspense fallback={null}>
          <VinylRecord />
          <SpectrumRing />
          
          {/* Platform */}
          <mesh position={[0, -0.5, 0]} receiveShadow>
            <cylinderGeometry args={[6, 6, 0.2, 32]} />
            <meshPhysicalMaterial
              color="#11162B"
              metalness={0.8}
              roughness={0.3}
              emissive="#35F0FF"
              emissiveIntensity={0.05}
            />
          </mesh>
        </Suspense>

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          maxDistance={20}
          minDistance={3}
          maxPolarAngle={Math.PI / 2}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}