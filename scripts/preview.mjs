import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, extname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const output = resolve(dirname(fileURLToPath(import.meta.url)), "../public");
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };

export function createPreviewServer() {
  return createServer(async (request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" }); response.end(); return;
    }
    response.setHeader("Cache-Control", "no-store");
    // Local previews should never become search results.
    response.setHeader("X-Robots-Tag", "noindex");
    try {
      const url = new URL(request.url, "http://localhost");
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.includes("\\") || pathname.includes("\0")) throw new Error("Invalid path");
      let file = resolve(output, `.${pathname}`);
      if (file !== output && !file.startsWith(`${output}${sep}`)) throw new Error("Outside public output");
      if ((await stat(file)).isDirectory()) {
        if (!pathname.endsWith("/")) {
          response.writeHead(308, { Location: `${url.pathname}/${url.search}` }); response.end(); return;
        }
        file = resolve(file, "index.html");
      }
      const body = await readFile(file);
      response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      response.end(request.method === "HEAD" ? undefined : await readFile(resolve(output, "404.html")).catch(() => "Not found"));
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 8766);
  createPreviewServer().listen(port, "127.0.0.1", () => console.log(`HRM-Solutions preview: http://127.0.0.1:${port}/`));
}
