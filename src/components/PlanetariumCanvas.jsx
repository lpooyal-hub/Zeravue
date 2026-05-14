import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

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

export function PlanetariumCanvas({
  scene,
  selectedTarget,
  onSelectTarget,
  language,
  dictionary,
  showLabels,
  showGuides,
  showConstellations,
  autoRotate,
  viewMode,
  focusedConstellation,
  drawMode,
  customSketchStarIds
}) {
  if (!scene) {
    return <div className="scene-empty">{dictionary.viewer.loading}</div>;
  }

  return (
    <Canvas camera={{ position: [0, 0, 18], fov: 48 }} dpr={[1, 2]}>
      <color attach="background" args={["#010208"]} />
      <fog attach="fog" args={["#010208", 22, 44]} />
      <SceneContents
        scene={scene}
        selectedTarget={selectedTarget}
        onSelectTarget={onSelectTarget}
        language={language}
        dictionary={dictionary}
        showLabels={showLabels}
        showGuides={showGuides}
        showConstellations={showConstellations}
        autoRotate={autoRotate}
        viewMode={viewMode}
        focusedConstellation={focusedConstellation}
        drawMode={drawMode}
        customSketchStarIds={customSketchStarIds}
      />
    </Canvas>
  );
}

function SceneContents({
  scene,
  selectedTarget,
  onSelectTarget,
  language,
  dictionary,
  showLabels,
  showGuides,
  showConstellations,
  autoRotate,
  viewMode,
  focusedConstellation,
  drawMode,
  customSketchStarIds
}) {
  const groupRef = useRef(null);
  const cameraAnchor = useRef({ x: 0, y: 0, z: 0 });
  const lookAnchor = useRef({ x: 0, y: 1.8, z: -12.8 });
  const rotationAnchor = useRef({ x: 0, y: 0 });
  const { camera, pointer } = useThree();
  const projectedStars = useMemo(() => scene.stars.map((star) => ({ ...star, ...projectSkyPosition(star, viewMode) })), [scene.stars, viewMode]);

  const featuredStars = useMemo(
    () =>
      projectedStars.filter((star) => {
        if (!star.visible) {
          return false;
        }
        if (customSketchStarIds.includes(star.id)) {
          return true;
        }
        if (selectedTarget?.kind === "star" && selectedTarget.id === star.id) {
          return true;
        }
        if (focusedConstellation !== "all") {
          return star.constellation === focusedConstellation;
        }
        return star.magnitude <= 2.35;
      }),
    [customSketchStarIds, focusedConstellation, projectedStars, selectedTarget]
  );

  const constellationCenters = useMemo(() => buildConstellationCenters(projectedStars), [projectedStars]);
  const labelData = useMemo(() => {
    const starLabels = [];
    const constellationLabels = [];

    if (showLabels) {
      featuredStars
        .slice()
        .sort((left, right) => left.magnitude - right.magnitude)
        .slice(0, focusedConstellation === "all" ? 5 : 8)
        .forEach((star) => {
          starLabels.push({
            id: `star-${star.id}`,
            text: star.name,
            position: [star.x, star.y + 0.48, star.z],
            color: "#eef4ff",
            scale: 1.8
          });
        });

      if (showConstellations) {
        const names = focusedConstellation === "all" ? [...constellationCenters.keys()].slice(0, 4) : [focusedConstellation];
        names.forEach((name) => {
          const center = constellationCenters.get(name);
          if (!center) {
            return;
          }
          constellationLabels.push({
            id: `constellation-${name}`,
            text: dictionary.constellations?.[name]?.[language] || name,
            position: [center.x, center.y + 0.95, center.z],
            color: name === focusedConstellation ? "#ffcf70" : "#7fdbc9",
            scale: name === focusedConstellation ? 2.4 : 2.05
          });
        });
      }
    }

    return { starLabels, constellationLabels };
  }, [constellationCenters, dictionary.constellations, featuredStars, focusedConstellation, language, showConstellations, showLabels]);

  useFrame((_, delta) => {
    const observerMode = viewMode === "observer";
    const panoramaMode = viewMode === "panorama";
    const spaceMode = viewMode === "space";
    const targetTiltX = spaceMode ? -pointer.y * 0.022 : observerMode ? -pointer.y * 0.035 : -pointer.y * 0.016;
    const targetYawDrift = spaceMode ? pointer.x * 0.026 : observerMode ? pointer.x * 0.055 : pointer.x * 0.032;
    const targetCameraX = spaceMode ? pointer.x * 1.15 : observerMode ? pointer.x * 0.38 : pointer.x * 0.86;
    const targetCameraY = spaceMode ? pointer.y * 0.55 : observerMode ? 0.55 + pointer.y * 0.34 : pointer.y * 0.12;
    const targetCameraZ = spaceMode ? -1.45 + Math.abs(pointer.x) * -0.04 : observerMode ? -0.28 - Math.abs(pointer.x) * 0.08 : -0.16;
    const targetLookX = spaceMode ? pointer.x * 4.8 : observerMode ? pointer.x * 1.7 : pointer.x * 3.2;
    const targetLookY = spaceMode ? pointer.y * 1.9 : observerMode ? 2.9 + pointer.y * 1.4 : 0.65 + pointer.y * 0.55;
    const targetLookZ = spaceMode ? -11.2 : observerMode ? -13.6 : -12.2;

    if (groupRef.current) {
      if (autoRotate) {
        groupRef.current.rotation.y += delta * (spaceMode ? 0.006 : observerMode ? 0.011 : 0.008);
      }
      rotationAnchor.current.x = THREE.MathUtils.damp(rotationAnchor.current.x, targetTiltX, spaceMode ? 3.8 : observerMode ? 4.2 : 5.4, delta);
      rotationAnchor.current.y = THREE.MathUtils.damp(rotationAnchor.current.y, targetYawDrift, spaceMode ? 3.4 : observerMode ? 3.6 : 4.8, delta);
      groupRef.current.rotation.x = rotationAnchor.current.x;
      groupRef.current.rotation.y += rotationAnchor.current.y * delta;
    }

    cameraAnchor.current.x = THREE.MathUtils.damp(cameraAnchor.current.x, targetCameraX, spaceMode ? 3.8 : observerMode ? 4 : 5.1, delta);
    cameraAnchor.current.y = THREE.MathUtils.damp(cameraAnchor.current.y, targetCameraY, spaceMode ? 3.8 : observerMode ? 4 : 5.1, delta);
    cameraAnchor.current.z = THREE.MathUtils.damp(cameraAnchor.current.z, targetCameraZ, spaceMode ? 4.3 : observerMode ? 4.8 : 5.4, delta);

    lookAnchor.current.x = THREE.MathUtils.damp(lookAnchor.current.x, targetLookX, spaceMode ? 4 : observerMode ? 4.4 : 5.4, delta);
    lookAnchor.current.y = THREE.MathUtils.damp(lookAnchor.current.y, targetLookY, spaceMode ? 4 : observerMode ? 4.4 : 5.4, delta);
    lookAnchor.current.z = THREE.MathUtils.damp(lookAnchor.current.z, targetLookZ, spaceMode ? 4.5 : observerMode ? 5 : 5.7, delta);

    camera.position.x = cameraAnchor.current.x;
    camera.position.y = cameraAnchor.current.y;
    camera.position.z = (spaceMode ? 15.6 : 18) + cameraAnchor.current.z;
    camera.lookAt(lookAnchor.current.x, lookAnchor.current.y, lookAnchor.current.z);
  });

  return (
    <>
      <ambientLight intensity={0.38} />
      <pointLight position={[0, 6, 14]} intensity={0.9} color="#b8d2ff" />
      <pointLight position={[-12, -4, -8]} intensity={0.25} color="#ffbf8a" />
      <group ref={groupRef}>
        <MilkyWayBand viewMode={viewMode} />
        <DeepSkyField viewMode={viewMode} />
        {viewMode === "space" ? <SpaceDepthField /> : null}
        <BackgroundStarField stars={projectedStars} focusedConstellation={focusedConstellation} />
        {showGuides ? <GuideGrid /> : null}
        {showGuides ? <HorizonRing dictionary={dictionary} language={language} /> : null}
        {showConstellations ? <ConstellationLines lines={scene.lines} stars={projectedStars} focusedConstellation={focusedConstellation} viewMode={viewMode} /> : null}
        {customSketchStarIds.length >= 2 ? <CustomSketchLines stars={projectedStars} starIds={customSketchStarIds} viewMode={viewMode} /> : null}
        {featuredStars.map((star) => (
          <StarMarker
            key={star.id}
            star={star}
            selected={selectedTarget?.kind === "star" && star.id === selectedTarget.id}
            onSelectTarget={onSelectTarget}
            dimmed={focusedConstellation !== "all" && star.constellation !== focusedConstellation}
            sketched={customSketchStarIds.includes(star.id)}
            drawMode={drawMode}
          />
        ))}
        {labelData.starLabels.map((label) => (
          <TextSprite key={label.id} {...label} />
        ))}
        {labelData.constellationLabels.map((label) => (
          <TextSprite key={label.id} {...label} />
        ))}
      </group>
    </>
  );
}

