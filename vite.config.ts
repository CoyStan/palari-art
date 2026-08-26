import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig(({ mode }) => {
  const pagesBuild = mode === "pages";
  const input = {
    editor: path.join(repositoryRoot, "index.html"),
    handbook: path.join(repositoryRoot, "handbook/index.html"),
    v2: path.join(repositoryRoot, "v2/index.html"),
    v3: path.join(repositoryRoot, "v3/index.html"),
    ...(!pagesBuild && { threeReview: path.join(repositoryRoot, "3d/index.html") }),
  };
  return {
    base: pagesBuild ? "/palari-art/" : "/",
    plugins: [react()],
    publicDir: pagesBuild ? false : "public",
    build: {
      rollupOptions: {
        input,
      },
    },
    server: {
      port: 4173,
    },
  };
});
