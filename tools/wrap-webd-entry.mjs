import { copyFile, readFile, rename } from "node:fs/promises";

// Run after a successful standalone Astro build, never against a live server.
const entry = new URL("../dist/server/entry.mjs", import.meta.url);
const original = new URL("../dist/server/astro-entry.mjs", import.meta.url);
const source = await readFile(entry, "utf8");
if (source.includes("groomerhouse-canonical-entry-v1")) throw new Error("WEBD entry is already wrapped; rebuild Astro first.");
if (!source.includes("startServer") || !source.includes("ASTRO_NODE_AUTOSTART")) throw new Error("Unexpected Astro Node entry; do not package.");
await rename(entry, original);
await copyFile(new URL("./runtime/canonical-host.mjs", import.meta.url), new URL("../dist/server/canonical-host.mjs", import.meta.url));
await copyFile(new URL("./runtime/webd-entry.mjs", import.meta.url), entry);
console.log("WEBD canonical redirect installed before static and SSR routes; startup path unchanged.");
