import { config } from "../config.js";
import { calculateVisibleZodiac } from "../astro/observability.js";

export async function getVisibleZodiac({ latitude, longitude, signs }) {
  try {
    const response = await fetch(`${config.apiBaseUrl}/api/sky/visible`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        latitude,
        longitude,
        signs: signs.map(({ id, raHours, decDegrees }) => ({ id, raHours, decDegrees }))
      })
    });

    if (!response.ok) {
      throw new Error(`Backend sky request failed with ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("Falling back to client-side sky calculation:", error);
    return calculateVisibleZodiac({ latitude, longitude, signs });
  }
}

export async function getSkyScene({ latitude, longitude, observedAt, limitingMagnitude, maxStars }) {
  const response = await fetch(`${config.apiBaseUrl}/api/sky/scene`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      latitude,
      longitude,
      observedAt,
      limitingMagnitude,
      maxStars
    })
  });

  if (!response.ok) {
    throw new Error(`Backend sky scene request failed with ${response.status}`);
  }

  return response.json();
}
