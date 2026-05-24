import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  HorizonRing as HorizonRingView,
  ObserverGuide as ObserverGuideView,
  ProjectionGuide as ProjectionGuideView,
  GuideGrid as GuideGridView,
  TextSprite as TextSpriteView
} from "./canvas/ViewerGuides.jsx";
import {
  AuroraCurtains as AuroraCurtainsView,
  AuroraHorizonSilhouette as AuroraHorizonSilhouetteView,
  AuroraSkyBackdrop as AuroraSkyBackdropView,
  DeepSkyField as DeepSkyFieldView,
  MilkyWayBand as MilkyWayBandView,
  SpaceDepthField as SpaceDepthFieldView
} from "./canvas/SkyAtmosphere.jsx";
import { BackgroundStarField, ConstellationLines, CustomSketchLines, PassiveStarGlow, StarMarker } from "./canvas/StarLayers.jsx";
import { buildConstellationCenters, projectSkyPosition } from "./canvas/starMath.js";
import { CreativeSpaceScene } from "./canvas/CreativeSpaceScene.jsx";

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
  editingEnabled = true,
  resetViewToken = 0,
  auroraEnabled = false,
  auroraIntensity = 0.72,
  auroraSpeed = 0.55
}) {
  if (!scene && !creativeMode) {
    return <div className="scene-empty">{dictionary.viewer.loading}</div>;
  }

  return (
    <Canvas camera={{ position: [0, 0, 18], fov: 48 }} dpr={[1, 2]}>
      <color attach="background" args={["#010208"]} />
      <fog attach="fog" args={["#010208", 22, 44]} />
      {creativeMode ? (
        <CreativeSpaceScene
          customSpace={customSpace}
          selectedTarget={selectedTarget}
          onSelectTarget={onSelectTarget}
          showGuides={showGuides}
          showLabels={showLabels}
          zoomLevel={zoomLevel}
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
          resetViewToken={resetViewToken}
          auroraEnabled={auroraEnabled}
          auroraIntensity={auroraIntensity}
          auroraSpeed={auroraSpeed}
        />
      )}
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
  atmosphereStrength,
  starGlowStrength,
  viewMode,
  zoomLevel,
  focusedConstellation,
  trackConstellation,
  drawMode,
  customSketchStarIds,
  resetViewToken,
  auroraEnabled,
  auroraIntensity,
  auroraSpeed
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
    cameraAnchor.current = { x: 0, y: 0, z: 0 };
    lookAnchor.current = { x: 0, y: 1.8, z: -12.8 };
    rotationAnchor.current = { x: 0, y: 0 };
    trackingBlend.current = 0;
    manualOrbit.current = { yaw: 0, pitch: 0 };
  }, [resetViewToken]);

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
        {auroraEnabled ? (
          <>
            <AuroraSkyBackdropView intensity={auroraIntensity} />
            <DeepSkyFieldView viewMode={viewMode} atmosphereStrength={Math.max(0.2, atmosphereStrength * 0.48)} />
            <AuroraCurtainsView intensity={auroraIntensity} speed={auroraSpeed} />
            <AuroraHorizonSilhouetteView />
          </>
        ) : (
          <>
            <MilkyWayBandView viewMode={viewMode} />
            <DeepSkyFieldView viewMode={viewMode} atmosphereStrength={atmosphereStrength} />
            {viewMode === "space" ? <SpaceDepthFieldView atmosphereStrength={atmosphereStrength} /> : null}
          </>
        )}
        <BackgroundStarField
          stars={projectedStars}
          focusedConstellation={focusedConstellation}
          starGlowStrength={starGlowStrength}
          tracking={trackConstellation && focusedConstellation !== "all"}
        />
        {showGuides && !projectionMode && !observerMode ? <GuideGridView /> : null}
        {showGuides && observerMode ? <ObserverGuideView dictionary={dictionary} language={language} /> : null}
        {showGuides && projectionMode ? <ProjectionGuideView dictionary={dictionary} language={language} /> : null}
        {showGuides && !projectionMode ? <HorizonRingView dictionary={dictionary} language={language} /> : null}
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
          <TextSpriteView key={label.id} {...label} />
        ))}
        {labelData.constellationLabels.map((label) => (
          <TextSpriteView key={label.id} {...label} />
        ))}
      </group>
    </>
  );
}
