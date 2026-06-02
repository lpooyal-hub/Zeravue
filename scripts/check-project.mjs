import { access, readdir } from "node:fs/promises";

const required = [
  "index.html",
  "src/main.jsx",
  "src/App.jsx",
  "src/astro/observability.js",
  "src/api/backend.js",
  "src/data/i18n.js",
  "src/data/planets.js",
  "src/data/zodiac.js",
  "src/scene/starfield.js",
  "src/styles.css",
  "backend/app/main.py",
  "backend/app/routers/sky.py",
  "backend/app/services/observability.py"
];

await Promise.all(required.map((file) => access(file)));
const srcFiles = await readdir("src", { recursive: true });

console.log(`Project check passed. ${srcFiles.length} source entries found.`);
