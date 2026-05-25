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

function buildAuroraHdriTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  const skyGradient = context.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, "#173669");
  skyGradient.addColorStop(0.35, "#204375");
  skyGradient.addColorStop(0.64, "#2a4b76");
  skyGradient.addColorStop(0.82, "#21395d");
  skyGradient.addColorStop(1, "#12243e");
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, width, height);

  const horizonGlow = context.createLinearGradient(0, height * 0.58, 0, height * 0.94);
  horizonGlow.addColorStop(0, "rgba(122, 170, 225, 0.0)");
  horizonGlow.addColorStop(0.45, "rgba(147, 201, 255, 0.3)");
  horizonGlow.addColorStop(0.75, "rgba(108, 166, 232, 0.34)");
  horizonGlow.addColorStop(1, "rgba(25, 42, 72, 0.0)");
  context.fillStyle = horizonGlow;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 5; index += 1) {
    const bandY = height * (0.2 + index * 0.11);
    const bandHeight = height * (0.09 + Math.random() * 0.05);
    const gradient = context.createLinearGradient(0, bandY, 0, bandY + bandHeight);
    gradient.addColorStop(0, "rgba(125, 180, 245, 0)");
    gradient.addColorStop(0.3, "rgba(154, 214, 255, 0.14)");
    gradient.addColorStop(0.65, "rgba(124, 188, 255, 0.18)");
    gradient.addColorStop(1, "rgba(95, 144, 205, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, bandY, width, bandHeight);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function buildAuroraCurtainTexture() {
  const width = 512;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  const verticalFade = context.createLinearGradient(0, 0, 0, height);
  verticalFade.addColorStop(0, "rgba(255,255,255,0)");
  verticalFade.addColorStop(0.12, "rgba(255,255,255,0.46)");
  verticalFade.addColorStop(0.54, "rgba(255,255,255,1)");
  verticalFade.addColorStop(0.9, "rgba(255,255,255,0.32)");
  verticalFade.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = verticalFade;
  context.fillRect(0, 0, width, height);

  const sideFade = context.createLinearGradient(0, 0, width, 0);
  sideFade.addColorStop(0, "rgba(0,0,0,0)");
  sideFade.addColorStop(0.12, "rgba(255,255,255,0.95)");
  sideFade.addColorStop(0.5, "rgba(255,255,255,1)");
  sideFade.addColorStop(0.88, "rgba(255,255,255,0.95)");
  sideFade.addColorStop(1, "rgba(0,0,0,0)");
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = sideFade;
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = "source-over";

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function buildSnowTexture() {
  const width = 1024;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  const base = context.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, "#b5c8df");
  base.addColorStop(0.55, "#8fa8c5");
  base.addColorStop(1, "#6f8bab");
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 2200; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.8;
    const alpha = 0.03 + Math.random() * 0.08;
    context.fillStyle = `rgba(255,255,255,${alpha})`;
    context.fillRect(x, y, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.2, 1);
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
  const curtainTexture = useMemo(() => buildAuroraCurtainTexture(), []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime * (0.22 + speed * 0.58);

    if (curtainA.current) {
      curtainA.current.position.x = Math.sin(t * 0.34) * 2.8;
      curtainA.current.position.y = 2.35 + Math.sin(t * 0.2) * 0.6;
      curtainA.current.rotation.z = Math.sin(t * 0.22) * 0.05;
      curtainA.current.material.opacity = 0.24 + intensity * 0.4 + Math.sin(t * 0.52) * 0.04;
    }

    if (curtainB.current) {
      curtainB.current.position.x = -Math.sin(t * 0.3) * 2.4;
      curtainB.current.position.y = 2.05 + Math.cos(t * 0.23) * 0.55;
      curtainB.current.rotation.z = -Math.sin(t * 0.19) * 0.06;
      curtainB.current.material.opacity = 0.22 + intensity * 0.36 + Math.cos(t * 0.47) * 0.032;
    }

    if (curtainC.current) {
      curtainC.current.position.x = Math.sin(t * 0.28 + 1.4) * 2.1;
      curtainC.current.position.y = 1.85 + Math.sin(t * 0.17 + 0.8) * 0.5;
      curtainC.current.rotation.z = Math.sin(t * 0.21 + 0.5) * 0.07;
      curtainC.current.material.opacity = 0.18 + intensity * 0.32 + Math.cos(t * 0.4) * 0.022;
    }

    if (curtainD.current) {
      curtainD.current.position.x = -Math.sin(t * 0.25 + 0.7) * 2.7;
      curtainD.current.position.y = 1.55 + Math.cos(t * 0.2 + 1.1) * 0.46;
      curtainD.current.rotation.z = -Math.sin(t * 0.18 + 0.3) * 0.06;
      curtainD.current.material.opacity = 0.15 + intensity * 0.28 + Math.sin(t * 0.44) * 0.022;
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
      <mesh ref={curtainA} position={[0.5, 2.35, -14.9]} rotation={[0.3, 0.06, -0.18]}>
        <planeGeometry args={[38, 23, 1, 1]} />
        <meshBasicMaterial
          color="#90d7ff"
          map={curtainTexture}
          alphaMap={curtainTexture}
          transparent
          opacity={0.54}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={curtainB} position={[-0.8, 2.05, -14.7]} rotation={[0.28, -0.09, 0.16]}>
        <planeGeometry args={[36, 21, 1, 1]} />
        <meshBasicMaterial
          color="#b8e6ff"
          map={curtainTexture}
          alphaMap={curtainTexture}
          transparent
          opacity={0.48}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={curtainC} position={[1.1, 1.85, -14.45]} rotation={[0.24, 0.04, -0.13]}>
        <planeGeometry args={[34, 19, 1, 1]} />
        <meshBasicMaterial
          color="#9fbfff"
          map={curtainTexture}
          alphaMap={curtainTexture}
          transparent
          opacity={0.42}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={curtainD} position={[-1.3, 1.55, -14.25]} rotation={[0.2, -0.04, 0.11]}>
        <planeGeometry args={[30, 16, 1, 1]} />
        <meshBasicMaterial
          color="#d2f0ff"
          map={curtainTexture}
          alphaMap={curtainTexture}
          transparent
          opacity={0.34}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={glowA} position={[0, 1.45, -12.8]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.2, 11.6, 64]} />
        <meshBasicMaterial color="#9ccfff" transparent opacity={0.13} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={glowB} position={[0, 0.9, -12.6]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.6, 9.4, 64]} />
        <meshBasicMaterial color="#b8d9ff" transparent opacity={0.11} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  );
}