function BackgroundStarField({ stars, focusedConstellation }) {
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

      const baseAlpha = focusedConstellation === "all" ? 0.24 - densityFactor * 0.08 : highlighted ? 0.6 : 0.05 - densityFactor * 0.015;
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
  }, [focusedConstellation, stars]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { time: { value: 0 } },
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
          varying vec3 vColor;
          varying float vAlpha;
          varying float vTwinkle;
          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            float glow = smoothstep(0.52, 0.0, dist);
            float core = smoothstep(0.18, 0.0, dist);
            float pulse = 0.86 + sin(time * (0.34 + vTwinkle * 0.42) + vTwinkle * 24.0) * 0.14;
            gl_FragColor = vec4(vColor * (0.55 + core * 1.6) * pulse, (glow * 0.55 + core * 0.7) * vAlpha * pulse);
          }
        `,
        vertexColors: true
      }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current?.material?.uniforms?.time) {
      materialRef.current.material.uniforms.time.value = clock.elapsedTime;
    }
  });

  return <points geometry={geometry} material={material} ref={materialRef} frustumCulled={false} />;
}

function StarMarker({ star, selected, onSelectTarget, dimmed, sketched, drawMode }) {
  const haloRef = useRef(null);
  const spriteMaterial = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: buildStarTexture(drawMode && sketched ? "#ffcf70" : star.color),
        transparent: true,
        depthWrite: false
      }),
    [drawMode, sketched, star.color]
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
  });

  return (
    <group position={[star.x, star.y, star.z]}>
      {selected || sketched ? (
        <mesh>
          <sphereGeometry args={[radius * 2.9, 24, 24]} />
          <meshBasicMaterial color={sketched ? "#ffcf70" : star.color} transparent opacity={sketched ? 0.2 : 0.13} />
        </mesh>
      ) : null}
      <sprite ref={haloRef} material={spriteMaterial} scale={[radius * 6.5, radius * 6.5, 1]} />
      <mesh onClick={() => onSelectTarget({ kind: "star", id: star.id })}>
        <sphereGeometry args={[radius * 1.15, 12, 12]} />
        <meshBasicMaterial color={emissive} toneMapped={false} transparent opacity={Math.max(opacity * 0.035, 0.015)} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ConstellationLines({ lines, stars, focusedConstellation, viewMode }) {
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

  const ambientOpacity = focusedConstellation === "all" ? 0.17 + geometry.densityFactor * 0.09 : 0.05 + geometry.densityFactor * 0.03;
  const ambientGlowOpacity = focusedConstellation === "all" ? 0.06 + geometry.densityFactor * 0.04 : 0.02;
  const highlightOpacity = 0.78 + geometry.densityFactor * 0.14;
  const highlightGlowOpacity = 0.22 + geometry.densityFactor * 0.14;

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

function CustomSketchLines({ stars, starIds, viewMode }) {
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

function pushLinePath(points, from, to, curved) {
  if (!curved) {
    points.push(from.x, from.y, from.z, to.x, to.y, to.z);
    return;
  }

  const start = new THREE.Vector3(from.x, from.y, from.z);
  const end = new THREE.Vector3(to.x, to.y, to.z);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  const lift = Math.min(1.1, distance * 0.055);
  const control = mid.clone().multiplyScalar(1.018);
  control.y += lift;
  control.z -= lift * 0.42;

  const previous = new THREE.Vector3();
  for (let step = 0; step <= 5; step += 1) {
    const t = step / 5;
    const current = quadraticPoint(start, control, end, t);
    if (step > 0) {
      points.push(previous.x, previous.y, previous.z, current.x, current.y, current.z);
    }
    previous.copy(current);
  }
}

function quadraticPoint(start, control, end, t) {
  const oneMinusT = 1 - t;
  return new THREE.Vector3(
    oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x,
    oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y,
    oneMinusT * oneMinusT * start.z + 2 * oneMinusT * t * control.z + t * t * end.z
  );
}

function buildConstellationCenters(stars) {
  const centers = new Map();

  stars.forEach((star) => {
    if (!star.visible || star.constellation === "Unknown") {
      return;
    }
    const current = centers.get(star.constellation) || { x: 0, y: 0, z: 0, count: 0 };
    centers.set(star.constellation, {
      x: current.x + star.x,
      y: current.y + star.y,
      z: current.z + star.z,
      count: current.count + 1
    });
  });

  for (const [name, point] of centers.entries()) {
    centers.set(name, {
      x: point.x / point.count,
      y: point.y / point.count,
      z: point.z / point.count
    });
  }

  return centers;
}

function clampStarSize(magnitude) {
  return Math.max(1.2, 5.2 - magnitude * 0.58);
}

function projectSkyPosition(star, viewMode) {
  const az = (star.azimuth * Math.PI) / 180;
  const altitudeRatio = Math.max(0, star.altitude) / 90;
  const azWrapped = Math.atan2(Math.sin(az), Math.cos(az));
  let x;
  let y;
  let z;

  if (viewMode === "space") {
    const radius = 18.8 + Math.max(0, 4.3 - star.magnitude) * 0.22;
    const elevation = (altitudeRatio - 0.5) * Math.PI * 0.92;
    const direction = new THREE.Vector3(
      Math.sin(azWrapped) * Math.cos(elevation),
      Math.sin(elevation),
      -Math.cos(azWrapped) * Math.cos(elevation)
    ).normalize();
    const seed = Number.parseInt(String(star.id).replace(/\D/g, "").slice(-4) || "11", 10);
    const drift = ((seed % 23) - 11) * 0.045;
    x = direction.x * radius * 1.15 + drift;
    y = direction.y * radius * 0.95;
    z = -10.4 + direction.z * radius * 0.62 - Math.abs(direction.x) * 0.85;
  } else if (viewMode === "panorama") {
    const horizonSpread = 18.8;
    const altitudeLift = Math.pow(altitudeRatio, 0.82);
    x = (azWrapped / Math.PI) * horizonSpread;
    y = -1.8 + altitudeLift * 12.8;
    z = -14.4 - Math.cos(altitudeRatio * Math.PI) * 0.8 - Math.abs(azWrapped / Math.PI) * 1.45;
  } else {
    const altitude = altitudeRatio * Math.PI * 0.5;
    const canopyRadius = 17.2;
    const horizontalRadius = canopyRadius * Math.cos(altitude) * 1.38;
    x = Math.sin(az) * horizontalRadius;
    y = -0.9 + Math.sin(altitude) * 14.8;
    z = -16.1 + Math.cos(az) * horizontalRadius * 0.18 - Math.sin(altitude) * 2.8;
  }

  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    z: Number(z.toFixed(4))
  };
}

function HorizonRing({ dictionary, language }) {
  const geometry = useMemo(() => {
    const points = [];

    for (let index = 0; index <= 128; index += 1) {
      const angle = (index / 128) * Math.PI * 2;
      points.push(Math.sin(angle) * 10, 0, -Math.cos(angle) * 10);
    }

    const ringGeometry = new THREE.BufferGeometry();
    ringGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return ringGeometry;
  }, []);

  return (
    <>
      <line geometry={geometry}>
        <lineBasicMaterial color="#ffcf70" transparent opacity={0.28} />
      </line>
      <TextSprite text={dictionary.viewer.cardinals.north[language]} position={[0, 0.35, -10.45]} color="#ffcf70" scale={1.8} />
      <TextSprite text={dictionary.viewer.cardinals.east[language]} position={[10.65, 0.35, 0]} color="#ffcf70" scale={1.8} />
      <TextSprite text={dictionary.viewer.cardinals.south[language]} position={[0, 0.35, 10.45]} color="#ffcf70" scale={1.8} />
      <TextSprite text={dictionary.viewer.cardinals.west[language]} position={[-10.65, 0.35, 0]} color="#ffcf70" scale={1.8} />
    </>
  );
}

function GuideGrid() {
  const ringGeometries = useMemo(() => {
    const altitudes = [25, 50, 75];
    return altitudes.map((altitude) => {
      const points = [];
      const radius = Math.cos((altitude * Math.PI) / 180) * 10;
      const y = Math.sin((altitude * Math.PI) / 180) * 10;

      for (let index = 0; index <= 96; index += 1) {
        const angle = (index / 96) * Math.PI * 2;
        points.push(Math.sin(angle) * radius, y, -Math.cos(angle) * radius);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      return geometry;
    });
  }, []);

  const spokes = useMemo(() => {
    const points = [];

    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2;
      points.push(0, 0, 0, Math.sin(angle) * 10, 0, -Math.cos(angle) * 10);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  return (
    <>
      {ringGeometries.map((geometry, index) => (
        <line key={`ring-${index}`} geometry={geometry}>
          <lineBasicMaterial color="#80a3c8" transparent opacity={0.12} />
        </line>
      ))}
      <lineSegments geometry={spokes}>
        <lineBasicMaterial color="#80a3c8" transparent opacity={0.12} />
      </lineSegments>
    </>
  );
}

function SpaceDepthField() {
  const fieldRef = useRef(null);
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
      <pointsMaterial size={0.075} sizeAttenuation vertexColors transparent opacity={0.28} depthWrite={false} />
    </points>
  );
}

function MilkyWayBand() {
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
      <pointsMaterial size={0.11} sizeAttenuation vertexColors transparent opacity={0.16} depthWrite={false} />
    </points>
  );
}

function DeepSkyField() {
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
      <pointsMaterial size={0.085} sizeAttenuation vertexColors transparent opacity={0.42} depthWrite={false} />
    </points>
  );
}

function TextSprite({ text, position, color, scale = 2 }) {
  const sprite = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "700 44px Inter, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "rgba(2, 4, 10, 0.82)";
    context.fillRect(48, 26, 416, 76);
    context.strokeStyle = "rgba(236, 243, 255, 0.2)";
    context.lineWidth = 2;
    context.strokeRect(48, 26, 416, 76);
    context.fillStyle = color;
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    return material;
  }, [color, text]);

  return <sprite material={sprite} position={position} scale={[scale * 1.4, scale * 0.35, 1]} />;
}
