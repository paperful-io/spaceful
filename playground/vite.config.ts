import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Use the library sources directly so edits show up without a rebuild.
      spaceful: fileURLToPath(new URL("../src/index.ts", import.meta.url)),
    },
  },
  server: {
    fs: { allow: [".."] },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "./",
      prerender: { enabled: true, crawlLinks: true },
    }),
    viteReact(),
  ],
});

export default config;
