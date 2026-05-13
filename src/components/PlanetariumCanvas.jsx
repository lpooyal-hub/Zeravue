import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

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
  focusedConstellation
}) {
  if (!scene) {
    return <div className="scene-empty">{dictionary.viewer.loading}</div>;
  }

  return (
    <Canvas camera={{ position: [0, 0, 18], fov: 48 }} dpr={[1, 2]}>
      <color attach="background" args={["#02040a"]} />
      <fog attach="fog" args={["#02040a", 18, 34]} />
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
  focusedConstellation
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
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 4, 12]} intensity={1.25} color="#c7dcff" />
      <pointLight position={[0, -6, -10]} intensity={0.52} color="#ffb36b" />
      <group ref={groupRef}>
        <StarDome />
        {showGuides ? <GuideGrid /> : null}
        {showGuides ? <HorizonRing dictionary={dictionary} language={language} /> : null}
        {showConstellations ? <ConstellationLines lines={scene.lines} stars={scene.stars} focusedConstellation={focusedConstellation} /> : null}
        {scene.stars.map((star) => (
          <StarMarker
            key={star.id}
            star={star}
            selected={selectedTarget?.kind === "star" && star.id === selectedTarget.id}
            onSelectTarget={onSelectTarget}
            dimmed={!isHighlighted(star.constellation, focusedConstellation)}
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

function StarMarker({ star, selected, onSelectTarget, dimmed }) {
  const radius = star.size * (selected ? 1.9 : dimmed ? 0.9 : 1.2);
  const emissive = star.visible ? star.color : "#334155";
  const opacity = dimmed ? 0.18 : 1;

  return (
    <group position={[star.x, star.y, star.z]}>
      {selected ? (
        <mesh>
          <sphereGeometry args={[radius * 2.6, 24, 24]} />
          <meshBasicMaterial color={star.color} transparent opacity={0.12} />
        </mesh>
      ) : null}
      <mesh onClick={() => onSelectTarget({ kind: "star", id: star.id })}>
        <sphereGeometry args={[radius, 18, 18]} />
        <meshBasicMaterial color={emissive} toneMapped={false} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function PlanetMarker({ planet, index, selected, onSelectTarget, dimmed }) {
  const position = planetPosition(index, planet.orbit);
  const radius = 0.28 + planet.radius * 0.035;
  const opacity = dimmed ? 0.24 : 1;

  return (
    <group position={position}>
      {selected ? (
        <mesh>
          <sphereGeometry args={[radius * 2.2, 18, 18]} />
          <meshBasicMaterial color={planet.color} transparent opacity={0.12} />
        </mesh>
      ) : null}
      <mesh onClick={() => onSelectTarget({ kind: "planet", id: planet.name })}>
        <sphereGeometry args={[radius, 20, 20]} />
        <meshStandardMaterial color={planet.color} emissive={planet.color} emissiveIntensity={0.35} roughness={0.5} transparent opacity={opacity} />
      </mesh>
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
      <meshBasicMaterial color="#0d1422" transparent opacity={0.18} side={THREE.BackSide} />
    </mesh>
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
