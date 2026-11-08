const SITE_ORIGIN = "https://groomerhouse.pl";
const WWW_AUTHORITY = /^www\.groomerhouse\.pl(?::(?:80|443))?$/;

function firstHost(value) {
  const header = Array.isArray(value) ? value[0] : value;
  return typeof header === "string" ? header.split(",", 1)[0].trim().toLowerCase() : "";
}

// Only a literal, owned alias can trigger this redirect. Neither a Host nor a
// forwarded header can choose its destination. Run before Astro's static handler.
export function canonicalRedirect(request) {
  const headers = request.headers || {};
  const isAlias = [headers.host, headers["x-forwarded-host"]]
    .some(value => WWW_AUTHORITY.test(firstHost(value)));
  if (!isAlias) return null;

  const target = request.url || "/";
  if (!target.startsWith("/") || /[\u0000-\u0020\u007f]/u.test(target)) {
    throw new Error("Invalid request target");
  }
  return {
    // Concatenation after a fixed authority also keeps //example.com a path.
    location: SITE_ORIGIN + target,
    status: ["GET", "HEAD"].includes(request.method || "GET") ? 301 : 308,
  };
}
