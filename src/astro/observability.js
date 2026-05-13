const degreeToRadian = Math.PI / 180;
const radianToDegree = 180 / Math.PI;
const minTrigDenominator = 1e-12;

export function calculateVisibleZodiac({ latitude, longitude, signs, date = new Date() }) {
  const localSiderealHours = getLocalSiderealTime(date, longitude);

  return signs
    .map((sign) => {
      const hourAngleDegrees = normalizeDegrees((localSiderealHours - sign.raHours) * 15);
      const signedHourAngle = hourAngleDegrees > 180 ? hourAngleDegrees - 360 : hourAngleDegrees;
      const altitude = getAltitude(latitude, sign.decDegrees, signedHourAngle);
      const azimuth = getAzimuth(latitude, sign.decDegrees, signedHourAngle, altitude);

      return {
        id: sign.id,
        altitude: Math.round(altitude),
        azimuth: Math.round(azimuth),
        direction: getCompassDirection(azimuth),
        visible: altitude > 8,
        quality: getViewingQuality(altitude)
      };
    })
    .sort((a, b) => b.altitude - a.altitude);
}

function getLocalSiderealTime(date, longitude) {
  const julianDate = date.getTime() / 86400000 + 2440587.5;
  const daysSinceJ2000 = julianDate - 2451545.0;
  const greenwichSiderealDegrees = 280.46061837 + 360.98564736629 * daysSinceJ2000;
  return normalizeDegrees(greenwichSiderealDegrees + longitude) / 15;
}

function getAltitude(latitude, declination, hourAngle) {
  const lat = latitude * degreeToRadian;
  const dec = declination * degreeToRadian;
  const ha = hourAngle * degreeToRadian;
  const sinAltitude = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const clamped = Math.max(-1, Math.min(1, sinAltitude));

  return Math.asin(clamped) * radianToDegree;
}

function getAzimuth(latitude, declination, hourAngle, altitude) {
  const lat = latitude * degreeToRadian;
  const dec = declination * degreeToRadian;
  const ha = hourAngle * degreeToRadian;
  const alt = altitude * degreeToRadian;
  const denominator = Math.cos(alt) * Math.cos(lat);

  if (Math.abs(denominator) < minTrigDenominator) {
    return 0;
  }

  const cosAzimuth = (Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / denominator;
  const clamped = Math.max(-1, Math.min(1, cosAzimuth));
  let azimuth = Math.acos(clamped) * radianToDegree;

  if (Math.sin(ha) > 0) {
    azimuth = 360 - azimuth;
  }

  return normalizeDegrees(azimuth);
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function getCompassDirection(azimuth) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(azimuth / 45) % 8];
}

function getViewingQuality(altitude) {
  if (altitude >= 55) {
    return "excellent";
  }

  if (altitude >= 30) {
    return "good";
  }

  if (altitude >= 8) {
    return "low";
  }

  return "below";
}
