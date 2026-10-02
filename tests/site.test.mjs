import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { site, pages, pagePath } from "../site.config.mjs";
import { createPreviewServer } from "../scripts/preview.mjs";

const output = resolve(dirname(fileURLToPath(import.meta.url)), "../public");
const htmlByPath = new Map(await Promise.all(pages.map(async page => [pagePath(page), await readFile(resolve(output, page.slug, "index.html"), "utf8")])));
const capture = (html, regex) => html.match(regex)?.[1];

test("every page has complete, unique search content without JavaScript", () => {
  const titles = new Set(), descriptions = new Set();
  for (const [path, html] of htmlByPath) {
    const title = capture(html, /<title>(.*?)<\/title>/s);
    const description = capture(html, /<meta name="description" content="([^"]+)"/);
    assert.ok(title && description, path);
    assert.ok(!titles.has(title) && !descriptions.has(description), `${path}: duplicate metadata`);
    titles.add(title); descriptions.add(description);
    assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, path);
    assert.ok(html.includes(`<link rel="canonical" href="${site.origin}${path}"`), path);
    assert.ok(html.includes(`<meta property="og:url" content="${site.origin}${path}"`), path);
    assert.ok(!html.includes("{{") && !html.includes("data-view="), path);
    assert.doesNotMatch(html, /HRM Business Solutions|Starter plan|Growth plan|PF, ESI|Coming soon|Most selected/);
    assert.doesNotMatch(html, /<\/option\s+[^>]/);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${path}: duplicate IDs`);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1, path);
    const graph = JSON.parse(capture(html, /<script type="application\/ld\+json">(.*?)<\/script>/s))["@graph"];
    assert.ok(graph.some(item => item["@type"] === "Organization" && item.name === "HRM-Solutions"));
    assert.ok(graph.some(item => item["@type"] === "WebPage" && item.url === `${site.origin}${path}`));
    if (path !== "/") assert.ok(graph.some(item => item["@type"] === "BreadcrumbList"));
  }
});

test("internal links, resource anchors, and local assets resolve", async () => {
  for (const [path, html] of htmlByPath) {
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = new URL(match[1].replaceAll("&amp;", "&"), `${site.origin}${path}`);
      if (url.origin !== site.origin) continue;
      if (htmlByPath.has(url.pathname)) {
        if (url.hash) assert.ok(htmlByPath.get(url.pathname).includes(`id="${url.hash.slice(1)}"`), `${path}: ${url.href}`);
      } else {
        await readFile(resolve(output, `.${url.pathname}`));
      }
    }
    for (const tag of html.matchAll(/<img\b[^>]+>/g)) {
      assert.match(tag[0], /alt="[^"]+"/); assert.match(tag[0], /width="\d+"/); assert.match(tag[0], /height="\d+"/);
    }
  }
});

test("sitemap lists only canonical public pages and robots permits discovery", async () => {
  const sitemap = await readFile(resolve(output, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual(urls.sort(), pages.map(page => `${site.origin}${pagePath(page)}`).sort());
  assert.ok(urls.every(url => !url.includes("#") && !url.includes("?")));
  const robots = await readFile(resolve(output, "robots.txt"), "utf8");
  assert.match(robots, /Allow: \//);
  assert.ok(robots.includes(`Sitemap: ${site.origin}/sitemap.xml`));
  const files = await readdir(output, { recursive: true });
  assert.ok(files.every(file => !/\.pdf$|\.git|\.env|src[\\/]|tests[\\/]/.test(file)));
});

test("hiring and implementation calls to action match valid form choices", () => {
  const contact = htmlByPath.get("/contact/");
  for (const select of contact.matchAll(/<select\b[^>]*>(.*?)<\/select>/gs)) {
    assert.equal((select[1].match(/<option(?:\s|>)/g) || []).length, (select[1].match(/<\/option>/g) || []).length, "Malformed select options");
  }
  for (const role of ["Project Manager", "Business Partner", "Business Owner"]) assert.ok(contact.includes(`<option>${role}</option>`));
  const options = [...contact.matchAll(/<option value="([^"]+)"/g)].map(m => m[1]);
  for (const html of htmlByPath.values()) {
    for (const match of html.matchAll(/href="\/contact\/\?service=([^"]+)"/g)) assert.ok(options.includes(match[1]));
  }
  assert.deepEqual(options.sort(), ["hiring", "implementation", "staffing-software"].sort());
  assert.ok(contact.includes("Nothing is sent by this website."));
  assert.ok(contact.includes("<noscript>"));
});

test("direct HTTP pages, real 404s, and trailing-slash redirects work", async () => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [path, html] of htmlByPath) {
      const response = await fetch(`${origin}${path}`);
      assert.equal(response.status, 200); assert.equal(await response.text(), html);
    }
    for (const path of ["/not-a-page/", "/BRD_HRM_Business_Solutions.pdf", "/.git/config", "/site.config.mjs"]) {
      assert.equal((await fetch(`${origin}${path}`)).status, 404, path);
    }
    const redirect = await fetch(`${origin}/contact?service=hiring`, { redirect: "manual" });
    assert.equal(redirect.status, 308); assert.equal(redirect.headers.get("location"), "/contact/?service=hiring");
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
});
