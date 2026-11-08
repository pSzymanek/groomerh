import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const sourceRoot = path.resolve("archive", "mirror", "groomerhouse.pl");
const publicRoot = path.resolve("public");

await mkdir(publicRoot, { recursive: true });

for (const directory of ["wp-content", "wp-includes"]) {
  const source = path.join(sourceRoot, directory);
  const target = path.join(publicRoot, directory);
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true, force: true });
}

await cp(
  path.resolve("assets", "home"),
  path.join(publicRoot, "images", "home"),
  { recursive: true, force: true },
);
await cp(
  path.resolve("assets", "ui"),
  path.join(publicRoot, "images", "ui"),
  { recursive: true, force: true },
);

console.log("Prepared preserved WordPress assets and site illustrations in public/.");
