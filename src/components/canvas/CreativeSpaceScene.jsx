import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clampCoordinate } from "../../utils/viewerState.js";
import { TextSprite as TextSpriteView } from "./ViewerGuides.jsx";
import { DeepSkyField, MilkyWayBand, SpaceDepthField } from "./SkyAtmosphere.jsx";
import { pushLinePath } from "./starMath.js";

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

export function CreativeSpaceScene({
  customSpace,
  selectedTarget,
  onSelectTarget,
  showGuides,
  showLabels,
  zoomLevel,
  dictionary,
  creativeTool,
  onCreativeSpaceClick,
  onUpdateCustomObject,
  editingEnabled
}) {
  const groupRef = useRef(null);
  const cameraAnchor = useRef({ x: 0, y: 0, z: 0 });
  const lookAnchor = useRef({ x: 0, y: 0, z: -11.8 });
  const draggingObjectRef = useRef(null);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 12.2));
  const dragPointRef = useRef(new THREE.Vector3());
  const { camera, gl } = useThree();
  const labelData = useMemo(() => {
    if (!showLabels) {
      return [];
    }

    const labels = [];
    const starLabels = [...(customSpace?.stars || [])]
      .slice(-8)
      .map((star) => ({
        id: `custom-star-${star.id}`,
        text: star.name,
        position: [star.x, star.y + 0.45, star.z],
        color: "#eef4ff",
        scale: 1.65
      }));
    labels.push(...starLabels);

    (customSpace?.constellations || []).forEach((constellation) => {
      if (!constellation.starIds.length) {
        return;
      }
      const stars = constellation.starIds
        .map((starId) => customSpace.stars.find((star) => star.id === starId))
        .filter(Boolean);
      if (!stars.length) {
        return;
      }
      const center = stars.reduce(
        (current, star) => ({
          x: current.x + star.x,
          y: current.y + star.y,
          z: current.z + star.z
        }),
        { x: 0, y: 0, z: 0 }
      );
      labels.push({
        id: `custom-constellation-${constellation.id}`,
        text: constellation.name,
        position: [center.x / stars.length, center.y / stars.length + 0.95, center.z / stars.length],
        color: constellation.color,
        scale: 1.9
      });
    });

    return labels;
  }, [customSpace, showLabels]);

  const activeConstellationHandle = useMemo(() => {
    const constellationId = customSpace?.activeConstellationId || customSpace?.constellations?.[0]?.id;
    if (!constellationId) {
      return null;
    }
    const stars = (customSpace?.stars || []).filter((star) => star.constellationId === constellationId);
    if (stars.length < 2) {
      return null;
    }

    const center = stars.reduce(
      (current, star) => ({
        x: current.x + star.x,
        y: current.y + star.y,
        z: current.z + star.z
      }),
      { x: 0, y: 0, z: 0 }
    );

    return {
      id: constellationId,
      name: customSpace.constellations.find((constellation) => constellation.id === constellationId)?.name || dictionary.viewer.activeConstellation,
      x: center.x / stars.length,
      y: center.y / stars.length,
      z: center.z / stars.length,
      stars
    };
  }, [customSpace, dictionary.viewer.activeConstellation]);

  useEffect(() => {
    function clearDrag() {
      draggingObjectRef.current = null;
    }
    gl.domElement.addEventListener("pointerup", clearDrag);
    gl.domElement.addEventListener("pointerleave", clearDrag);
    return () => {
      gl.domElement.removeEventListener("pointerup", clearDrag);
      gl.domElement.removeEventListener("pointerleave", clearDrag);
    };
  }, [gl]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 6.2, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, 0, 6.2, delta);
    }
    cameraAnchor.current.x = THREE.MathUtils.damp(cameraAnchor.current.x, 0, 6.2, delta);
    cameraAnchor.current.y = THREE.MathUtils.damp(cameraAnchor.current.y, 0.2, 6.2, delta);
    cameraAnchor.current.z = THREE.MathUtils.damp(cameraAnchor.current.z, -0.05, 6.6, delta);
    lookAnchor.current.x = THREE.MathUtils.damp(lookAnchor.current.x, 0, 6.2, delta);
    lookAnchor.current.y = THREE.MathUtils.damp(lookAnchor.current.y, 0.45, 6.2, delta);
    lookAnchor.current.z = THREE.MathUtils.damp(lookAnchor.current.z, -12.2, 6.6, delta);

    camera.position.x = cameraAnchor.current.x;
    camera.position.y = cameraAnchor.current.y;
    camera.position.z = 15.2 * THREE.MathUtils.lerp(1.12, 0.78, zoomLevel) + cameraAnchor.current.z;
    camera.fov = THREE.MathUtils.damp(camera.fov, 42, 5.2, delta);
    camera.updateProjectionMatrix();
    camera.lookAt(lookAnchor.current.x, lookAnchor.current.y, lookAnchor.current.z);

    if (editingEnabled && draggingObjectRef.current) {
      state.raycaster.setFromCamera(state.pointer, state.camera);
      if (state.raycaster.ray.intersectPlane(dragPlaneRef.current, dragPointRef.current)) {
        const dragging = draggingObjectRef.current;
        if (dragging.kind === "custom-constellation") {
          onUpdateCustomObject?.(
            { kind: "custom-constellation", id: dragging.id },
            {
              deltaX: dragPointRef.current.x - dragging.originPoint.x,
              deltaY: dragPointRef.current.y - dragging.originPoint.y,
              dragOrigin: dragging.dragOrigin
            }
          );
        } else {
          onUpdateCustomObject?.(
            { kind: dragging.kind, id: dragging.id },
            {
              x: clampCoordinate(dragPointRef.current.x),
              y: clampCoordinate(dragPointRef.current.y),
              z: -12.2
            }
          );
        }
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.42} />
      <pointLight position={[0, 5, 12]} intensity={0.7} color="#b8d2ff" />
      <group ref={groupRef}>
        <MilkyWayBand viewMode="panorama" />
        <DeepSkyField viewMode="panorama" atmosphereStrength={0.48} />
        <SpaceDepthField atmosphereStrength={0.36} />
        <CreativeCanvasPlane creativeTool={creativeTool} onCreativeSpaceClick={onCreativeSpaceClick} editingEnabled={editingEnabled} />
        {showGuides ? <CreativeCanvasGuides /> : null}
        <CreativeConstellationLines customSpace={customSpace} />
        {customSpace?.stars.map((star) => (
          <CreativeStar
            key={star.id}
            star={star}
            selected={selectedTarget?.kind === "custom-star" && selectedTarget.id === star.id}
            onSelectTarget={onSelectTarget}
            onStartDrag={(starId) => {
              if (editingEnabled) {
                draggingObjectRef.current = { kind: "custom-star", id: starId };
              }
            }}
            editingEnabled={editingEnabled}
          />
        ))}
        {customSpace?.planets.map((planet) => (
          <CreativePlanet
            key={planet.id}
            planet={planet}
            selected={selectedTarget?.kind === "custom-planet" && selectedTarget.id === planet.id}
            onSelectTarget={onSelectTarget}
            onStartDrag={(planetId) => {
              if (editingEnabled) {
                draggingObjectRef.current = { kind: "custom-planet", id: planetId };
              }
            }}
            editingEnabled={editingEnabled}
          />
        ))}
        {activeConstellationHandle && editingEnabled ? (
          <CreativeConstellationHandle
            handle={activeConstellationHandle}
            selected={selectedTarget?.kind === "custom-constellation" && selectedTarget.id === activeConstellationHandle.id}
            onSelectTarget={onSelectTarget}
            onStartDrag={(handleId, originPoint, stars) => {
              draggingObjectRef.current = {
                kind: "custom-constellation",
                id: handleId,
                originPoint,
                dragOrigin: stars.map((star) => ({ id: star.id, x: star.x, y: star.y, z: star.z }))
              };
            }}
          />
        ) : null}
        {labelData.map((label) => (
          <TextSpriteView key={label.id} {...label} />
        ))}
      </group>
    </>
  );
}