export function AuroraHdriBackdrop({ intensity = 0.72 }) {
  const domeRef = useRef(null);
  const hdriTexture = useMemo(() => buildAuroraHdriTexture(), []);

  useFrame(({ clock }) => {
    if (!domeRef.current) {
      return;
    }
    domeRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.015) * 0.04;
    domeRef.current.material.opacity = 0.72 + intensity * 0.14;
  });

  return (
    <mesh ref={domeRef} position={[0, 0, -10]} rotation={[0, 0.1, 0]}>
      <sphereGeometry args={[62, 64, 48]} />
      <meshBasicMaterial map={hdriTexture} side={THREE.BackSide} transparent opacity={0.82} depthWrite={false} />
    </mesh>
  );
}

export function AuroraShaderLayer({ intensity = 0.72, speed = 0.55 }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: intensity },
          uColorA: { value: new THREE.Color("#79e9c4") },
          uColorB: { value: new THREE.Color("#a77cff") },
          uColorC: { value: new THREE.Color("#9ed9ff") }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform float uIntensity;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            float a = hash(i + vec2(0.0, 0.0));
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
          }

          void main() {
            vec2 uv = vUv;
            float t = uTime * 0.12;
            float flow = noise(vec2(uv.x * 5.0 + t, uv.y * 2.2 - t * 0.4));
            flow += noise(vec2(uv.x * 8.5 - t * 0.6, uv.y * 3.4 + t * 0.25)) * 0.55;
            flow /= 1.55;

            float curtainMask = smoothstep(0.0, 0.35, uv.y) * (1.0 - smoothstep(0.76, 1.0, uv.y));
            float verticalBands = 0.45 + 0.55 * sin((uv.x * 10.0 + flow * 3.2) + t * 1.3);
            float strength = curtainMask * verticalBands * (0.24 + flow * 0.76);

            vec3 aurora = mix(uColorA, uColorB, flow);
            aurora = mix(aurora, uColorC, smoothstep(0.55, 1.0, uv.x));

            float alpha = strength * (0.46 + uIntensity * 0.62);
            gl_FragColor = vec4(aurora, alpha);
          }
        `
      }),
    []
  );

  useFrame(({ clock }) => {
    if (!materialRef.current || !meshRef.current) {
      return;
    }
    materialRef.current.uniforms.uTime.value = clock.elapsedTime * (0.18 + speed * 0.52);
    materialRef.current.uniforms.uIntensity.value = intensity;
    meshRef.current.position.x = Math.sin(clock.elapsedTime * 0.05) * 0.4;
  });

  return (
    <mesh ref={meshRef} position={[0, 2.2, -14.6]} rotation={[-0.22, 0.02, 0]}>
      <planeGeometry args={[44, 25, 1, 1]} />
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </mesh>
  );
}

export function AuroraAmbientParticles({ intensity = 0.72, speed = 0.55 }) {
  const cloudRef = useRef(null);
  const pointTexture = useMemo(() => buildPointTexture(), []);
  const particles = useMemo(() => {
    const positions = [];
    const colors = [];
    const sizes = [];

    for (let index = 0; index < 1200; index += 1) {
      const x = (Math.random() - 0.5) * 30;
      const y = -2.2 + Math.random() * 9.4;
      const z = -15.2 + Math.random() * 8.2;
      positions.push(x, y, z);

      const color = new THREE.Color(index % 4 === 0 ? "#c9e6ff" : index % 7 === 0 ? "#a8c9ff" : "#d9eeff");
      colors.push(color.r, color.g, color.b);
      sizes.push(0.03 + Math.random() * 0.05);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    return geometry;
  }, []);

  useFrame(({ clock }, delta) => {
    if (!cloudRef.current) {
      return;
    }
    cloudRef.current.rotation.y += delta * (0.0012 + speed * 0.0024);
    cloudRef.current.position.x = Math.sin(clock.elapsedTime * 0.018) * 0.22;
    cloudRef.current.position.y = Math.cos(clock.elapsedTime * 0.016) * 0.1;
  });

  return (
    <points ref={cloudRef} geometry={particles}>
      <pointsMaterial
        size={0.05}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.05 + intensity * 0.09}
        depthWrite={false}
        map={pointTexture}
        alphaMap={pointTexture}
        alphaTest={0.05}
      />
    </points>
  );
}

export function AuroraStarField({ intensity = 0.72 }) {
  const fieldRef = useRef(null);
  const pointTexture = useMemo(() => buildPointTexture(), []);
  const particles = useMemo(() => {
    const positions = [];
    const colors = [];
    const sizes = [];

    for (let index = 0; index < 2200; index += 1) {
      const x = (Math.random() - 0.5) * 46;
      const y = 0.2 + Math.random() * 24;
      const z = -26 + Math.random() * 20;
      positions.push(x, y, z);

      const color = new THREE.Color(index % 18 === 0 ? "#c5daff" : index % 11 === 0 ? "#edf3ff" : "#b7cfff");
      colors.push(color.r, color.g, color.b);
      sizes.push(0.02 + Math.random() * 0.04);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    return geometry;
  }, []);

  useFrame(({ clock }, delta) => {
    if (!fieldRef.current) {
      return;
    }
    fieldRef.current.rotation.y += delta * 0.0007;
    fieldRef.current.position.x = Math.sin(clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={fieldRef} geometry={particles}>
      <pointsMaterial
        size={0.05}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.2 + intensity * 0.24}
        depthWrite={false}
        map={pointTexture}
        alphaMap={pointTexture}
        alphaTest={0.06}
      />
    </points>
  );
}

export function AuroraSkyBackdrop({ intensity = 0.72 }) {
  const skyDomeRef = useRef(null);
  const lowMistRef = useRef(null);

  useFrame(({ clock }) => {
    if (skyDomeRef.current) {
      skyDomeRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.018) * 0.025;
      skyDomeRef.current.material.opacity = 0.2 + intensity * 0.22;
    }

    if (lowMistRef.current) {
      lowMistRef.current.position.x = Math.sin(clock.elapsedTime * 0.06) * 0.32;
      lowMistRef.current.material.opacity = 0.1 + intensity * 0.1;
    }
  });

  return (
    <>
      <mesh ref={skyDomeRef} position={[0, 0.9, -14.9]} rotation={[-0.2, 0, 0]}>
        <sphereGeometry args={[26, 52, 36, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
        <meshBasicMaterial color="#1a2d56" transparent opacity={0.28} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 2.1, -13.7]} rotation={[-0.24, 0, 0]}>
        <planeGeometry args={[36, 17, 1, 1]} />
        <meshBasicMaterial color="#4168a2" transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={lowMistRef} position={[0, -1.2, -11.2]} rotation={[-0.14, 0, 0]}>
        <planeGeometry args={[34, 6, 1, 1]} />
        <meshBasicMaterial color="#6f9ec7" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}

export function AuroraHorizonSilhouette() {
  const snowTexture = useMemo(() => buildSnowTexture(), []);
  return (
    <>
      <mesh position={[0, -4.18, -11.4]}>
        <planeGeometry args={[36, 4.8]} />
        <meshBasicMaterial color="#050a14" transparent opacity={0.96} depthWrite={false} />
      </mesh>
      <mesh position={[0, -3.38, -10.9]} rotation={[-0.06, 0, 0]}>
        <planeGeometry args={[34, 3.2]} />
        <meshBasicMaterial map={snowTexture} color="#c7d6e9" transparent opacity={0.64} depthWrite={false} />
      </mesh>
      <mesh position={[0, -3.82, -10.7]} rotation={[-0.08, 0, 0]}>
        <planeGeometry args={[36, 2.1]} />
        <meshBasicMaterial color="#829ab7" transparent opacity={0.34} depthWrite={false} />
      </mesh>
      <mesh position={[-8.9, -2.72, -11.2]} rotation={[0, 0, 0.09]}>
        <circleGeometry args={[4.5, 64]} />
        <meshBasicMaterial color="#070d18" transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh position={[9.6, -2.75, -11.15]} rotation={[0, 0, -0.08]}>
        <circleGeometry args={[5.2, 64]} />
        <meshBasicMaterial color="#070d18" transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh position={[0.4, -2.94, -11.2]}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial color="#09101c" transparent opacity={0.9} depthWrite={false} />
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
