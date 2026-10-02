# HRM-Solutions website

A static website for US staffing and software implementation. Each page is built as complete HTML, with no client-side router or production server required.

## Local development

Use Node.js 22 or newer. There are no third-party build dependencies.

```sh
npm run build
npm test
npm run preview
```

Preview: http://127.0.0.1:8766/ . Rebuild and reload after source changes.

- `src/pages/`: page content
- `src/layout.html`: shared header, footer, and metadata template
- `site.config.mjs`: page titles, descriptions, canonical origin, and sitemap modification date
- `styles.css` and `script.js`: shared styling and browser interactions
- `public/`: generated deployment output; do not edit directly

## Deployment

Vercel is configured to run `node scripts/build.mjs` and publish only `public/`. No dependency install is needed. Other static hosts can serve that same directory. Do not publish the repository root: it can contain local project documents.

The build produces `/`, `/us-staffing/`, `/software-implementation/`, `/resources/`, `/about/`, `/contact/`, `/sitemap.xml`, `/robots.txt`, and `404.html`. Configure other hosts to use `404.html` with HTTP status 404 for unknown paths, rather than serving the homepage.

Old homepage fragment links (such as `/#why` and `/#product`) are forwarded in the browser to the appropriate new page. Fragment values never reach the server, so they cannot use server-side redirects. New navigation uses normal page links.

## Client scope and remaining SEO setup

Based on client answers provided on 3 October 2026:

- Confirmed services: US staffing and software implementation.
- Audience: project managers, business partners, and business owners.
- Locations: United States / Jersey City, New Jersey; India / Hyderabad, Telangana.
- Primary actions: request hiring, share US job requirements, discuss implementation (including staffing businesses).
- Suggested searches include US staffing firms, recruitment firms in the US, and software development companies in the US and India. The last phrase is treated as an audience; custom development has not been confirmed as an offered service.

No Hyderabad street address, vendor certification, client endorsement, ranking claim, or product subscription has been added. Organization and Service structured data use confirmed services and service countries. The existing US contact details are retained.

After production deployment:

1. Verify the client-owned domain property in Google Search Console using its supplied DNS record. No verification token is available yet.
2. Submit `https://www.hrm-solutions.com/sitemap.xml` and inspect the home and service URLs.
3. Confirm that the hosting redirects the non-www hostname to the canonical www hostname.
4. Review indexing and performance reports once data is available. Keywords are client suggestions, not measured search-volume research.
5. Obtain approved business/team details and case studies before publishing them.

The enquiry form prepares an email draft; it does not send messages or store leads. Direct submission requires a separately configured delivery service. No analytics or account-verification identifiers have been invented.
