# Theme Architecture Design

## Vision

Build a flexible, reusable theme system where each healing panorama (night sky, aurora, underwater, rainforest, clouds) shares:
- Common viewer structure
- Shared interaction patterns
- Unified control system
- Consistent brand experience

Each theme can have:
- Unique visual aesthetic
- Custom canvas components
- Theme-specific data sources
- Custom audio/ambient design

## Architecture Overview

```
Planetarium App
├── Theme Context (current active theme)
├── App (theme-aware state orchestrator)
├── PlanetariumCanvas (theme-agnostic renderer)
└── Theme System
    ├── nightSky (current)
    ├── auroraKnight (future)
    ├── underwater (future)
    └── rainforest (future)
```

## Theme Configuration Structure

Each theme provides a configuration object:

```js
{
  // Identity
  id: "night-sky",
  name: "Night Sky",
  displayName: { en: "Night Sky", ko: "밤하늘" },
  subtitle: { en: "Quiet observation of the stars", ko: "별의 조용한 관찰" },
  description: { en: "...", ko: "..." },
  
  // Visual
  colors: {
    background: "#010208",
    horizon: "#ffcf70",
    zenith: "#fff2b3",
    atmosphereLight: "#b8d2ff",
    atmosphereDark: "#ffbf8a"
  },
  
  // Controls & Modes
  viewModes: ["space", "observer", "panorama", "projection"],
  controlConfig: {
    showLatLongControls: true,
    showTimeControls: true,
    showObserverModeUI: true
  },
  
  // Data & Backend
  dataSource: "sky",  // or "aurora", "underwater", etc.
  ambientTrack: "url_or_env_var",
  
  // Canvas Components
  components: {
    background: MilkyWayBand,      // or AuroraGlow, WaterBubbles, etc.
    deepSkyField: DeepSkyField,
    guide: ObserverGuide,          // or AuroraGuide, etc.
    particles: BackgroundStarField  // or FloatingParticles, etc.
  },
  
  // UI Strings (can reference i18n)
  strings: {
    controlsLabel: "viewer.controls",
    viewModeLabel: "viewer.viewModeLabel",
    observerModeCard: "viewer.observerModeCard"
  }
}
```

## Implementation Phases

### Phase 1: Refactor Night Sky (Current)
- Extract night-sky config into `src/data/themes/nightSky.config.js`
- Create `src/hooks/useTheme.js`
- Create `src/context/ThemeContext.jsx`
- Update App.jsx to use theme config

### Phase 2: Add Theme Switching UI
- Create theme switcher in topbar or sidebar
- Implement theme selector component
- Add smooth transition between themes

### Phase 3: Prepare Aurora Theme
- Define aurora config structure
- Create aurora-specific canvas components
- Implement aurora sky calculation backend

### Phase 4: Future Themes
- Underwater panorama
- Rainforest in rain
- Cloud panorama

## File Structure (Target)

```
src/
├── data/
│   └── themes/
│       ├── nightSky.config.js
│       ├── auroraKnight.config.js (future)
│       ├── underwater.config.js (future)
│       └── themeRegistry.js
├── context/
│   └── ThemeContext.jsx
├── hooks/
│   └── useTheme.js
├── components/
│   ├── PlanetariumCanvas.jsx (theme-agnostic)
│   ├── ThemeSwitcher.jsx
│   └── themes/
│       ├── nightSky/
│       │   ├── NightSkyGuide.jsx
│       │   ├── NightSkyBackground.jsx
│       │   └── NightSkyControls.jsx
│       └── auroraKnight/ (future)
└── App.jsx (theme-aware)
```

## Shared Concepts

### Viewer Layout (All Themes)
```
┌────────────────────┐
│     topbar         │
├─────────┬──────────┤
│ control │          │
│ panel   │ canvas   │
│         │ (theme   │
│         │ specific)│
└─────────┴──────────┘
```

### Interaction Patterns (All Themes)
- **Fullscreen**: Escape modal, full canvas view
- **Selection**: Click to select object, show info card
- **Favorites**: Star/constellation/feature favorites
- **View Modes**: Switch between viewing perspectives
- **Ambient**: Audio playback toggle

### Data Patterns (All Themes)
- **Observer location**: Latitude, longitude
- **Observed time**: DateTime for visibility calculations
- **Limiting magnitude** (Sky) or **Intensity** (Aurora, etc.)
- **Favorites**: User-saved selections

## API Contracts

### Theme Config API
```js
// Get theme config
import { nightSkyTheme } from '@/data/themes/nightSky.config.js'
const theme = nightSkyTheme

// All themes implement:
theme.id
theme.displayName
theme.viewModes
theme.colors
theme.components
theme.dataSource
```

### useTheme Hook
```js
const { theme, setTheme, themes } = useTheme()
// theme: current theme config
// setTheme(id): switch to theme by id
// themes: array of all available themes
```

### Theme Context
```jsx
<ThemeProvider themes={[nightSkyTheme, ...]}>
  <App />
</ThemeProvider>
```

## Migration Strategy

1. **Extract current nightSky config** (non-breaking)
   - Move viewMode, colorConfig, etc. to theme config
   - App still works the same

2. **Add ThemeContext** (non-breaking)
   - Provide nightSky as default
   - App still works

3. **Add theme switcher UI** (ready for expansion)
   - Users can switch themes
   - Each theme uses same control panel structure

4. **Add aurora components** (when ready)
   - Reuse theme system
   - No App refactor needed

## Open Questions

1. **State Management**: Should theme state live in App or Context?
   - Current: App is state orchestrator
   - Proposal: Keep App as orchestrator, use Context for theme metadata only

2. **Theming Libraries**: Use CSS-in-JS, CSS vars, or Tailwind?
   - Current: CSS files
   - Proposal: Keep CSS, theme config provides color variables

3. **Backend Abstraction**: How to handle different data sources?
   - Current: Sky data only
   - Proposal: Create data adapters (SkyDataAdapter, AuroraDataAdapter, etc.)

4. **Canvas Components**: How to keep them theme-agnostic?
   - Use render props or component slots
   - Pass theme-specific shaders/materials

## Next Steps

1. Create `nightSky.config.js` extracting current values
2. Create `ThemeContext.jsx` and `useTheme.js`
3. Update `App.jsx` to consume theme config
4. Test that night-sky theme works as before
5. Design aurora theme config (without implementation yet)
6. Document theme contribution guidelines
