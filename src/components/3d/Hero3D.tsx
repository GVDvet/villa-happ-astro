/**
 * Villa Happ — Hero 3D island
 *
 * Hybrid 3D: subtle Three.js scene in de hero achtergrond.
 * Placeholder: floating distorted orb met material dat refracteert.
 * Later vervangbaar door echt GLB-model (hoodie, accessoire) via
 * <useGLTF /> uit @react-three/drei.
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float, Environment } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import type { Mesh } from 'three';

function FloatingOrb() {
  const meshRef = useRef<Mesh>(null!);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.3;
    meshRef.current.rotation.y = t * 0.15;
    // Mouse parallax: subtle lean towards cursor
    const x = state.mouse.x * 0.3;
    const y = state.mouse.y * 0.3;
    meshRef.current.position.x = x;
    meshRef.current.position.y = y;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} scale={2.4}>
        <icosahedronGeometry args={[1, 8]} />
        <MeshDistortMaterial
          color="#FE6B01"
          attach="material"
          distort={0.45}
          speed={1.2}
          roughness={0.15}
          metalness={0.6}
          emissive="#FE6B01"
          emissiveIntensity={0.08}
        />
      </mesh>
    </Float>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#FFE5C2" />
      <directionalLight position={[-5, -3, 2]} intensity={0.8} color="#FE6B01" />
      <pointLight position={[0, 0, 5]} intensity={0.4} color="#6B7A4E" />
    </>
  );
}

export default function Hero3D() {
  // Server-side render: render nothing (canvas needs client).
  if (typeof window === 'undefined') return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <Lights />
        <FloatingOrb />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}
