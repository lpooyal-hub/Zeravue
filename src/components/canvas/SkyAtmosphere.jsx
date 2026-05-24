import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function buildPointTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.18, "rgba(255,255,255,0.96)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.34)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function SpaceDepthField({ atmosphereStrength = 0.7 }) {
  const fieldRef = useRef(null);
  const pointTexture = useMemo(() => buildPointTexture(), []);
  const particles = useMemo(() => {
    const positions = [];
    const colors = [];
    const sizes = [];

    for (let index = 0; index < 1400; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const vertical = (Math.random() - 0.5) * 1.25;
      const radius = 18 + Math.random() * 18;
      const x = Math.sin(theta) * radius;
      const y = vertical * radius * 0.56;
      const z = -12 - Math.cos(theta) * radius * 0.72;

      positions.push(x, y, z);

      const color = new THREE.Color(index % 8 === 0 ? "#8fb8ff" : index % 13 === 0 ? "#ffe1b8" : "#cfdcff");
      colors.push(color.r, color.g, color.b);
      sizes.push(0.045 + Math.random() * 0.075);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    return geometry;
  }, []);

  useFrame((_, delta) => {
    if (!fieldRef.current) {
      return;
    }
    fieldRef.current.rotation.y += delta * 0.0035;
    fieldRef.current.rotation.x = Math.sin(performance.now() * 0.00004) * 0.012;
  });

  return (
    <points ref={fieldRef} geometry={particles}>
      <pointsMaterial
        size={0.075}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.1 + atmosphereStrength * 0.26}
        depthWrite={false}
        map={pointTexture}
        alphaMap={pointTexture}
        alphaTest={0.08}
      />
    </points>
  );
}

export function AuroraCurtains({ intensity = 0.72, speed = 0.55 }) {
  const curtainA = useRef(null);
  const curtainB = useRef(null);
  const curtainC = useRef(null);
  const curtainD = useRef(null);
  const glowA = useRef(null);
  const glowB = useRef(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime * (0.42 + speed * 0.95);

    if (curtainA.current) {
      curtainA.current.position.x = Math.sin(t * 0.34) * 2.8;
      curtainA.current.position.y = 3.8 + Math.sin(t * 0.2) * 0.7;
      curtainA.current.rotation.z = Math.sin(t * 0.22) * 0.05;
      curtainA.current.material.opacity = 0.14 + intensity * 0.26 + Math.sin(t * 0.52) * 0.03;
    }

    if (curtainB.current) {
      curtainB.current.position.x = -Math.sin(t * 0.3) * 2.4;
      curtainB.current.position.y = 3.4 + Math.cos(t * 0.23) * 0.64;
      curtainB.current.rotation.z = -Math.sin(t * 0.19) * 0.06;
      curtainB.current.material.opacity = 0.12 + intensity * 0.24 + Math.cos(t * 0.47) * 0.028;
    }

    if (curtainC.current) {
      curtainC.current.position.x = Math.sin(t * 0.28 + 1.4) * 2.1;
      curtainC.current.position.y = 2.6 + Math.sin(t * 0.17 + 0.8) * 0.55;
      curtainC.current.rotation.z = Math.sin(t * 0.21 + 0.5) * 0.07;
      curtainC.current.material.opacity = 0.1 + intensity * 0.2 + Math.cos(t * 0.4) * 0.02;
    }

    if (curtainD.current) {
      curtainD.current.position.x = -Math.sin(t * 0.25 + 0.7) * 2.7;
      curtainD.current.position.y = 2.1 + Math.cos(t * 0.2 + 1.1) * 0.58;
      curtainD.current.rotation.z = -Math.sin(t * 0.18 + 0.3) * 0.06;
      curtainD.current.material.opacity = 0.08 + intensity * 0.18 + Math.sin(t * 0.44) * 0.018;
    }

    if (glowA.current) {
      glowA.current.rotation.y += delta * (0.04 + speed * 0.08);
      glowA.current.material.opacity = 0.05 + intensity * 0.12;
    }

    if (glowB.current) {
      glowB.current.rotation.y -= delta * (0.03 + speed * 0.07);
      glowB.current.material.opacity = 0.045 + intensity * 0.1;
    }
  });

  return (
    <>
      <mesh ref={curtainA} position={[0.5, 3.6, -14.5]} rotation={[0.28, 0.06, -0.24]}>
        <planeGeometry args={[28, 15, 1, 1]} />
        <meshBasicMaterial color="#65ffd6" transparent opacity={0.26} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={curtainB} position={[-0.8, 3.3, -14.2]} rotation={[0.24, -0.09, 0.21]}>
        <planeGeometry args={[27, 14, 1, 1]} />
        <meshBasicMaterial color="#ff66d4" transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={curtainC} position={[1.1, 2.7, -13.8]} rotation={[0.22, 0.04, -0.18]}>
        <planeGeometry args={[25, 12.5, 1, 1]} />
        <meshBasicMaterial color="#a36bff" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={curtainD} position={[-1.3, 2.2, -13.5]} rotation={[0.2, -0.04, 0.16]}>
        <planeGeometry args={[22, 11.5, 1, 1]} />
        <meshBasicMaterial color="#a6ff5e" transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={glowA} position={[0, 2.7, -12.9]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.2, 11.6, 64]} />
        <meshBasicMaterial color="#49e8cf" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={glowB} position={[0, 1.5, -12.7]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.6, 9.4, 64]} />
        <meshBasicMaterial color="#78adff" transparent opacity={0.13} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  );
}