function CreativeCanvasPlane({ creativeTool, onCreativeSpaceClick, editingEnabled }) {
  return (
    <mesh
      position={[0, 0, -12.24]}
      onPointerDown={(event) => {
        if (!editingEnabled || creativeTool === "delete") {
          return;
        }
        event.stopPropagation();
        onCreativeSpaceClick?.(event.point);
      }}
    >
      <planeGeometry args={[44, 28]} />
      <meshBasicMaterial color="#04101d" transparent opacity={editingEnabled ? 0.54 : 0.42} depthWrite={false} />
    </mesh>
  );
}

function CreativeCanvasGuides() {
  const frame = useMemo(() => {
    const points = [-21, -13, -12.18, 21, -13, -12.18, 21, -13, -12.18, 21, 13, -12.18, 21, 13, -12.18, -21, 13, -12.18, -21, 13, -12.18, -21, -13, -12.18];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  const grid = useMemo(() => {
    const points = [];
    for (let x = -18; x <= 18; x += 6) {
      points.push(x, -13, -12.19, x, 13, -12.19);
    }
    for (let y = -10; y <= 10; y += 5) {
      points.push(-21, y, -12.19, 21, y, -12.19);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  return (
    <>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#5d7599" transparent opacity={0.16} />
      </lineSegments>
      <lineSegments geometry={frame}>
        <lineBasicMaterial color="#8eaed8" transparent opacity={0.28} />
      </lineSegments>
    </>
  );
}

function CreativeConstellationLines({ customSpace }) {
  const geometries = useMemo(() => {
    const byId = new Map((customSpace?.stars || []).map((star) => [star.id, star]));
    return (customSpace?.constellations || []).map((constellation) => {
      const points = [];
      if (Array.isArray(constellation.segments) && constellation.segments.length > 0) {
        for (const segment of constellation.segments) {
          const from = byId.get(segment[0]);
          const to = byId.get(segment[1]);
          if (!from || !to) {
            continue;
          }
          pushLinePath(points, from, to, true);
        }
      } else {
        for (let index = 1; index < constellation.starIds.length; index += 1) {
          const from = byId.get(constellation.starIds[index - 1]);
          const to = byId.get(constellation.starIds[index]);
          if (!from || !to) {
            continue;
          }
          pushLinePath(points, from, to, true);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
      return { id: constellation.id, color: constellation.color, geometry, empty: points.length === 0 };
    });
  }, [customSpace]);

  return (
    <>
      {geometries.map((item) =>
        item.empty ? null : (
          <lineSegments key={item.id} geometry={item.geometry}>
            <lineBasicMaterial color={item.color} transparent opacity={0.86} />
          </lineSegments>
        )
      )}
    </>
  );
}

function CreativeStar({ star, selected, onSelectTarget, onStartDrag, editingEnabled }) {
  const haloRef = useRef(null);
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: buildStarTexture(star.color),
        transparent: true,
        depthWrite: false
      }),
    [star.color]
  );

  useFrame(({ clock }) => {
    if (!haloRef.current) {
      return;
    }
    const pulse = 1 + Math.sin(clock.elapsedTime * 0.9 + star.size * 2.7) * 0.08;
    haloRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={[star.x, star.y, star.z]}>
      {selected ? (
        <mesh>
          <sphereGeometry args={[star.size * 0.42, 24, 24]} />
          <meshBasicMaterial color="#ffcf70" transparent opacity={0.18} />
        </mesh>
      ) : null}
      <sprite ref={haloRef} material={material} scale={[star.size * 2.6, star.size * 2.6, 1]} />
      <mesh
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelectTarget({ kind: "custom-star", id: star.id });
          if (editingEnabled) {
            onStartDrag?.(star.id);
          }
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelectTarget({ kind: "custom-star", id: star.id });
        }}
      >
        <sphereGeometry args={[star.size * 0.18, 12, 12]} />
        <meshBasicMaterial color={star.color} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CreativePlanet({ planet, selected, onSelectTarget, onStartDrag, editingEnabled }) {
  const groupRef = useRef(null);
  const color = new THREE.Color(planet.color);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.16;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[planet.x, planet.y, planet.z]}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelectTarget({ kind: "custom-planet", id: planet.id });
        if (editingEnabled) {
          onStartDrag?.(planet.id);
        }
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelectTarget({ kind: "custom-planet", id: planet.id });
      }}
    >
      {selected ? (
        <mesh>
          <sphereGeometry args={[planet.size * 0.9, 32, 32]} />
          <meshBasicMaterial color="#ffcf70" transparent opacity={0.12} />
        </mesh>
      ) : null}
      <mesh>
        <sphereGeometry args={[planet.size * 0.42, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.16} roughness={0.72} metalness={0.05} />
      </mesh>
      <mesh>
        <sphereGeometry args={[planet.size * 0.72, 32, 32]} />
        <meshBasicMaterial color={planet.color} transparent opacity={0.08} depthWrite={false} />
      </mesh>
      {planet.ring ? (
        <mesh rotation={[Math.PI * 0.52, 0.18, 0]}>
          <ringGeometry args={[planet.size * 0.58, planet.size * 0.88, 72]} />
          <meshBasicMaterial color="#f3dca8" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function CreativeConstellationHandle({ handle, selected, onSelectTarget, onStartDrag }) {
  return (
    <group
      position={[handle.x, handle.y, handle.z]}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelectTarget({ kind: "custom-constellation", id: handle.id });
        onStartDrag?.(handle.id, { x: handle.x, y: handle.y }, handle.stars);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelectTarget({ kind: "custom-constellation", id: handle.id });
      }}
    >
      <mesh>
        <ringGeometry args={[0.62, 0.84, 48]} />
        <meshBasicMaterial color={selected ? "#ffcf70" : "#8fd8ff"} transparent opacity={selected ? 0.72 : 0.42} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color="#06101d" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}
