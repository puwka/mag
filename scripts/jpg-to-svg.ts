import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const src = resolve(process.cwd(), process.argv[2] || "photo_2026-09-02_01-07-44.jpg");
const dest = resolve(process.cwd(), process.argv[3] || "public/icons/glove-hand.svg");
const buf = readFileSync(src);
const b64 = buf.toString("base64");
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="HBtex">
  <image href="data:image/jpeg;base64,${b64}" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
mkdirSync(resolve(dest, ".."), { recursive: true });
writeFileSync(dest, svg);
console.log(`Wrote ${dest} (${buf.length} bytes source)`);
