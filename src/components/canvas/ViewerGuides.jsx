import { useMemo } from "react";
import * as THREE from "three";

export function ProjectionGuide({ dictionary, language }) {
  const ringGeometry = useMemo(() => {
    const points = [];
    for (let index = 0; index <= 144; index += 1) {
      const angle = (index / 144) * Math.PI * 2;
      points.push(Math.sin(angle) * 11.6, Math.cos(angle) * 11.6, -13.35);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  const altitudeGeometries = useMemo(() => {
    return [30, 60].map((altitude) => {
      const points = [];
      const zenithDistance = (90 - altitude) / 90;
      const radius = THREE.MathUtils.lerp(0.35, 11.6, zenithDistance);
      for (let index = 0; index <= 120; index += 1) {
        const angle = (index / 120) * Math.PI * 2;
        points.push(Math.sin(angle) * radius, Math.cos(angle) * radius, -13.35);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      return geometry;
    });
  }, []);

  return (
    <>
      <line geometry={ringGeometry}>
        <lineBasicMaterial color="#ffcf70" transparent opacity={0.34} />
      </line>
      {altitudeGeometries.map((geometry, index) => (
        <line key={index} geometry={geometry}>
          <lineBasicMaterial color="#7adcd4" transparent opacity={0.16} />
        </line>
      ))}
      <TextSprite text={dictionary.viewer.cardinals.north[language]} position={[0, 12.3, -13.3]} color="#ffcf70" scale={1.7} />
      <TextSprite text={dictionary.viewer.cardinals.east[language]} position={[12.35, 0, -13.3]} color="#ffcf70" scale={1.7} />
      <TextSprite text={dictionary.viewer.cardinals.south[language]} position={[0, -12.3, -13.3]} color="#ffcf70" scale={1.7} />
      <TextSprite text={dictionary.viewer.cardinals.west[language]} position={[-12.35, 0, -13.3]} color="#ffcf70" scale={1.7} />
    </>
  );
}

export function ObserverGuide({ dictionary, language }) {
  return (
    <>
      <GuideGrid />
      <TextSprite text={language === "ko" ? "천정" : "Zenith"} position={[0, 12.8, 0]} color="#fff2b3" scale={1.9} />
      <TextSprite text={language === "ko" ? "북쪽 하늘" : "North sky"} position={[0, 2.1, -10.9]} color="#9fd8ff" scale={1.5} />
      <TextSprite text="60°" position={[0, 9.3, -1.4]} color="#b9cde6" scale={1.15} />
      <TextSprite text="30°" position={[0, 5.6, -5.3]} color="#8fa6c5" scale={1.1} />
    </>
  );
}

export function ObserverHorizonCue() {
  const horizonGeometry = useMemo(() => {
    const points = [];

    for (let index = 0; index <= 160; index += 1) {
      const angle = (index / 160) * Math.PI * 2;
      points.push(Math.sin(angle) * 10.25, -0.02, -Math.cos(angle) * 10.25);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  const altitudeGeometries = useMemo(() => {
    return [18, 42].map((altitude) => {
      const points = [];
      const radius = Math.cos((altitude * Math.PI) / 180) * 10;
      const y = Math.sin((altitude * Math.PI) / 180) * 10;

      for (let index = 0; index <= 128; index += 1) {
        const angle = (index / 128) * Math.PI * 2;
        points.push(Math.sin(angle) * radius, y, -Math.cos(angle) * radius);
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      return geometry;
    });
  }, []);

  return (
    <>
      <line geometry={horizonGeometry}>
        <lineBasicMaterial color="#ffcf70" transparent opacity={0.18} depthWrite={false} />
      </line>
      {altitudeGeometries.map((geometry, index) => (
        <line key={`observer-cue-${index}`} geometry={geometry}>
          <lineBasicMaterial color="#8fb7dd" transparent opacity={0.075} depthWrite={false} />
        </line>
      ))}
    </>
  );
}

export function HorizonRing({ dictionary, language }) {
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

export function GuideGrid() {
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

export function TextSprite({ text, position, color, scale = 2 }) {
  const sprite = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "700 92px 'Pretendard', 'Noto Sans KR', sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = color;
    context.shadowColor = "rgba(0,0,0,0.65)";
    context.shadowBlur = 18;
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
  }, [color, text]);

  return <sprite material={sprite} position={position} scale={[scale * 1.9, scale * 0.9, 1]} />;
}
