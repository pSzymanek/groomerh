import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || "https://groomerhouse.pl",
  output: "server",
  compressHTML: true,
  adapter: node({ mode: "standalone" }),
  server: { host: "127.0.0.1", port: 4321 },
});
