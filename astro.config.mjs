import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://groomerh.vercel.app",
  output: "server",
  compressHTML: true,
  adapter: vercel({
    includeFiles: ["./archive"],
  }),
  server: { host: "127.0.0.1", port: 4321 },
});
