import * as THREE from "three";

export function pushLinePath(points, from, to, curved) {
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

export function quadraticPoint(start, control, end, t) {
  const oneMinusT = 1 - t;
  return new THREE.Vector3(
    oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x,
    oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y,
    oneMinusT * oneMinusT * start.z + 2 * oneMinusT * t * control.z + t * t * end.z
  );
}

export function buildConstellationCenters(stars) {
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

export function clampStarSize(magnitude) {
  return Math.max(1.2, 5.2 - magnitude * 0.58);
}

export function projectSkyPosition(star, viewMode) {
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
    const direction = new THREE.Vector3(Math.sin(azWrapped) * Math.cos(elevation), Math.sin(elevation), -Math.cos(azWrapped) * Math.cos(elevation)).normalize();
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
