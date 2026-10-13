import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist");
const publicExtensions = new Set([".html", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".xml", ".webmanifest"]);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of await readdir(root)) {
  if (name === "assets") {
    const p = path.join(root, name);
    if ((await stat(p)).isDirectory()) await cp(p, path.join(out, name), { recursive: true });
    continue;
  }
  if (publicExtensions.has(path.extname(name).toLowerCase())) {
    const p = path.join(root, name);
    if ((await stat(p)).isFile()) await cp(p, path.join(out, name));
  }
}
console.log("Built static site in dist/");
