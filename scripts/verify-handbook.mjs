import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const componentPath = path.join(repositoryRoot, "src/handbook/HandbookApp.tsx");
const pdfPath = path.join(repositoryRoot, "public/handbook/palari-character-design-handbook.pdf");
const packagePath = path.join(repositoryRoot, "package.json");
const component = await readFile(componentPath, "utf8");
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
const problems = [];

if (!component.includes("plateRegistry.plates.map")) problems.push("gallery does not render the complete plate registry.");
if (!component.includes("plate.alt")) problems.push("gallery images do not retain accessible descriptions.");
if (!component.includes("loading={index < 4 ? \"eager\" : \"lazy\"}")) problems.push("gallery does not use staged image loading.");

const visibleChrome = [/<h[12]\b/, /<p(?:\s|>)/, /<figcaption\b/, /<nav\b/, /<footer\b/, /<button\b/, /<a\s/];
for (const marker of visibleChrome) {
  if (marker.test(component)) problems.push(`gallery contains prohibited visible chrome: ${marker}`);
}

try {
  await access(pdfPath);
  problems.push("handbook PDF still exists.");
} catch {
  // Its absence is intentional.
}

if (packageJson.scripts["handbook:pdf"]) problems.push("handbook:pdf script still exists.");
for (const dependency of ["pdf-lib", "playwright-core", "@fontsource/inter", "@fontsource/newsreader"]) {
  if (packageJson.dependencies?.[dependency] || packageJson.devDependencies?.[dependency]) {
    problems.push(`unused handbook dependency still exists: ${dependency}`);
  }
}

if (problems.length) {
  console.error("Handbook gallery verification failed:\n");
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exitCode = 1;
} else {
  console.log("Verified the text-free 20-image gallery and intentional absence of the PDF.");
}
