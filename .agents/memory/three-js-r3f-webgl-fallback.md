---
name: React Three Fiber Canvas needs a WebGL capability check before mount
description: Headless/screenshot browsers and some sandboxed environments can't create a WebGL context; mounting <Canvas> unconditionally throws an uncaught window error that trips Vite's error overlay even though the app's own React error boundary is in place
---

`@react-three/fiber`'s `<Canvas>` calls `new THREE.WebGLRenderer()` synchronously on mount. In environments without GPU access (e.g. this workspace's headless screenshot tool), that throw happens on `window`, and Vite's `runtime-error-plugin` shows its full-page dev overlay for it — a React error boundary around `<Canvas>` still works for the app UI, but does not stop the overlay.

**Why:** avoids both the crash risk and the disruptive dev-overlay in any sandboxed/no-GPU preview context, while keeping the real (GPU-enabled) user experience unaffected.

**How to apply:** before rendering `<Canvas>`, feature-detect via a throwaway `canvas.getContext('webgl2'|'webgl'|'experimental-webgl')` in a `useEffect`, and render a static CSS/image fallback when unsupported. Keep an error boundary around `<Canvas>` as defense in depth. Also prefer self-hosted texture assets (e.g. generated via image-gen and imported) over external CDN texture URLs — `raw.githubusercontent.com/mrdoob/three.js/...` paths for planet textures are unreliable/404 in this environment.
