import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(repositoryRoot, "docs/palari-v3/vectors");
const outputRoot = path.join(repositoryRoot, "docs/palari-v3/icons");
const ids = Array.from({ length: 6 }, (_, index) => `palari-v3-${String(index + 19).padStart(3, "0")}`);

function run(command, arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, arguments_, {
      cwd: repositoryRoot,
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}: ${stderr.trim()}`));
    });
  });
}

await mkdir(outputRoot, { recursive: true });
for (const id of ids) {
  await run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-nostdin", "-y",
    "-i",
    path.join(sourceRoot, `${id}.svg`),
    "-frames:v", "1",
    "-vf", "scale=1254:1254:flags=lanczos,format=rgb24",
    path.join(outputRoot, `${id}.png`),
  ]);
}

console.log(`Rendered ${ids.length} flat-first Palari V3 masters at 1254 x 1254.`);
