import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
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
  atmosphereStrength = 0.7,
  starGlowStrength = 0.8,
  viewMode,
  zoomLevel = 0.52,
  focusedConstellation,
  trackConstellation = false,
  drawMode,
  customSketchStarIds,
  creativeMode = false,
  customSpace,
  creativeTool,
  onCreativeSpaceClick,
  onUpdateCustomObject,
  editingEnabled = true
}) {
  if (!scene && !creativeMode) {
    return <div className="scene-empty">{dictionary.viewer.loading}</div>;
  }

  return (
    <Canvas camera={{ position: [0, 0, 18], fov: 48 }} dpr={[1, 2]}>
      <color attach="background" args={["#010208"]} />
      <fog attach="fog" args={["#010208", 22, 44]} />
      {creativeMode ? (
        <CreativeSpaceContents
          customSpace={customSpace}
          selectedTarget={selectedTarget}
          onSelectTarget={onSelectTarget}
          autoRotate={autoRotate}
          showGuides={showGuides}
          showLabels={showLabels}
          viewMode={viewMode}
          zoomLevel={zoomLevel}
          language={language}
          dictionary={dictionary}
          creativeTool={creativeTool}
          onCreativeSpaceClick={onCreativeSpaceClick}
          onUpdateCustomObject={onUpdateCustomObject}
          editingEnabled={editingEnabled}
        />
      ) : (
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
          atmosphereStrength={atmosphereStrength}
          starGlowStrength={starGlowStrength}
          viewMode={viewMode}
          zoomLevel={zoomLevel}
          focusedConstellation={focusedConstellation}
          trackConstellation={trackConstellation}
          drawMode={drawMode}
          customSketchStarIds={customSketchStarIds}
        />
      )}
    </Canvas>
  );
}

function CreativeSpaceContents({
  customSpace,
  selectedTarget,
  onSelectTarget,
  showGuides,
  showLabels,
  zoomLevel,
  language,
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
      starCount: stars.length,
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
    const targetCameraX = 0;
    const targetCameraY = 0.2;
    const targetCameraZ = -0.05;
    const targetLookX = 0;
    const targetLookY = 0.45;
    const targetLookZ = -12.2;

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 6.2, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, 0, 6.2, delta);
    }

    cameraAnchor.current.x = THREE.MathUtils.damp(cameraAnchor.current.x, targetCameraX, 6.2, delta);
    cameraAnchor.current.y = THREE.MathUtils.damp(cameraAnchor.current.y, targetCameraY, 6.2, delta);
    cameraAnchor.current.z = THREE.MathUtils.damp(cameraAnchor.current.z, targetCameraZ, 6.6, delta);
    lookAnchor.current.x = THREE.MathUtils.damp(lookAnchor.current.x, targetLookX, 6.2, delta);
    lookAnchor.current.y = THREE.MathUtils.damp(lookAnchor.current.y, targetLookY, 6.2, delta);
    lookAnchor.current.z = THREE.MathUtils.damp(lookAnchor.current.z, targetLookZ, 6.6, delta);

    camera.position.x = cameraAnchor.current.x;
    camera.position.y = cameraAnchor.current.y;
    const baseDistance = 15.2;
    const zoomMultiplier = THREE.MathUtils.lerp(1.12, 0.78, zoomLevel);
    camera.position.z = baseDistance * zoomMultiplier + cameraAnchor.current.z;
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
        <CreativeCanvasPlane />
        {showGuides ? <CreativeCanvasGuides /> : null}
        <CreativePlacementPlane creativeTool={creativeTool} onCreativeSpaceClick={onCreativeSpaceClick} editingEnabled={editingEnabled} />
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
          <TextSprite key={label.id} {...label} />
        ))}
      </group>
    </>
  );
}

function CreativeCanvasPlane() {
  return (
    <mesh position={[0, 0, -12.24]}>
      <planeGeometry args={[42, 26]} />
      <meshBasicMaterial color="#020611" transparent opacity={0.42} depthWrite={false} />
    </mesh>
  );
}

