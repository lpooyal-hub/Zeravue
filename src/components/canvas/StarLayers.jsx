import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { clampStarSize, pushLinePath } from "./starMath.js";

function buildStarTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.18, color);
  gradient.addColorStop(0.45, `${color}aa`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function buildRingTexture(color = "#ffe8a3") {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0)");
  gradient.addColorStop(0.72, color);
  gradient.addColorStop(0.88, "rgba(255,255,255,0.18)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function BackgroundStarField({ stars, focusedConstellation, starGlowStrength = 0.8, tracking = false }) {
  const materialRef = useRef(null);
  const geometry = useMemo(() => {
    const positions = [];
    const colors = [];
    const sizes = [];
    const alphas = [];
    const twinkles = [];
    const densityFactor = Math.min(1, stars.length / 2200);

    stars.forEach((star) => {
      if (!star.visible) {
        return;
      }

      positions.push(star.x, star.y, star.z);

      const color = new THREE.Color(star.color);
      colors.push(color.r, color.g, color.b);

      const highlighted = focusedConstellation !== "all" && star.constellation === focusedConstellation;
      const sizeScale = highlighted ? 1.4 : 1 - densityFactor * 0.08;
      sizes.push(clampStarSize(star.magnitude) * sizeScale);

      const baseAlpha = focusedConstellation === "all" ? 0.24 - densityFactor * 0.08 : highlighted ? (tracking ? 0.76 : 0.6) : tracking ? 0.028 : 0.05 - densityFactor * 0.015;
      alphas.push(baseAlpha + Math.max(0, 0.16 - star.magnitude * 0.012));
      twinkles.push((Number.parseInt(String(star.id).replace(/\D/g, "").slice(-4) || "17", 10) % 97) / 97);
    });

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    starGeometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    starGeometry.setAttribute("alpha", new THREE.Float32BufferAttribute(alphas, 1));
    starGeometry.setAttribute("twinkle", new THREE.Float32BufferAttribute(twinkles, 1));
    return starGeometry;
  }, [focusedConstellation, stars, tracking]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          time: { value: 0 },
          glowStrength: { value: starGlowStrength }
        },
        vertexShader: `
          attribute float size;
          attribute float alpha;
          attribute float twinkle;
          varying vec3 vColor;
          varying float vAlpha;
          varying float vTwinkle;
          void main() {
            vColor = color;
            vAlpha = alpha;
            vTwinkle = twinkle;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (220.0 / max(8.0, -mvPosition.z));
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float glowStrength;
          varying vec3 vColor;
          varying float vAlpha;
          varying float vTwinkle;
          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            float glow = smoothstep(0.52, 0.0, dist);
            float core = smoothstep(0.18, 0.0, dist);
            float pulse = 0.86 + sin(time * (0.34 + vTwinkle * 0.42) + vTwinkle * 24.0) * 0.14;
            gl_FragColor = vec4(vColor * (0.48 + core * 1.75 * glowStrength) * pulse, (glow * 0.4 + core * 0.9 * glowStrength) * vAlpha * pulse);
          }
        `,
        vertexColors: true
      }),
    [starGlowStrength]
  );

  useFrame(({ clock }) => {
    if (materialRef.current?.material?.uniforms?.time) {
      materialRef.current.material.uniforms.time.value = clock.elapsedTime;
      materialRef.current.material.uniforms.glowStrength.value = starGlowStrength;
    }
  });

  return <points geometry={geometry} material={material} ref={materialRef} frustumCulled={false} />;
}

export function PassiveStarGlow({ star, dimmed, sketched, starGlowStrength = 0.8 }) {
  const haloRef = useRef(null);
  const spriteMaterial = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: buildStarTexture(sketched ? "#ffcf70" : star.color),
        transparent: true,
        depthWrite: false
      }),
    [sketched, star.color]
  );
  const radius = star.size * (sketched ? 1.75 : dimmed ? 1.05 : 1.48) * (0.72 + starGlowStrength * 0.62);
  const pulseSeed = useMemo(() => Number.parseInt(String(star.id).replace(/\D/g, "").slice(-4) || "13", 10) * 0.017, [star.id]);

  useFrame(({ clock }) => {
    if (!haloRef.current) {
      return;
    }
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.62 + pulseSeed) * 0.07;
    haloRef.current.scale.setScalar(pulse);
    haloRef.current.material.opacity = (0.38 + starGlowStrength * 0.46) + Math.sin(clock.elapsedTime * 0.48 + pulseSeed) * 0.08;
  });

  return <sprite ref={haloRef} material={spriteMaterial} position={[star.x, star.y, star.z]} scale={[radius * 5.8, radius * 5.8, 1]} />;
}

