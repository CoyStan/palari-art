import { access, cp, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(repositoryRoot, "public");
const distRoot = path.join(repositoryRoot, "dist");

await access(path.join(distRoot, "index.html"));
await mkdir(distRoot, { recursive: true });
await Promise.all([
  cp(path.join(publicRoot, "avatars-web"), path.join(distRoot, "avatars-web"), { recursive: true }),
  cp(path.join(publicRoot, "masks-web"), path.join(distRoot, "masks-web"), { recursive: true }),
]);
await writeFile(path.join(distRoot, ".nojekyll"), "");

console.log("Prepared the GitHub Pages artifact from browser-only WebP delivery assets.");
