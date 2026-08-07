import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig(({ mode }) => {
  const pagesBuild = mode === "pages";
  return {
    base: pagesBuild ? "/palari-art/" : "/",
    plugins: [react()],
    publicDir: pagesBuild ? false : "public",
    build: {
      rollupOptions: {
        input: {
          editor: path.join(repositoryRoot, "index.html"),
          handbook: path.join(repositoryRoot, "handbook/index.html"),
        },
      },
    },
    server: {
      port: 4173,
    },
  };
});