export function StarMarker({ star, selected, onSelectTarget, dimmed, sketched, drawMode }) {
  const haloRef = useRef(null);
  const selectionRef = useRef(null);
  const spriteMaterial = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: buildStarTexture(drawMode && sketched ? "#ffcf70" : star.color),
        transparent: true,
        depthWrite: false
      }),
    [drawMode, sketched, star.color]
  );
  const selectionMaterial = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: buildRingTexture("#ffe8a3"),
        transparent: true,
        depthWrite: false
      }),
    []
  );
  const radius = star.size * (selected ? 2.35 : sketched ? 1.85 : dimmed ? 1.05 : 1.55);
  const emissive = star.visible ? star.color : "#334155";
  const opacity = sketched ? 1 : dimmed ? 0.34 : 1;
  const pulseSeed = useMemo(() => Number.parseInt(String(star.id).replace(/\D/g, "").slice(-4) || "7", 10) * 0.013, [star.id]);

  useFrame(({ clock }) => {
    if (!haloRef.current) {
      return;
    }

    const pulse = 1 + Math.sin(clock.elapsedTime * 1.1 + pulseSeed) * 0.08;
    haloRef.current.scale.setScalar(pulse);
    haloRef.current.material.opacity = (sketched ? 0.3 : 0.16) + (selected ? 0.12 : 0) + Math.sin(clock.elapsedTime * 0.9 + pulseSeed) * 0.025;

    if (selectionRef.current) {
      const selectionPulse = 1 + Math.sin(clock.elapsedTime * 1.45 + pulseSeed) * 0.05;
      selectionRef.current.scale.set(selectionPulse, selectionPulse, 1);
      selectionRef.current.material.opacity = 0.34 + Math.sin(clock.elapsedTime * 1.2 + pulseSeed) * 0.04;
    }
  });

  return (
    <group position={[star.x, star.y, star.z]}>
      {sketched ? (
        <mesh>
          <sphereGeometry args={[radius * 2.9, 24, 24]} />
          <meshBasicMaterial color="#ffcf70" transparent opacity={0.2} />
        </mesh>
      ) : null}
      {selected ? <sprite ref={selectionRef} material={selectionMaterial} scale={[radius * 7.4, radius * 7.4, 1]} /> : null}
      <sprite ref={haloRef} material={spriteMaterial} scale={[radius * 6.5, radius * 6.5, 1]} />
      <mesh onClick={() => onSelectTarget({ kind: "star", id: star.id })}>
        <sphereGeometry args={[radius * 1.15, 12, 12]} />
        <meshBasicMaterial color={emissive} toneMapped={false} transparent opacity={Math.max(opacity * 0.035, 0.015)} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function ConstellationLines({ lines, stars, focusedConstellation, viewMode, tracking = false }) {
  const geometry = useMemo(() => {
    const byId = new Map(stars.map((star) => [star.id, star]));
    const points = [];
    const highlightedPoints = [];
    const curved = viewMode === "space";

    lines.forEach((line) => {
      const from = byId.get(line.from);
      const to = byId.get(line.to);
      if (!from || !to) {
        return;
      }
      pushLinePath(points, from, to, curved);
      if (focusedConstellation !== "all" && from.constellation === focusedConstellation && to.constellation === focusedConstellation) {
        pushLinePath(highlightedPoints, from, to, curved);
      }
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const highlightGeometry = new THREE.BufferGeometry();
    highlightGeometry.setAttribute("position", new THREE.Float32BufferAttribute(highlightedPoints, 3));
    const densityFactor = Math.min(1, points.length / 1800);
    return { lineGeometry, highlightGeometry, densityFactor };
  }, [focusedConstellation, lines, stars, viewMode]);

  const ambientOpacity = focusedConstellation === "all" ? 0.045 + geometry.densityFactor * 0.02 : tracking ? 0.01 : 0.018 + geometry.densityFactor * 0.01;
  const ambientGlowOpacity = focusedConstellation === "all" ? 0.012 + geometry.densityFactor * 0.01 : tracking ? 0.004 : 0.007;
  const highlightOpacity = tracking ? 0.2 + geometry.densityFactor * 0.03 : 0.14 + geometry.densityFactor * 0.04;
  const highlightGlowOpacity = tracking ? 0.08 + geometry.densityFactor * 0.02 : 0.06 + geometry.densityFactor * 0.025;

  return (
    <>
      <lineSegments geometry={geometry.lineGeometry}>
        <lineBasicMaterial color="#7adcd4" transparent opacity={ambientOpacity} />
      </lineSegments>
      <lineSegments geometry={geometry.lineGeometry}>
        <lineBasicMaterial color="#dff7ff" transparent opacity={ambientGlowOpacity} />
      </lineSegments>
      {focusedConstellation !== "all" ? (
        <>
          <lineSegments geometry={geometry.highlightGeometry}>
            <lineBasicMaterial color="#ffcf70" transparent opacity={highlightOpacity} />
          </lineSegments>
          <lineSegments geometry={geometry.highlightGeometry}>
            <lineBasicMaterial color="#fff5c8" transparent opacity={highlightGlowOpacity} />
          </lineSegments>
        </>
      ) : null}
    </>
  );
}

export function CustomSketchLines({ stars, starIds, viewMode }) {
  const geometry = useMemo(() => {
    const byId = new Map(stars.map((star) => [star.id, star]));
    const points = [];
    const curved = viewMode === "space";

    for (let index = 1; index < starIds.length; index += 1) {
      const from = byId.get(starIds[index - 1]);
      const to = byId.get(starIds[index]);
      if (!from || !to) {
        continue;
      }
      pushLinePath(points, from, to, curved);
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return lineGeometry;
  }, [starIds, stars, viewMode]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#ffcf70" transparent opacity={0.95} />
    </lineSegments>
  );
}
