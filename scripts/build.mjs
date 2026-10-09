import { mkdir, readFile, writeFile, cp, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { site, pages, pagePath } from "../site.config.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public");
// Only this generated directory may be replaced; source and private documents stay outside it.
if (output !== resolve(root, "public") || output === root) throw new Error("Unsafe output path");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const template = await readFile(resolve(root, "src/layout.html"), "utf8");
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const organization = {
  "@type": "Organization", "@id": `${site.origin}/#organization`, name: site.name,
  url: `${site.origin}/`, email: site.email, telephone: site.phone,
  address: { "@type": "PostalAddress", addressLocality: "Jersey City", addressRegion: "NJ", addressCountry: "US" },
  areaServed: [{ "@type": "Country", name: "United States" }, { "@type": "Country", name: "India" }]
};

async function render(page, body, destination, notFound = false) {
  const canonical = `${site.origin}${pagePath(page)}`;
  const graph = [organization, { "@type": "WebSite", "@id": `${site.origin}/#website`, name: site.name, url: `${site.origin}/`, publisher: { "@id": organization["@id"] } },
    { "@type": "WebPage", "@id": `${canonical}#webpage`, url: canonical, name: page.title, description: page.description, isPartOf: { "@id": `${site.origin}/#website` }, inLanguage: "en" }];
  if (page.slug && !notFound) graph.push({ "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${site.origin}/` },
    { "@type": "ListItem", position: 2, name: page.nav, item: canonical }
  ] });
  if (page.service) graph.push({ "@type": "Service", "@id": `${canonical}#service`, name: page.service, serviceType: page.service, url: canonical,
    provider: { "@id": organization["@id"] }, areaServed: page.area.map(name => ({ "@type": "Country", name })) });
  const navigation = pages.map(item => `<a href="${pagePath(item)}"${item.slug === page.slug ? ' aria-current="page"' : ""}${item.slug === "contact" ? ' class="nav-contact"' : ""}>${escape(item.nav)}</a>`).join("\n      ");
  const tokens = {
    title: escape(page.title), description: escape(page.description), canonical,
    robots: notFound ? "noindex, follow" : "index, follow", view: page.slug || "home", body, navigation,
    preload: !page.slug ? '<link rel="preload" href="/assets/images/hrm-hero-960.webp" media="(max-width: 759px)" as="image" type="image/webp" fetchpriority="high" /><link rel="preload" href="/assets/images/hrm-hero.webp" media="(min-width: 760px)" as="image" type="image/webp" fetchpriority="high" />' : "",
    structuredData: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c"),
    conversation: page.slug === "contact" ? "" : '<aside class="conversation-band" aria-label="Discuss your requirements"><div class="container"><div><h2>Build your next technology team.</h2><p>Share your US IT staffing requirements with our recruitment team.</p></div><a class="btn btn-accent" href="/contact/?service=hiring">Submit Your Staffing Requirement</a></div></aside>'
  };
  const html = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in tokens)) throw new Error(`Unknown template token: ${key}`);
    return tokens[key];
  });
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html);
}

for (const page of pages) {
  await render(page, await readFile(resolve(root, `src/pages/${page.source}.html`), "utf8"), resolve(output, page.slug, "index.html"));
}
await render({ slug: "404", title: "Page Not Found | HRM-Solutions", description: "Find US staffing and software implementation services at HRM-Solutions." },
  '<section class="route-hero"><div class="container route-hero-content"><p class="eyebrow eyebrow-light">Page not found</p><h1>Let\'s get you to the right place.</h1><p>The page may have moved. Explore our services or contact us about your requirements.</p><a class="btn btn-accent" href="/">Return to home</a></div></section>', resolve(output, "404.html"), true);
await cp(resolve(root, "assets"), resolve(output, "assets"), { recursive: true });
for (const file of ["styles.css", "script.js"]) await cp(resolve(root, file), resolve(output, file));
await writeFile(resolve(output, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site.origin}/sitemap.xml\n`);
await writeFile(resolve(output, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${site.origin}${pagePath(page)}</loc><lastmod>${site.updated}</lastmod></url>`).join("\n")}\n</urlset>\n`);
console.log(`Built ${pages.length} complete HTML pages, a 404 page, robots.txt, and sitemap.xml in public/.`);