function CreativeCanvasGuides() {
  const frame = useMemo(() => {
    const points = [
      -21, -13, -12.18, 21, -13, -12.18,
      21, -13, -12.18, 21, 13, -12.18,
      21, 13, -12.18, -21, 13, -12.18,
      -21, 13, -12.18, -21, -13, -12.18
    ];
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
  atmosphereStrength,
  starGlowStrength,
  viewMode,
  zoomLevel,
  focusedConstellation,
  trackConstellation,
  drawMode,
  customSketchStarIds
}) {
  const groupRef = useRef(null);
  const cameraAnchor = useRef({ x: 0, y: 0, z: 0 });
  const lookAnchor = useRef({ x: 0, y: 1.8, z: -12.8 });
  const rotationAnchor = useRef({ x: 0, y: 0 });
  const trackingBlend = useRef(0);
  const dragState = useRef({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0
  });
  const manualOrbit = useRef({ yaw: 0, pitch: 0 });
  const { camera, pointer, gl } = useThree();
  const spaceMode = viewMode === "space";
  const projectionMode = viewMode === "projection";
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
  const trackedCenter = useMemo(() => {
    if (!trackConstellation || focusedConstellation === "all") {
      return null;
    }
    return constellationCenters.get(focusedConstellation) || null;
  }, [constellationCenters, focusedConstellation, trackConstellation]);
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

  useEffect(() => {
    const element = gl.domElement;

    function handlePointerDown(event) {
      if (viewMode !== "space" || event.button !== 0) {
        return;
      }
      dragState.current.active = true;
      dragState.current.pointerId = event.pointerId;
      dragState.current.lastX = event.clientX;
      dragState.current.lastY = event.clientY;
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // ignore capture failures on unsupported environments
      }
    }

    function handlePointerMove(event) {
      if (!dragState.current.active || dragState.current.pointerId !== event.pointerId || viewMode !== "space") {
        return;
      }
      const deltaX = event.clientX - dragState.current.lastX;
      const deltaY = event.clientY - dragState.current.lastY;
      dragState.current.lastX = event.clientX;
      dragState.current.lastY = event.clientY;

      manualOrbit.current.yaw = THREE.MathUtils.clamp(manualOrbit.current.yaw - deltaX * 0.0065, -2.8, 2.8);
      manualOrbit.current.pitch = THREE.MathUtils.clamp(manualOrbit.current.pitch + deltaY * 0.0055, -1.1, 1.1);
    }

    function endPointerDrag(event) {
      if (dragState.current.pointerId !== event.pointerId) {
        return;
      }
      dragState.current.active = false;
      dragState.current.pointerId = null;
      try {
        element.releasePointerCapture(event.pointerId);
      } catch {
        // ignore capture release failures
      }
    }

    element.addEventListener("pointerdown", handlePointerDown);
    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerup", endPointerDrag);
    element.addEventListener("pointercancel", endPointerDrag);
    element.addEventListener("pointerleave", endPointerDrag);

    return () => {
      element.removeEventListener("pointerdown", handlePointerDown);
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerup", endPointerDrag);
      element.removeEventListener("pointercancel", endPointerDrag);
      element.removeEventListener("pointerleave", endPointerDrag);
    };
  }, [gl, viewMode]);

  useFrame(({ clock }, delta) => {
    const observerMode = viewMode === "observer";
    const driftA = clock.elapsedTime * 0.106;
    const driftB = clock.elapsedTime * 0.068;
    trackingBlend.current = THREE.MathUtils.damp(trackingBlend.current, trackedCenter ? 1 : 0, 3.2, delta);
    const trackWeight = trackingBlend.current;
    const targetTiltX = trackedCenter || projectionMode || observerMode ? 0 : spaceMode ? Math.sin(driftB) * 0.022 + manualOrbit.current.pitch * 0.06 : -pointer.y * 0.01;
    const targetYawDrift = trackedCenter || projectionMode || observerMode ? 0 : spaceMode ? Math.sin(driftA) * 0.028 + manualOrbit.current.yaw * 0.045 : pointer.x * 0.018;
    const baseCameraX = projectionMode
      ? 0
      : spaceMode
        ? Math.sin(driftA) * 0.68 + manualOrbit.current.yaw * 1.15
        : observerMode
          ? pointer.x * 0.04
          : pointer.x * 0.26;
    const baseCameraY = projectionMode
      ? 0
      : spaceMode
        ? Math.cos(driftB) * 0.42 + manualOrbit.current.pitch * 0.82
        : observerMode
          ? pointer.y * 0.02
          : -0.15 + pointer.y * 0.08;
    const targetCameraZ = projectionMode ? -0.65 : spaceMode ? -11.8 + Math.sin(driftA * 0.7) * 0.26 : observerMode ? 0.3 : -0.42;
    const baseLookX = projectionMode ? 0 : spaceMode ? Math.sin(driftA * 0.8) * 2.8 + manualOrbit.current.yaw * 4.2 : observerMode ? pointer.x * 0.2 : pointer.x * 1.45;
    const baseLookY = projectionMode ? 0 : spaceMode ? Math.cos(driftB * 1.15) * 1.05 + manualOrbit.current.pitch * 2.6 : observerMode ? 10.2 + pointer.y * 0.12 : 2.35 + pointer.y * 0.46;
    const baseLookZ = projectionMode ? -13.5 : spaceMode ? 0 : observerMode ? -0.9 : -14.6;
    const targetCameraX = THREE.MathUtils.lerp(baseCameraX, trackedCenter ? trackedCenter.x * (spaceMode ? 0.03 : observerMode ? 0.04 : 0.06) : baseCameraX, trackWeight);
    const targetCameraY = THREE.MathUtils.lerp(baseCameraY, trackedCenter ? baseCameraY + trackedCenter.y * (observerMode ? 0.014 : spaceMode ? 0.02 : 0.028) : baseCameraY, trackWeight);
    const targetLookX = THREE.MathUtils.lerp(baseLookX, trackedCenter ? trackedCenter.x * (spaceMode ? 0.84 : 0.92) : baseLookX, trackWeight);
    const targetLookY = THREE.MathUtils.lerp(baseLookY, trackedCenter ? trackedCenter.y + (spaceMode ? 0.22 : observerMode ? 0.2 : 0.42) : baseLookY, trackWeight);
    const targetLookZ = THREE.MathUtils.lerp(baseLookZ, trackedCenter ? trackedCenter.z * (spaceMode ? 0.84 : 0.94) : baseLookZ, trackWeight);

    if (groupRef.current) {
      if (autoRotate && !trackedCenter && !projectionMode && !observerMode) {
        groupRef.current.rotation.y += delta * (spaceMode ? 0.017 : 0.008);
      }
      rotationAnchor.current.x = THREE.MathUtils.damp(rotationAnchor.current.x, targetTiltX, spaceMode ? 2.35 : observerMode ? 7.5 : 5.4, delta);
      rotationAnchor.current.y = THREE.MathUtils.damp(rotationAnchor.current.y, targetYawDrift, spaceMode ? 2.3 : observerMode ? 7.5 : 4.8, delta);
      groupRef.current.rotation.x = rotationAnchor.current.x;
      groupRef.current.rotation.y += rotationAnchor.current.y * delta;
    }

    cameraAnchor.current.x = THREE.MathUtils.damp(cameraAnchor.current.x, targetCameraX, spaceMode ? 2.35 : observerMode ? 7.8 : 5.1, delta);
    cameraAnchor.current.y = THREE.MathUtils.damp(cameraAnchor.current.y, targetCameraY, spaceMode ? 2.35 : observerMode ? 7.8 : 5.1, delta);
    cameraAnchor.current.z = THREE.MathUtils.damp(cameraAnchor.current.z, targetCameraZ, spaceMode ? 2.55 : observerMode ? 8.1 : 5.4, delta);

    lookAnchor.current.x = THREE.MathUtils.damp(lookAnchor.current.x, targetLookX, spaceMode ? 2.45 : observerMode ? 7.4 : 5.4, delta);
    lookAnchor.current.y = THREE.MathUtils.damp(lookAnchor.current.y, targetLookY, spaceMode ? 2.45 : observerMode ? 7.4 : 5.4, delta);
    lookAnchor.current.z = THREE.MathUtils.damp(lookAnchor.current.z, targetLookZ, spaceMode ? 2.6 : observerMode ? 7.8 : 5.7, delta);

    if (observerMode) {
      const observerLift = trackedCenter ? THREE.MathUtils.lerp(11.2, 7.2, zoomLevel) : THREE.MathUtils.lerp(12.6, 8.6, zoomLevel);
      camera.position.x = cameraAnchor.current.x;
      camera.position.y = -observerLift + cameraAnchor.current.y;
      camera.position.z = 1.35 + cameraAnchor.current.z * 0.12;
    } else {
      camera.position.x = cameraAnchor.current.x;
      camera.position.y = cameraAnchor.current.y;
      const baseDistance = trackedCenter
        ? projectionMode
          ? 16.3
          : spaceMode
            ? 20.6
            : 12.4
        : projectionMode
          ? 14.8
          : spaceMode
            ? 13.7
            : 9.4;
      const zoomMultiplier = spaceMode
        ? THREE.MathUtils.lerp(2.85, 0.46, zoomLevel)
        : THREE.MathUtils.lerp(1.45, 0.7, zoomLevel);
      camera.position.z = baseDistance * zoomMultiplier + cameraAnchor.current.z;
    }
    const targetFov = observerMode
      ? THREE.MathUtils.lerp(92, 62, zoomLevel)
      : projectionMode
        ? THREE.MathUtils.lerp(44, 26, zoomLevel)
        : spaceMode
          ? THREE.MathUtils.lerp(84, 23, zoomLevel)
          : THREE.MathUtils.lerp(58, 30, zoomLevel);
    camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 5.2, delta);
    camera.updateProjectionMatrix();
    camera.lookAt(lookAnchor.current.x, lookAnchor.current.y, lookAnchor.current.z);
  });

  return (
    <>
      <ambientLight intensity={0.38} />
      <pointLight position={[0, 6, 14]} intensity={0.9} color="#b8d2ff" />
      <pointLight position={[-12, -4, -8]} intensity={0.25} color="#ffbf8a" />
      <group ref={groupRef}>
        <MilkyWayBand viewMode={viewMode} />
        <DeepSkyField viewMode={viewMode} atmosphereStrength={atmosphereStrength} />
        {viewMode === "space" ? <SpaceDepthField atmosphereStrength={atmosphereStrength} /> : null}
        <BackgroundStarField
          stars={projectedStars}
          focusedConstellation={focusedConstellation}
          starGlowStrength={starGlowStrength}
          tracking={trackConstellation && focusedConstellation !== "all"}
        />
        {showGuides && !projectionMode && !observerMode ? <GuideGrid /> : null}
        {showGuides && observerMode ? <ObserverGuide dictionary={dictionary} language={language} /> : null}
        {showGuides && projectionMode ? <ProjectionGuide dictionary={dictionary} language={language} /> : null}
        {showGuides && !projectionMode ? <HorizonRing dictionary={dictionary} language={language} /> : null}
        {showConstellations ? (
          <ConstellationLines
            lines={scene.lines}
            stars={projectedStars}
            focusedConstellation={focusedConstellation}
            viewMode={viewMode}
            tracking={trackConstellation && focusedConstellation !== "all"}
          />
        ) : null}
        {customSketchStarIds.length >= 2 ? <CustomSketchLines stars={projectedStars} starIds={customSketchStarIds} viewMode={viewMode} /> : null}
        {spaceMode
          ? featuredStars.map((star) => (
              <PassiveStarGlow
                key={star.id}
                star={star}
                dimmed={focusedConstellation !== "all" && star.constellation !== focusedConstellation}
                sketched={customSketchStarIds.includes(star.id)}
                starGlowStrength={starGlowStrength}
              />
            ))
          : featuredStars.map((star) => (
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

function BackgroundStarField({ stars, focusedConstellation, starGlowStrength = 0.8, tracking = false }) {
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
        uniforms: { time: { value: 0 }, glowStrength: { value: starGlowStrength } },
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

function PassiveStarGlow({ star, dimmed, sketched, starGlowStrength = 0.8 }) {
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

function CreativePlacementPlane({ creativeTool, onCreativeSpaceClick, editingEnabled }) {
  return (
    <mesh
      position={[0, 0, -12.2]}
      onPointerDown={(event) => {
        if (!editingEnabled) {
          return;
        }
        if (creativeTool === "delete") {
          return;
        }
        event.stopPropagation();
        onCreativeSpaceClick?.(event.point);
      }}
    >
      <planeGeometry args={[42, 26]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
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

function StarMarker({ star, selected, onSelectTarget, dimmed, sketched, drawMode }) {
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
      {selected ? (
        <sprite ref={selectionRef} material={selectionMaterial} scale={[radius * 7.4, radius * 7.4, 1]} />
      ) : null}
      <sprite ref={haloRef} material={spriteMaterial} scale={[radius * 6.5, radius * 6.5, 1]} />
      <mesh onClick={() => onSelectTarget({ kind: "star", id: star.id })}>
        <sphereGeometry args={[radius * 1.15, 12, 12]} />
        <meshBasicMaterial color={emissive} toneMapped={false} transparent opacity={Math.max(opacity * 0.035, 0.015)} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ConstellationLines({ lines, stars, focusedConstellation, viewMode, tracking = false }) {
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

function clampStarSize(magnitude) {
  return Math.max(1.2, 5.2 - magnitude * 0.58);
}

function projectSkyPosition(star, viewMode) {
  const az = (star.azimuth * Math.PI) / 180;
  const altitudeRatio = Math.max(0, star.altitude) / 90;
  const azWrapped = Math.atan2(Math.sin(az), Math.cos(az));
  const seed = Number.parseInt(String(star.id).replace(/\D/g, "").slice(-4) || "11", 10);
  let x;
  let y;
  let z;

  if (viewMode === "space") {
    const radius = 20.8 + Math.max(0, 4.6 - star.magnitude) * 0.42 + ((seed % 19) - 9) * 0.14;
    const elevation = (altitudeRatio - 0.5) * Math.PI * 1.28;
    const direction = new THREE.Vector3(
      Math.sin(azWrapped) * Math.cos(elevation),
      Math.sin(elevation),
      -Math.cos(azWrapped) * Math.cos(elevation)
    ).normalize();
    const swirlX = Math.sin(seed * 0.73) * 0.58;
    const swirlY = Math.cos(seed * 1.11) * 0.36;
    const swirlZ = Math.sin(seed * 0.37) * 0.58;
    x = direction.x * radius * 1.05 + swirlX;
    y = direction.y * radius * 1.02 + swirlY;
    z = direction.z * radius * 0.88 + swirlZ;
  } else if (viewMode === "projection") {
    const zenithDistance = (90 - Math.max(0, star.altitude)) / 90;
    const domeRadius = THREE.MathUtils.lerp(0.35, 11.6, zenithDistance);
    x = Math.sin(azWrapped) * domeRadius;
    y = Math.cos(azWrapped) * domeRadius;
    z = -13.4 + altitudeRatio * 0.35;
  } else if (viewMode === "panorama") {
    const horizontalRatio = azWrapped / Math.PI;
    const horizonSpread = 22.5;
    const altitudeLift = Math.pow(altitudeRatio, 0.72);
    const edgeFalloff = Math.pow(Math.abs(horizontalRatio), 1.35);
    x = horizontalRatio * horizonSpread;
    y = -1.3 + altitudeLift * 11.6 + (1 - edgeFalloff) * 0.9;
    z = -13.8 - edgeFalloff * 4.8 - (1 - altitudeLift) * 1.2;
  } else {
    const altitude = altitudeRatio * Math.PI * 0.5;
    const domeRadius = 13.6 + Math.max(0, 4.8 - star.magnitude) * 0.1;
    const horizonSpread = THREE.MathUtils.lerp(1.18, 0.62, altitudeRatio);
    x = Math.sin(azWrapped) * Math.cos(altitude) * domeRadius * horizonSpread;
    y = Math.sin(altitude) * domeRadius * 1.08;
    z = -Math.cos(azWrapped) * Math.cos(altitude) * domeRadius * THREE.MathUtils.lerp(1.22, 0.54, altitudeRatio) - altitudeRatio * 0.75;
  }

  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    z: Number(z.toFixed(4))
  };
}

function ProjectionGuide({ dictionary, language }) {
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

function ObserverGuide({ dictionary, language }) {
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

function SpaceDepthField({ atmosphereStrength = 0.7 }) {
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

function MilkyWayBand({ viewMode = "space", atmosphereStrength = 0.7 }) {
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

function DeepSkyField({ viewMode = "space", atmosphereStrength = 0.7 }) {
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
