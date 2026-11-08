import assert from "node:assert/strict";
import http from "node:http";
import { canonicalRedirect } from "./runtime/canonical-host.mjs";

const base = new URL(process.argv[2] || "http://127.0.0.1:4399");
assert.ok(["127.0.0.1", "localhost"].includes(base.hostname), "Only a local test server is allowed");
let checks = 0;
function equal(actual, expected, label) { assert.equal(actual, expected, label); checks++; }
const sample = (host, url = "/rezerwacja/?pakiet=2&utm_source=p24", extra = {}) => ({ headers: { host, ...extra }, url, method: "GET" });
for (const host of ["www.groomerhouse.pl", "WWW.GROOMERHOUSE.PL", "www.groomerhouse.pl:443", "www.groomerhouse.pl:80"]) {
  equal(canonicalRedirect(sample(host)).location, "https://groomerhouse.pl/rezerwacja/?pakiet=2&utm_source=p24", `Exact destination ${host}`);
  equal(canonicalRedirect(sample(host)).status, 301, `Permanent GET ${host}`);
}
for (const host of ["groomerhouse.pl", "localhost:4399", "wp.groomerhouse.pl", "www.groomerhouse.pl.evil.example", "evil.example", "www.groomerhouse.pl@evil.example", "www.groomerhouse.pl:9999"]) {
  equal(canonicalRedirect(sample(host)), null, `No redirect for ${host}`);
}
equal(canonicalRedirect(sample("127.0.0.1", "/blog/", { "x-forwarded-host": "www.groomerhouse.pl, internal-proxy" })).location, "https://groomerhouse.pl/blog/", "Hosting proxy alias");
equal(canonicalRedirect(sample("127.0.0.1", "/blog/", { "x-forwarded-host": "evil.example" })), null, "No arbitrary forwarded authority");
equal(canonicalRedirect(sample("www.groomerhouse.pl", "//evil.example/path?q=1")).location, "https://groomerhouse.pl//evil.example/path?q=1", "Double slash cannot change authority");
equal(canonicalRedirect(sample("www.groomerhouse.pl", "/kurs/%C5%82apy/?x=a%2Bb&x=2")).location, "https://groomerhouse.pl/kurs/%C5%82apy/?x=a%2Bb&x=2", "Encoded path and repeated query preserved");
for (const method of ["POST", "PUT", "PATCH", "DELETE"]) equal(canonicalRedirect({ ...sample("www.groomerhouse.pl"), method }).status, 308, `Preserve method ${method}`);
for (const target of ["https://evil.example/", "/bad\r\nLocation:bad", "/has space"]) {
  assert.throws(() => canonicalRedirect(sample("www.groomerhouse.pl", target)), /Invalid request target/);
  checks++;
}

function request(path, headers, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: base.hostname, port: base.port, path, method, headers, timeout: 20000 }, res => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location }));
    });
    req.on("timeout", () => req.destroy(new Error("Local request timed out")));
    req.on("error", reject);
    req.end();
  });
}
// Includes prerendered HTML, SSR, assets, missing routes and query strings.
for (const route of ["/", "/rezerwacja/", "/regulamin/", "/polityka-prywatnosci/", "/dane-kontaktowe/", "/blog/", "/sitemap.xml", "/robots.txt", "/googlec1a70dd1837c7567.html", "/nie-istnieje/", "/rezerwacja/?pakiet=2&utm_source=p24", "//evil.example/path?q=1"]) {
  for (const headers of [{ host: "www.groomerhouse.pl" }, { host: `127.0.0.1:${base.port}`, "x-forwarded-host": "www.groomerhouse.pl", "x-forwarded-proto": "https" }]) {
    const result = await request(route, headers);
    equal(result.status, 301, `301 ${route} ${JSON.stringify(headers)}`);
    equal(result.location, "https://groomerhouse.pl" + route, `Same path and query ${route}`);
  }
}
for (const route of ["/", "/rezerwacja/", "/regulamin/", "/polityka-prywatnosci/", "/dane-kontaktowe/"]) {
  equal((await request(route, { host: "groomerhouse.pl" })).status, 200, `Canonical route not redirected ${route}`);
}
const homepage = await (await fetch(base, { signal: AbortSignal.timeout(20000) })).text();
const cssPath = homepage.match(/href="(\/_astro\/[^\"]+\.css)"/)?.[1];
assert.ok(cssPath, "Homepage exposes an actual built CSS asset");
checks++;
equal((await request(cssPath, { host: "groomerhouse.pl" })).status, 200, "Existing CSS asset still served");
equal((await request(cssPath, { host: "www.groomerhouse.pl" })).location, "https://groomerhouse.pl" + cssPath, "Static asset redirects before Astro file handling");
equal((await request("/rezerwacja/?x=1", { host: "www.groomerhouse.pl" }, "HEAD")).status, 301, "HEAD redirect");
equal((await request("/rezerwacja/?x=1", { host: "www.groomerhouse.pl" }, "POST")).status, 308, "POST body/method preservation redirect only");
console.log(JSON.stringify({ checks, result: "PASS", scope: "Canonical host unit and real extracted runtime HTTP checks; no CMS writes" }));
