# HRM-Solutions website

A static website for US staffing and software implementation. Each page is built as complete HTML, with no client-side router. A Vercel Function delivers contact enquiries through Hostinger SMTP.

## Local development

Use Node.js 22 or newer. There are no third-party build dependencies.

```sh
npm ci
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

Vercel is configured to run `node scripts/build.mjs` and publish only `public/`. Vercel installs dependencies with `npm ci --ignore-scripts` and deploys `api/contact.js` alongside the static pages. Other static hosts can serve the pages, but require a compatible backend for the form. Do not publish the repository root: it can contain local project documents.

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

## Contact form delivery

Set these server-only Production environment variables in Vercel, then deploy:

- `SMTP_HOST`: `smtp.hostinger.com`
- `SMTP_PORT`: `465` (TLS)
- `SMTP_USER`: `info@hrm-solutions.com`
- `SMTP_PASS`: the mailbox password, saved as a Secret; never commit it
- `CONTACT_TO_EMAIL`: `info@hrm-solutions.com`

The browser calls `/api/contact/`. The server validates fields, uses a fixed sender and recipient, and sets Reply-To to the visitor. It does not store leads in a database. Messages remain in the receiving mailbox. Honeypot and signed timing tokens provide basic spam checks; throttling and token replay checks are instance-local, not a distributed abuse guarantee.

The static local preview does not run the email function and shows an email fallback. `npm test` tests the handler with simulated SMTP and never sends mail. Production delivery still requires a manual test: submit an enquiry with an email you control, confirm receipt in Hostinger (including Spam), and verify Reply targets that email. A successful SMTP response does not guarantee inbox placement.

No analytics or account-verification identifiers have been invented.

## Performance assets

The existing Inter and Plus Jakarta Sans Latin variable fonts are self-hosted in `assets/fonts/` with their OFL licenses. Font preloads and `font-display: optional` avoid a late text swap. The small head script selects the enhanced mobile header before first paint; navigation remains visible without JavaScript.

The homepage uses the original hero photo on desktop and a 960px copy on mobile. The story image has 640px/1280px responsive sources. Preserve matching preload media queries when replacing these assets.
