# Star Theme Roadmap

## Goal

Finish the night-sky theme to a level where it feels polished, consistent, and reusable as the base theme for the wider healing panorama product.

## Current Strengths

- multilingual UI
- several viewing modes
- constellation highlighting
- constellation tracking
- observer-based sky calculation
- sketch mode foundation
- CI/CD and direct server deployment flow

## Current Gaps

- ambient playback UX is still unreliable
- observer mode still needs stronger clarity
- time changes should feel more visible in observer mode
- favorites are not implemented yet
- sketch mode can be richer and more intuitive
- some controls still feel split across panels

## Priority Order

### Stage 1: Viewing Quality

- [ ] make observer mode clearly different from space mode
- [ ] improve the sense of sky movement across time
- [ ] refine skyline, zenith, and altitude reading
- [ ] keep camera motion gentle and non-dizzy

### Stage 2: Constellation UX

- [x] searchable constellation selection
- [x] quick clear selection action
- [x] clickable constellations-in-frame list
- [x] softer tracking camera
- [ ] favorites for constellations
- [ ] better active-state storytelling around a focused constellation

### Stage 3: Sketch Mode

- [x] import finished constellations into sketch mode
- [x] move, scale, spread, tighten, and rotate imported constellations
- [x] duplicate a constellation
- [x] drag individual stars directly
- [x] save favorite sketch layouts
- [x] make custom constellations easier to rename and curate

### Stage 4: Ambience

- [ ] replace fragile autoplay expectations with a dependable first-interaction start flow
- [ ] clarify playback state in the interface
- [ ] decide whether Web Audio stays or a looped audio asset replaces it

### Stage 5: Final Theme Polish

- [ ] refine overlay hierarchy
- [ ] reduce any remaining clutter
- [ ] tune colors, type, and panel density
- [ ] define the final “restful night-sky” experience standard

## Implementation Notes

The star theme should not become overloaded with educational data.

Useful information is welcome, but the scene should remain emotionally readable first.

When decisions are unclear, prefer:

- calmer motion
- fewer controls
- clearer focus
- stronger mood

## Release Guideline

Meaningful star-theme improvements should continue to be committed and pushed to the `dev` branch in small, understandable steps.

Suggested rhythm:

1. implement one meaningful improvement
2. verify locally
3. commit
4. push to `dev`
5. continue to the next step
