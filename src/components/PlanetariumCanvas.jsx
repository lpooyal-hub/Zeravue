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
  planets,
  selectedTarget,
  onSelectTarget,
  language,
  dictionary,
  showLabels,
  showGuides,
  showConstellations,
  showPlanets,
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
      <fog attach="fog" args={["#010208", 16, 36]} />
      <SceneContents
        scene={scene}
        planets={planets}
        selectedTarget={selectedTarget}
        onSelectTarget={onSelectTarget}
        language={language}
        dictionary={dictionary}
        showLabels={showLabels}
        showGuides={showGuides}
        showConstellations={showConstellations}
        showPlanets={showPlanets}
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
  planets,
  selectedTarget,
  onSelectTarget,
  language,
  dictionary,
  showLabels,
  showGuides,
  showConstellations,
  showPlanets,
  autoRotate,
  focusedConstellation,
  drawMode,
  customSketchStarIds
}) {
  const groupRef = useRef(null);
  const cameraAnchor = useRef({ x: 0, y: 0 });
  const { camera, pointer } = useThree();

  const labelData = useMemo(() => {
    const visibleBrightStars = scene.stars
      .filter((star) => star.visible && isHighlighted(star.constellation, focusedConstellation))
      .sort((left, right) => left.magnitude - right.magnitude)
      .slice(0, 8)
      .map((star) => ({
        id: `star-${star.id}`,
        text: star.name,
        position: [star.x, star.y + 0.52, star.z],
        color: "#dfe9ff",
        scale: 1.9
      }));

    const constellationPoints = new Map();
    scene.stars.forEach((star) => {
      if (!star.visible) {
        return;
      }

      const current = constellationPoints.get(star.constellation) || { x: 0, y: 0, z: 0, count: 0 };
      constellationPoints.set(star.constellation, {
        x: current.x + star.x,
        y: current.y + star.y,
        z: current.z + star.z,
        count: current.count + 1
      });
    });

    const constellationLabels = [...constellationPoints.entries()].map(([name, point]) => ({
      id: `constellation-${name}`,
      text: dictionary.constellations?.[name]?.[language] || name,
      position: [point.x / point.count, point.y / point.count + 1.05, point.z / point.count],
      color: "#7fdbc9",
      scale: 2.3
    }));

    return {
      starLabels: visibleBrightStars,
      constellationLabels
    };
  }, [dictionary.constellations, focusedConstellation, language, scene.stars]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      if (autoRotate) {
        groupRef.current.rotation.y += delta * 0.03;
      }
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -pointer.y * 0.18, 0.04);
      cameraAnchor.current.x = THREE.MathUtils.lerp(cameraAnchor.current.x, pointer.x * 1.8, 0.04);
      cameraAnchor.current.y = THREE.MathUtils.lerp(cameraAnchor.current.y, pointer.y * 0.9, 0.04);
    }

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cameraAnchor.current.x, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraAnchor.current.y, 0.04);
    camera.lookAt(0, 0.5, 0);
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 4, 12]} intensity={1.05} color="#bcd6ff" />
      <pointLight position={[0, -6, -10]} intensity={0.44} color="#ffb36b" />
      <group ref={groupRef}>
        <DeepSkyField />
        <StarDome />
        {showGuides ? <GuideGrid /> : null}
        {showGuides ? <HorizonRing dictionary={dictionary} language={language} /> : null}
        {showConstellations ? <ConstellationLines lines={scene.lines} stars={scene.stars} focusedConstellation={focusedConstellation} /> : null}
        {customSketchStarIds.length >= 2 ? <CustomSketchLines stars={scene.stars} starIds={customSketchStarIds} /> : null}
        {scene.stars.map((star) => (
          <StarMarker
            key={star.id}
            star={star}
            selected={selectedTarget?.kind === "star" && star.id === selectedTarget.id}
            onSelectTarget={onSelectTarget}
            dimmed={!isHighlighted(star.constellation, focusedConstellation)}
            sketched={customSketchStarIds.includes(star.id)}
            drawMode={drawMode}
          />
        ))}
        {showPlanets
          ? planets.map((planet, index) => (
              <PlanetMarker
                key={planet.name}
                planet={planet}
                index={index}
                language={language}
                selected={selectedTarget?.kind === "planet" && planet.name === selectedTarget.id}
                onSelectTarget={onSelectTarget}
                dimmed={focusedConstellation !== "all"}
              />
            ))
          : null}
        {showLabels
          ? labelData.starLabels.map((label) => <TextSprite key={label.id} {...label} />)
          : null}
        {showLabels && showConstellations
          ? labelData.constellationLabels.map((label) => <TextSprite key={label.id} {...label} />)
          : null}
        {showLabels && showPlanets
          ? planets.map((planet, index) => (
              <TextSprite
                key={`planet-label-${planet.name}`}
                text={dictionary.planetNames?.[planet.name] || planet.name}
                position={planetPosition(index, planet.orbit, true)}
                color={planet.color}
                scale={2}
              />
            ))
          : null}
      </group>
    </>
  );
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
  const radius = star.size * (selected ? 1.9 : sketched ? 1.5 : dimmed ? 0.9 : 1.2);
  const emissive = star.visible ? star.color : "#334155";
  const opacity = sketched ? 1 : dimmed ? 0.18 : 1;
  const pulseSeed = useMemo(() => Number.parseInt(String(star.id).replace(/\D/g, "").slice(-4) || "7", 10) * 0.013, [star.id]);

  useFrame(({ clock }) => {
    if (!haloRef.current) {
      return;
    }

    const pulse = 1 + Math.sin(clock.elapsedTime * 1.35 + pulseSeed) * 0.12;
    haloRef.current.scale.setScalar(pulse);
    haloRef.current.material.opacity = (sketched ? 0.24 : 0.14) + (selected ? 0.1 : 0) + Math.sin(clock.elapsedTime * 1.1 + pulseSeed) * 0.03;
  });

  return (
    <group position={[star.x, star.y, star.z]}>
      {selected || sketched ? (
        <mesh>
          <sphereGeometry args={[radius * 2.6, 24, 24]} />
          <meshBasicMaterial color={sketched ? "#ffcf70" : star.color} transparent opacity={sketched ? 0.18 : 0.12} />
        </mesh>
      ) : null}
      <sprite ref={haloRef} material={spriteMaterial} scale={[radius * 5.8, radius * 5.8, 1]} />
      <mesh onClick={() => onSelectTarget({ kind: "star", id: star.id })}>
        <sphereGeometry args={[radius * 1.15, 12, 12]} />
        <meshBasicMaterial color={emissive} toneMapped={false} transparent opacity={Math.max(opacity * 0.02, 0.01)} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PlanetMarker({ planet, index, selected, onSelectTarget, dimmed }) {
  const groupRef = useRef(null);
  const position = planetPosition(index, planet.orbit);
  const radius = 0.28 + planet.radius * 0.035;
  const opacity = dimmed ? 0.24 : 1;
  const ringTilt = planet.name === "Saturn" ? 0.62 : 0;

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.5 + index) * 0.08;
    groupRef.current.rotation.y += 0.003 + index * 0.0002;
  });

  return (
    <group ref={groupRef} position={position}>
      {selected ? (
        <mesh>
          <sphereGeometry args={[radius * 2.2, 18, 18]} />
          <meshBasicMaterial color={planet.color} transparent opacity={0.12} />
        </mesh>
      ) : null}
      <mesh>
        <sphereGeometry args={[radius * 1.9, 18, 18]} />
        <meshBasicMaterial color={planet.color} transparent opacity={dimmed ? 0.08 : 0.16} depthWrite={false} />
      </mesh>
      <mesh onClick={() => onSelectTarget({ kind: "planet", id: planet.name })}>
        <sphereGeometry args={[radius, 20, 20]} />
        <meshStandardMaterial color={planet.color} emissive={planet.color} emissiveIntensity={0.35} roughness={0.5} transparent opacity={opacity} />
      </mesh>
      {planet.name === "Saturn" ? (
        <mesh rotation={[ringTilt, 0.2, 0]}>
          <ringGeometry args={[radius * 1.45, radius * 2.3, 64]} />
          <meshBasicMaterial color="#d9c28a" transparent opacity={dimmed ? 0.12 : 0.4} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
    </group>
  );
}

function planetPosition(index, orbit, labelOffset = false) {
  const angle = -1.4 + index * 0.43;
  const distance = 6.2 + orbit * 0.012;
  const y = -5.2 + (labelOffset ? 0.7 : 0);
  return [Math.cos(angle) * distance, y, Math.sin(angle) * distance];
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
        <lineBasicMaterial color="#79d9cf" transparent opacity={focusedConstellation === "all" ? 0.42 : 0.12} />
      </lineSegments>
      {focusedConstellation !== "all" ? (
        <lineSegments geometry={geometry.highlightGeometry}>
          <lineBasicMaterial color="#ffcf70" transparent opacity={0.9} />
        </lineSegments>
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

function StarDome() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <sphereGeometry args={[10.25, 36, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial color="#07101f" transparent opacity={0.26} side={THREE.BackSide} />
    </mesh>
  );
}

function DeepSkyField() {
  const particles = useMemo(() => {
    const positions = [];
    const colors = [];

    for (let index = 0; index < 1800; index += 1) {
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
      <pointsMaterial size={0.095} sizeAttenuation vertexColors transparent opacity={0.58} depthWrite={false} />
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
    context.fillStyle = "rgba(2, 4, 10, 0.72)";
    context.fillRect(48, 26, 416, 76);
    context.strokeStyle = "rgba(236, 243, 255, 0.16)";
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

function isHighlighted(constellation, focusedConstellation) {
  return focusedConstellation === "all" || constellation === focusedConstellation;
}
