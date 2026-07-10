import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import marsTexture from "@/assets/mars_texture.jpg";
import marsBump from "@/assets/mars_bump.jpg";

// Kick off the texture fetches the instant this module loads (rather than
// waiting on the WebGL feature check + Canvas mount), so the images are
// already warm in the browser cache by the time <RotatingMars> asks for them.
if (typeof window !== "undefined") {
  for (const src of [marsTexture, marsBump]) {
    const warmup = new Image();
    warmup.src = src;
  }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

function RotatingMars() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [colorMap, bumpMap] = useLoader(THREE.TextureLoader, [marsTexture, marsBump]);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 4;
  bumpMap.anisotropy = 4;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[2, 128, 128]} />
      <meshStandardMaterial
        map={colorMap}
        bumpMap={bumpMap}
        bumpScale={0.045}
        roughness={0.92}
        metalness={0.02}
      />
    </mesh>
  );
}

function MarsLoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial color="#a1512f" roughness={1} />
    </mesh>
  );
}

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function StaticMarsFallback({ className = "" }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 32%, #d98a5f 0%, #b85f3a 22%, #8f4128 45%, #5c2818 68%, #2a1109 88%, #0a0503 100%)",
        boxShadow: "inset -40px -20px 90px rgba(0,0,0,0.75), 0 0 120px rgba(180,90,50,0.15)",
      }}
    />
  );
}

export function MarsPlanet({ className = "" }: { className?: string }) {
  const [webglOk, setWebglOk] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglOk(supportsWebGL());
  }, []);

  if (webglOk === null) {
    return <div className={className} />;
  }

  if (!webglOk) {
    return <StaticMarsFallback className={className} />;
  }

  return (
    <WebGLErrorBoundary fallback={<StaticMarsFallback className={className} />}>
      <div className={className}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 1.5]}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
        >
          <ambientLight intensity={0.15} />
          <directionalLight position={[-5, 2, 4]} intensity={2.4} color="#ffe8d6" />
          <directionalLight position={[6, -1, -3]} intensity={0.25} color="#4477ff" />
          <Suspense fallback={<MarsLoadingFallback />}>
            <RotatingMars />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
