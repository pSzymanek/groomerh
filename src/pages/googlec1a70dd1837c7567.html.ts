import type { APIRoute } from "astro";

export const GET: APIRoute = () => new Response(
  "google-site-verification: googlec1a70dd1837c7567.html\n",
  {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300",
    },
  },
);
