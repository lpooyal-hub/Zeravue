import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import * as THREE from "three";

function detectQualityTier({ reducedMotion }) {
  if (reducedMotion) {
    return "low";
  }

  const threads = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");

  if (isMobile && (threads <= 6 || memory <= 6)) {
    return "low";
  }
  if (threads <= 4 || memory <= 4) {
    return "low";
  }
  if (threads <= 8 || memory <= 8 || isMobile) {
    return "medium";
  }
  return "high";
}

function qualitySettings(tier) {
  if (tier === "low") {
    return {
      dpr: [1, 1],
      starCount: 620,
      starFactor: 2.1,
      bloomIntensity: 0,
      noiseOpacity: 0,
      cameraDriftStrength: 0.12,
      fogAlpha: 0.18,
      shaderBoost: 0.78,
      octaves: 2,
      postprocessing: false
    };
  }
  if (tier === "medium") {
    return {
      dpr: [1, 1.15],
      starCount: 1100,
      starFactor: 2.35,
      bloomIntensity: 0.42,
      noiseOpacity: 0.012,
      cameraDriftStrength: 0.2,
      fogAlpha: 0.21,
      shaderBoost: 0.9,
      octaves: 3,
      postprocessing: true
    };
  }
  return {
    dpr: [1, 1.25],
    starCount: 1600,
    starFactor: 2.6,
    bloomIntensity: 0.62,
    noiseOpacity: 0.016,
    cameraDriftStrength: 0.26,
    fogAlpha: 0.24,
    shaderBoost: 1,
    octaves: 4,
    postprocessing: true
  };
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function AuroraBand({ intensity = 0.55, speed = 0.3, offset = 0, colorA, colorB, colorC, octaves = 3 }) {
  const materialRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uSpeed: { value: speed },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
      uColorC: { value: new THREE.Color(colorC) },
      uOffset: { value: offset },
      uOctaves: { value: octaves }
    }),
    [colorA, colorB, colorC, intensity, offset, speed, octaves]
  );

  useFrame((state) => {
    if (!materialRef.current) {
      return;
    }
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uIntensity.value = intensity;
    materialRef.current.uniforms.uSpeed.value = speed;
    materialRef.current.uniforms.uOctaves.value = octaves;
  });

  return (
    <mesh position={[0, 8.5, -21]} rotation={[-0.5, 0, 0]}>
      <planeGeometry args={[56, 20, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          precision highp float;
          varying vec2 vUv;
          uniform float uTime;
          uniform float uIntensity;
          uniform float uSpeed;
          uniform float uOffset;
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;
          uniform float uOctaves;

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }

          float fbm(vec2 p) {
            float value = 0.0;
            float amp = 0.5;
            for (int i = 0; i < 4; i++) {
              if (float(i) >= uOctaves) {
                break;
              }
              value += amp * noise(p);
              p *= 2.0;
              amp *= 0.5;
            }
            return value;
          }

          void main() {
            vec2 uv = vUv;
            float t = uTime * (0.085 + uSpeed * 0.225);
            vec2 flowUv = vec2(uv.x * 2.4 + uOffset, uv.y * 2.0);
            float wave = fbm(flowUv + vec2(t * 0.7, -t * 0.22));
            float wave2 = fbm(flowUv * 1.5 + vec2(-t * 0.3, t * 0.18));

            float curtain = smoothstep(0.18, 0.96, uv.y + wave * 0.35);
            float spread = smoothstep(0.04, 0.92, uv.y + wave2 * 0.28);
            float body = curtain * spread;

            float bandA = smoothstep(0.18, 0.8, wave);
            float bandB = smoothstep(0.25, 0.88, wave2);

            vec3 color = mix(uColorA, uColorB, bandA);
            color = mix(color, uColorC, bandB * 0.7);

            float alpha = body * (0.18 + uIntensity * 0.62);
            alpha *= smoothstep(1.0, 0.2, abs(uv.x - 0.5) * 1.08);
            alpha *= smoothstep(0.0, 0.18, uv.y);
            alpha *= smoothstep(1.0, 0.45, uv.y);

            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

function FogLayer({ drift = 1, fogAlpha = 0.24 }) {
  const ref = useRef(null);
  useFrame((state) => {
    if (!ref.current) {
      return;
    }
    ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.02 * drift) * 0.45;
  });

  return (
    <mesh ref={ref} position={[0, -3.9, -10]} rotation={[-0.6, 0, 0]}>
      <planeGeometry args={[64, 24, 1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          precision highp float;
          varying vec2 vUv;
          void main() {
            float radial = 1.0 - distance(vUv, vec2(0.5, 0.32)) * 1.65;
            radial = clamp(radial, 0.0, 1.0);
            float vertical = smoothstep(1.0, 0.08, vUv.y);
            float alpha = radial * vertical * ${fogAlpha.toFixed(3)};
            vec3 color = vec3(0.56, 0.67, 0.78);
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

function CameraDrift({ reducedMotion = false, driftStrength = 0.26 }) {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const strength = reducedMotion ? Math.min(0.08, driftStrength * 0.45) : driftStrength;
    camera.position.x = Math.sin(t * 0.035) * strength;
    camera.position.y = 0.4 + Math.cos(t * 0.028) * strength * 0.45;
    camera.lookAt(0, 0.2, -8);
  });
  return null;
}

function FpsSampler({ duration = 5, onSample }) {
  const framesRef = useRef(0);
  const startRef = useRef(null);
  const doneRef = useRef(false);

  useFrame((state) => {
    if (doneRef.current) {
      return;
    }
    if (startRef.current === null) {
      startRef.current = state.clock.elapsedTime;
    }
    framesRef.current += 1;
    const elapsed = state.clock.elapsedTime - startRef.current;
    if (elapsed >= duration) {
      doneRef.current = true;
      const avgFps = framesRef.current / elapsed;
      onSample(avgFps);
    }
  });
  return null;
}

function AuroraScene({ intensity, speed, reducedMotion, settings, onFpsSample, monitorFps }) {
  const auroraIntensity = intensity * settings.shaderBoost;
  return (
    <>
      <color attach="background" args={["#020611"]} />
      <fog attach="fog" args={["#050b18", 18, 58]} />
      <ambientLight intensity={0.32} />
      <CameraDrift reducedMotion={reducedMotion} driftStrength={settings.cameraDriftStrength} />
      <Stars
        radius={160}
        depth={45}
        count={settings.starCount}
        factor={settings.starFactor}
        saturation={0}
        fade
        speed={reducedMotion ? 0.08 : 0.2}
      />
      <AuroraBand
        intensity={auroraIntensity}
        speed={speed}
        offset={0.0}
        colorA="#55f0b8"
        colorB="#7bd9ff"
        colorC="#a57dff"
        octaves={settings.octaves}
      />
      <AuroraBand
        intensity={Math.max(0.2, auroraIntensity * 0.7)}
        speed={speed * 0.82}
        offset={1.34}
        colorA="#83ffc8"
        colorB="#7be0ff"
        colorC="#bf8dff"
        octaves={settings.octaves}
      />
      <FogLayer drift={reducedMotion ? 0.7 : 1} fogAlpha={settings.fogAlpha} />
      {settings.postprocessing ? (
        <EffectComposer multisampling={0}>
          <Bloom intensity={settings.bloomIntensity} luminanceThreshold={0.22} luminanceSmoothing={0.9} mipmapBlur />
          <Noise opacity={settings.noiseOpacity} />
          <Vignette offset={0.16} darkness={0.78} eskil={false} />
        </EffectComposer>
      ) : null}
      {monitorFps ? <FpsSampler onSample={onFpsSample} /> : null}
    </>
  );
}

export function AuroraLiveViewer({ intensity = 0.55, speed = 0.34 }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);
  const [qualityTier, setQualityTier] = useState("low");
  const [avgFps, setAvgFps] = useState(null);
  const [gpuInfo, setGpuInfo] = useState({ vendor: "unknown", renderer: "unknown", webglVersion: "unknown" });
  const [fpsMeasured, setFpsMeasured] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [monitorFps, setMonitorFps] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!supportsWebGL()) {
      setCanvasFailed(true);
      return;
    }
    setQualityTier(detectQualityTier({ reducedMotion }) === "high" ? "medium" : detectQualityTier({ reducedMotion }));
  }, [reducedMotion]);

  const settings = useMemo(() => qualitySettings(qualityTier), [qualityTier]);
  const isDev = import.meta.env.DEV;

  function handleFpsSample(sample) {
    setAvgFps(sample);
    setFpsMeasured(true);
    setMonitorFps(false);

    if (sample < 30) {
      setFallbackActive(true);
      return;
    }
    if (sample < 45) {
      setQualityTier("low");
    }
  }

  if (canvasFailed || fallbackActive) {
    return (
      <div className="aurora-live-fallback" aria-label="Aurora fallback image">
        <div className="aurora-live-fallback-bg" />
        <div className="aurora-live-fallback-ribbon ribbon-1" />
        <div className="aurora-live-fallback-ribbon ribbon-2" />
        <div className="aurora-live-fallback-ribbon ribbon-3" />
        <div className="aurora-live-fallback-vignette" />
        {isDev ? (
          <div className="aurora-live-debug">
            <span>vendor: {gpuInfo.vendor}</span>
            <span>renderer: {gpuInfo.renderer}</span>
            <span>webgl: {gpuInfo.webglVersion}</span>
            <span>dpr: {settings.dpr[1]}</span>
            <span>quality: {qualityTier}</span>
            <span>avg fps: {avgFps ? avgFps.toFixed(1) : "n/a"}</span>
            <span>fallback: true</span>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="aurora-live-canvas">
      <Canvas
        dpr={settings.dpr}
        camera={{ position: [0, 0.45, 5.8], fov: 58, near: 0.1, far: 220 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor("#020611", 1);
          const ext = gl.getExtension("WEBGL_debug_renderer_info");
          const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown";
          const vendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : "unknown";
          const webglVersion = gl.capabilities.isWebGL2 ? "webgl2" : "webgl1";
          const normalized = `${vendor} ${renderer}`.toLowerCase();

          const intelLike = normalized.includes("intel");
          const nvidiaOrAmd = normalized.includes("nvidia") || normalized.includes("amd") || normalized.includes("radeon");

          if (intelLike) {
            setQualityTier("low");
          } else if (nvidiaOrAmd && !reducedMotion) {
            setQualityTier("medium");
          } else {
            setQualityTier("low");
          }

          setGpuInfo({ vendor: String(vendor), renderer: String(renderer), webglVersion });
          if (import.meta.env.DEV) {
            console.log("[aurora-gpu]", { vendor, renderer, webglVersion });
          }

          const canvas = gl.domElement;
          const onContextLost = (event) => {
            event.preventDefault();
            setCanvasFailed(true);
          };
          canvas.addEventListener("webglcontextlost", onContextLost, { passive: false });
          scene.userData.onContextLost = onContextLost;
        }}
        onError={() => setCanvasFailed(true)}
        onPointerMissed={() => {
          /* keep canvas interactive without side effects */
        }}
      >
        <AuroraScene
          intensity={intensity}
          speed={speed}
          reducedMotion={reducedMotion}
          settings={settings}
          onFpsSample={handleFpsSample}
          monitorFps={monitorFps}
        />
      </Canvas>
      {isDev ? (
        <div className="aurora-live-debug">
          <span>vendor: {gpuInfo.vendor}</span>
          <span>renderer: {gpuInfo.renderer}</span>
          <span>webgl: {gpuInfo.webglVersion}</span>
          <span>dpr: {settings.dpr[1]}</span>
          <span>quality: {qualityTier}</span>
          <span>avg fps: {fpsMeasured && avgFps ? avgFps.toFixed(1) : "measuring..."}</span>
          <span>fallback: false</span>
        </div>
      ) : null}
    </div>
  );
}
