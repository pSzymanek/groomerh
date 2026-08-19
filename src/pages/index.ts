import type { APIRoute } from "astro";
import { htmlResponse, loadSnapshot, makePortable } from "../lib/snapshot";

export const GET: APIRoute = async () => htmlResponse(makePortable(await loadSnapshot("/")));
