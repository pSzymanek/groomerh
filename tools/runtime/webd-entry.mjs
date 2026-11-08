// groomerhouse-canonical-entry-v1: keep the existing WEBD startup path unchanged.
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import { canonicalRedirect } from "./canonical-host.mjs";

const autostart = process.env.ASTRO_NODE_AUTOSTART;
process.env.ASTRO_NODE_AUTOSTART = "disabled";
let astro;
try {
  astro = await import("./astro-entry.mjs");
} finally {
  if (autostart === undefined) delete process.env.ASTRO_NODE_AUTOSTART;
  else process.env.ASTRO_NODE_AUTOSTART = autostart;
}

export const options = astro.options;
export function handler(request, response) {
  let redirect;
  try {
    redirect = canonicalRedirect(request);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request.");
    return;
  }
  if (redirect) {
    response.writeHead(redirect.status, {
      Location: redirect.location,
      "Cache-Control": redirect.status === 301 ? "public, max-age=300" : "no-store",
    });
    response.end();
    return;
  }
  return astro.handler(request, response);
}

export function startServer() {
  const host = process.env.HOST ?? (typeof options.host === "string" ? options.host : options.host ? "0.0.0.0" : "localhost");
  const port = Number(process.env.PORT ?? options.port ?? 8080);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid PORT");
  const server = process.env.SERVER_CERT_PATH && process.env.SERVER_KEY_PATH
    ? https.createServer({ key: fs.readFileSync(process.env.SERVER_KEY_PATH), cert: fs.readFileSync(process.env.SERVER_CERT_PATH) }, handler)
    : http.createServer(handler);
  server.listen(port, host, () => {
    if (process.env.ASTRO_NODE_LOGGING !== "disabled") console.log(`Groomer House listening on ${host}:${server.address().port}`);
  });
  return server;
}

if (autostart !== "disabled") startServer();
