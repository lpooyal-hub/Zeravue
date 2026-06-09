import { VIEW_MODE_ORDER } from "./viewerState.js";

const HIDDEN_VIEW_MODES = new Set(["projection"]);

export function getThemeHeaderCopy({ currentThemeId, language, dictionary }) {
  if (currentThemeId === "aurora-night") {
    return {
      eyebrow: "Zeravue · Aurora Night",
      title: language === "ko" ? "오로라의 흐름을 천천히 바라보는 공간입니다." : "A quiet space to watch the aurora drift.",
      subtitle: ""
    };
  }

  if (currentThemeId === "monsoon-canopy") {
    return {
      eyebrow: "Zeravue · Monsoon Canopy",
      title: language === "ko" ? "짙은 캐노피 아래에서 빗소리를 천천히 바라보는 공간입니다." : "A quiet space beneath a dense monsoon canopy.",
      subtitle:
        language === "ko"
          ? "빗줄기와 안개, 젖은 잎사귀의 흐름에 천천히 감각을 맡겨보세요."
          : "Settle into heavy rain, mist, and wet leaves without urgency."
    };
  }

  if (currentThemeId === "rain-window") {
    return {
      eyebrow: "Zeravue · Rain Window",
      title: language === "ko" ? "비가 흐르는 창가에 잠시 머무는 공간입니다." : "A calm window scene with slow rain and night light.",
      subtitle: language === "ko" ? "조용한 빗소리와 함께 호흡을 천천히 맞춰보세요." : "Settle into gentle rain sound and a slower pace."
    };
  }

  return {
    eyebrow: dictionary.viewer.eyebrow,
    title: dictionary.viewer.title,
    subtitle: dictionary.viewer.subtitle
  };
}

export function getThemeViewModes(currentTheme) {
  const supported = Array.isArray(currentTheme?.viewModes) && currentTheme.viewModes.length ? currentTheme.viewModes : VIEW_MODE_ORDER;
  return VIEW_MODE_ORDER.filter((mode) => supported.includes(mode) && !HIDDEN_VIEW_MODES.has(mode));
}
