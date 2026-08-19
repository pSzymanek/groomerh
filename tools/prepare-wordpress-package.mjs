import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const workspace = path.resolve(".");
const exportRoot = path.resolve("export", "groomerhouse-wordpress-sftp");
if (!exportRoot.startsWith(path.join(workspace, "export") + path.sep)) {
  throw new Error("Unsafe export target");
}

await rm(exportRoot, { recursive: true, force: true });

const themeTarget = path.join(exportRoot, "wp-content", "themes", "groomerhouse-snapshot");
await mkdir(themeTarget, { recursive: true });
await cp(path.resolve("wordpress", "theme", "groomerhouse-snapshot"), themeTarget, { recursive: true });

const pageTarget = path.join(themeTarget, "snapshot", "pages");
await mkdir(pageTarget, { recursive: true });
const pages = {
  "home.html": "archive/mirror/groomerhouse.pl/index.html",
  "kurs-grooming-kotow.html": "archive/mirror/groomerhouse.pl/kurs-grooming-kotow/index.html",
  "kurs-groomerski.html": "archive/mirror/groomerhouse.pl/kurs-groomerski/index.html",
  "podstawowy-kurs-groomerski-slask.html": "archive/mirror/groomerhouse.pl/podstawowy-kurs-groomerski-slask/index.html",
  "cennik.html": "archive/mirror/groomerhouse.pl/cennik/index.html",
  "polityka-prywatnosci.html": "archive/mirror/groomerhouse.pl/polityka-prywatnosci/index.html",
  "blog.html": "archive/mirror/groomerhouse.pl/blog/index.html",
  "post-jak-zostac-groomerem.html": "archive/mirror/groomerhouse.pl/2023/07/31/jak-zostac-groomerem-w-polsce-kompletny-przewodnik/index.html",
};
for (const [name, source] of Object.entries(pages)) {
  await cp(path.resolve(source), path.join(pageTarget, name));
}

for (const directory of ["wp-content", "wp-includes"]) {
  await cp(
    path.resolve("archive", "mirror", "groomerhouse.pl", directory),
    path.join(themeTarget, "snapshot", directory),
    { recursive: true },
  );
}

const muTarget = path.join(exportRoot, "wp-content", "mu-plugins");
await mkdir(muTarget, { recursive: true });
await cp(
  path.resolve("wordpress", "mu-plugins", "groomerhouse-booknetic-bridge.php"),
  path.join(muTarget, "groomerhouse-booknetic-bridge.php"),
);
await cp(path.resolve("wordpress", "DEPLOY-INSTRUKCJA.txt"), path.join(exportRoot, "DEPLOY-INSTRUKCJA.txt"));

const manifest = JSON.parse(await readFile(path.resolve("archive", "manifest.json"), "utf8"));
await writeFile(
  path.join(exportRoot, "PACKAGE-MANIFEST.json"),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceExport: manifest.exportedAt,
    theme: "groomerhouse-snapshot",
    version: "1.0.0",
    preserved: manifest.counts,
  }, null, 2)}\n`,
  "utf8",
);

console.log(exportRoot);