export function AuroraSkyBackdrop({ intensity = 0.72 }) {
  const domeRef = useRef(null);

  useFrame(({ clock }) => {
    if (!domeRef.current) {
      return;
    }
    domeRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.03) * 0.05;
    domeRef.current.material.opacity = 0.2 + intensity * 0.25;
  });

  return (
    <>
      <mesh ref={domeRef} position={[0, 1.3, -14.6]} rotation={[-0.15, 0, 0]}>
        <sphereGeometry args={[24, 48, 32, 0, Math.PI * 2, 0, Math.PI / 1.85]} />
        <meshBasicMaterial color="#1f295e" transparent opacity={0.36} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.9, -14.1]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[34, 16, 1, 1]} />
        <meshBasicMaterial color="#2c1a5b" transparent opacity={0.21} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}

export function AuroraHorizonSilhouette() {
  return (
    <>
      <mesh position={[0, -3.6, -11.6]}>
        <planeGeometry args={[34, 4.8]} />
        <meshBasicMaterial color="#03060c" transparent opacity={0.92} depthWrite={false} />
      </mesh>
      <mesh position={[-7.4, -2.95, -11.45]} rotation={[0, 0, 0.06]}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial color="#04070d" transparent opacity={0.96} depthWrite={false} />
      </mesh>
      <mesh position={[8.2, -3.05, -11.45]} rotation={[0, 0, -0.05]}>
        <circleGeometry args={[3.9, 64]} />
        <meshBasicMaterial color="#04070d" transparent opacity={0.96} depthWrite={false} />
      </mesh>
    </>
  );
}

export function MilkyWayBand({ viewMode = "space", atmosphereStrength = 0.7 }) {
  const pointTexture = useMemo(() => buildPointTexture(), []);
  const particles = useMemo(() => {
    const positions = [];
    const colors = [];
    const sizes = [];

    for (let index = 0; index < 1200; index += 1) {
      const spread = (Math.random() - 0.5) * 18;
      const arc = (Math.random() - 0.5) * 8;
      const depth = -8 + Math.random() * 14;
      const x = spread;
      const y = 2.6 + Math.sin(spread * 0.16) * 1.4 + arc * 0.18;
      const z = depth + Math.cos(spread * 0.11) * 1.6;

      positions.push(x, y, z);

      const color = new THREE.Color(index % 6 === 0 ? "#a7c7ff" : index % 9 === 0 ? "#ffe0b5" : "#d7e4ff");
      colors.push(color.r, color.g, color.b);
      sizes.push(2.8 + Math.random() * 3.6);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    return geometry;
  }, []);

  return (
    <points geometry={particles} rotation={[-0.18, 0.32, 0.15]}>
      <pointsMaterial
        size={viewMode === "space" ? 0.11 : 0.095}
        sizeAttenuation
        vertexColors
        transparent
        opacity={(viewMode === "space" ? 0.08 : 0.05) + atmosphereStrength * (viewMode === "space" ? 0.12 : 0.09)}
        depthWrite={false}
        map={pointTexture}
        alphaMap={pointTexture}
        alphaTest={0.08}
      />
    </points>
  );
}

export function DeepSkyField({ viewMode = "space", atmosphereStrength = 0.7 }) {
  const pointTexture = useMemo(() => buildPointTexture(), []);
  const particles = useMemo(() => {
    const positions = [];
    const colors = [];

    for (let index = 0; index < 2600; index += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.58;
      const radius = 12 + Math.random() * 18;
      const x = Math.sin(theta) * Math.cos(phi) * radius;
      const y = Math.sin(phi) * radius * 0.95;
      const z = -Math.cos(theta) * Math.cos(phi) * radius;

      positions.push(x, y, z);

      const color = new THREE.Color(index % 7 === 0 ? "#9fc3ff" : index % 11 === 0 ? "#ffd59f" : "#dfe8ff");
      colors.push(color.r, color.g, color.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, []);

  return (
    <points geometry={particles}>
      <pointsMaterial
        size={viewMode === "space" ? 0.085 : 0.072}
        sizeAttenuation
        vertexColors
        transparent
        opacity={(viewMode === "space" ? 0.16 : 0.12) + atmosphereStrength * (viewMode === "space" ? 0.3 : 0.22)}
        depthWrite={false}
        map={pointTexture}
        alphaMap={pointTexture}
        alphaTest={0.08}
      />
    </points>
  );
}
