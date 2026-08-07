import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const pagesBuild = mode === "pages";
  return {
    base: pagesBuild ? "/palari-art/" : "/",
    plugins: [react()],
    publicDir: pagesBuild ? false : "public",
    server: {
      port: 4173,
    },
  };
});
