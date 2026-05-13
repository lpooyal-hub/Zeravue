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
  focusedConstellation,
  drawMode,
  customSketchStarIds
}) {
  const groupRef = useRef(null);
  const cameraAnchor = useRef({ x: 0, y: 0 });
  const { camera, pointer } = useThree();
  const projectedStars = useMemo(() => scene.stars.map((star) => ({ ...star, ...projectSkyPosition(star) })), [scene.stars]);

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
    if (groupRef.current) {
      if (autoRotate) {
        groupRef.current.rotation.y += delta * 0.016;
      }
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -pointer.y * 0.045, 0.03);
      cameraAnchor.current.x = THREE.MathUtils.lerp(cameraAnchor.current.x, pointer.x * 0.92, 0.03);
      cameraAnchor.current.y = THREE.MathUtils.lerp(cameraAnchor.current.y, pointer.y * 0.34, 0.03);
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cameraAnchor.current.x, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraAnchor.current.y, 0.03);
    camera.lookAt(0, 1.25, -8.2);
  });

  return (
    <>
      <ambientLight intensity={0.38} />
      <pointLight position={[0, 6, 14]} intensity={0.9} color="#b8d2ff" />
      <pointLight position={[-12, -4, -8]} intensity={0.25} color="#ffbf8a" />
      <group ref={groupRef}>
        <MilkyWayBand />
        <DeepSkyField />
        <BackgroundStarField stars={projectedStars} focusedConstellation={focusedConstellation} />
        {showGuides ? <GuideGrid /> : null}
        {showGuides ? <HorizonRing dictionary={dictionary} language={language} /> : null}
        {showConstellations ? <ConstellationLines lines={scene.lines} stars={projectedStars} focusedConstellation={focusedConstellation} /> : null}
        {customSketchStarIds.length >= 2 ? <CustomSketchLines stars={projectedStars} starIds={customSketchStarIds} /> : null}
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
  const geometry = useMemo(() => {
    const positions = [];
    const colors = [];
    const sizes = [];
    const alphas = [];

    stars.forEach((star) => {
      if (!star.visible) {
        return;
      }

      positions.push(star.x, star.y, star.z);

      const color = new THREE.Color(star.color);
      colors.push(color.r, color.g, color.b);

      const highlighted = focusedConstellation !== "all" && star.constellation === focusedConstellation;
      sizes.push(clampStarSize(star.magnitude) * (highlighted ? 1.45 : 1));

      const baseAlpha = focusedConstellation === "all" ? 0.26 : highlighted ? 0.62 : 0.07;
      alphas.push(baseAlpha + Math.max(0, 0.16 - star.magnitude * 0.012));
    });

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    starGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    starGeometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    starGeometry.setAttribute("alpha", new THREE.Float32BufferAttribute(alphas, 1));
    return starGeometry;
  }, [focusedConstellation, stars]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { scale: { value: window.devicePixelRatio || 1 } },
        vertexShader: `
          attribute float size;
          attribute float alpha;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vColor = color;
            vAlpha = alpha;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (220.0 / max(8.0, -mvPosition.z));
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float dist = length(coord);
            float glow = smoothstep(0.52, 0.0, dist);
            float core = smoothstep(0.18, 0.0, dist);
            gl_FragColor = vec4(vColor * (0.55 + core * 1.6), (glow * 0.55 + core * 0.7) * vAlpha);
          }
        `,
        vertexColors: true
      }),
    []
  );

  return <points geometry={geometry} material={material} frustumCulled={false} />;
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

function ConstellationLines({ lines, stars, focusedConstellation }) {
  const geometry = useMemo(() => {
    const byId = new Map(stars.map((star) => [star.id, star]));
    const points = [];
    const highlightedPoints = [];

    lines.forEach((line) => {
      const from = byId.get(line.from);
      const to = byId.get(line.to);

      if (!from || !to) {
        return;
      }

      points.push(from.x, from.y, from.z, to.x, to.y, to.z);

      if (focusedConstellation !== "all" && from.constellation === focusedConstellation && to.constellation === focusedConstellation) {
        highlightedPoints.push(from.x, from.y, from.z, to.x, to.y, to.z);
      }
    });

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const highlightGeometry = new THREE.BufferGeometry();
    highlightGeometry.setAttribute("position", new THREE.Float32BufferAttribute(highlightedPoints, 3));
    return { lineGeometry, highlightGeometry };
  }, [focusedConstellation, lines, stars]);

  return (
    <>
      <lineSegments geometry={geometry.lineGeometry}>
        <lineBasicMaterial color="#7adcd4" transparent opacity={focusedConstellation === "all" ? 0.24 : 0.08} />
      </lineSegments>
      {focusedConstellation !== "all" ? (
        <>
          <lineSegments geometry={geometry.highlightGeometry}>
            <lineBasicMaterial color="#ffcf70" transparent opacity={0.95} />
          </lineSegments>
          <lineSegments geometry={geometry.highlightGeometry}>
            <lineBasicMaterial color="#fff5c8" transparent opacity={0.34} />
          </lineSegments>
        </>
      ) : null}
    </>
  );
}

function CustomSketchLines({ stars, starIds }) {
  const geometry = useMemo(() => {
    const byId = new Map(stars.map((star) => [star.id, star]));
    const points = [];

    for (let index = 1; index < starIds.length; index += 1) {
      const from = byId.get(starIds[index - 1]);
      const to = byId.get(starIds[index]);

      if (!from || !to) {
        continue;
      }

      points.push(from.x, from.y, from.z, to.x, to.y, to.z);
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return lineGeometry;
  }, [starIds, stars]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#ffcf70" transparent opacity={0.95} />
    </lineSegments>
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

function projectSkyPosition(star) {
  const az = (star.azimuth * Math.PI) / 180;
  const altitudeRatio = Math.max(0, star.altitude) / 90;
  const lateral = Math.cos(altitudeRatio * Math.PI * 0.42);
  const x = Math.sin(az) * 10.2 * lateral;
  const y = -2.4 + altitudeRatio * 9.6 + Math.sin(az * 0.5) * 0.16;
  const z = -8.8 + Math.cos(az) * (1.6 - altitudeRatio * 0.4) - altitudeRatio * 0.95;
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
