# Security review: HRM-Solutions

Reviewed 9 October 2026. Scope: tracked website source, generated deployment output, contact API, fetched Git history, dependency advisories, Vercel environment metadata, and browser behavior. This is a bounded review, not a guarantee against every attack.

## Architecture and access

The site has six public content pages and a contact API. There are no application admin routes, user accounts, sessions, database, or stored user passwords. Adding a visitor login or password hashing would not protect an existing private feature, so neither was added. GitHub, Vercel, Cloudflare, and Hostinger dashboard account access, MFA, mailbox contents, and historical provider logs were outside the inspected scope.

## Protections added or verified

- A restrictive CSP allows same-origin assets and one exact inline-script hash; it prohibits framing, object embeds, base-URL changes, and unsafe inline/eval execution. Added nosniff, DENY framing, referrer policy, restricted browser permissions, and one-year HSTS without extending it to other subdomains.
- The API accepts only supported methods and JSON submissions from the canonical website origin; it does not grant cross-origin access. Fetch metadata rejects cross-site browser requests. These controls are not authentication and do not stop a non-browser bot from imitating headers.
- Body size is bounded even without Content-Length. Fields have length/type/control-character checks, normalized text, and an allowlisted service. Browser messages use textContent. Emails remain plain text with fixed sender/recipient and no user-controlled attachments or transport options.
- Added early throttling for malformed requests and token requests: 30/minute per IP per function instance. Existing delivery limit: 5 attempts/10 minutes per IP per instance. Signed timing tokens, honeypot, bounded maps, and instance-local replay detection remain supplemental spam controls.
- SMTP uses port 465, TLS certificate verification, minimum TLS 1.2, disabled file/URL access, and disabled debug logging. Errors expose only generic responses; logs contain allowlisted error codes rather than raw messages or credentials.
- Build output now uses an explicit public-asset allowlist. Private credential files, local documents, and unrelated projects are excluded from deployment uploads; credential file patterns are ignored by Git.

## Evidence

- 16 automated tests passed, covering input validation, delivery failure behavior, throttling, token checks, streamed body limits, CORS, XSS text handling, security headers, and private-file 404 responses.
- Headless Edge mobile checks passed on home/contact: no CSP errors, navigation works, and a mocked malicious API response stays text. Tests did not send real mail.
- npm reported zero known vulnerabilities and no outdated production dependency. Nodemailer 10.0.16 was retained.
- Gitleaks 8.30.1 (official release, checksum verified) detected no secrets in 24 commits across all fetched refs, or in generated public output. Deleted/unavailable remote history, provider backups, and arbitrary secret formats cannot be ruled out by this scan.
- Vercel metadata showed SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and CONTACT_TO_EMAIL encrypted and scoped to Production. Values were not decrypted or printed. This verifies storage metadata, not password strength, account access, or credential rotation history. Encrypted variables are not necessarily the dashboard's non-revealable Secret type.

## Remaining infrastructure work

A shared edge rate limit has NOT been installed. The firewall read and targeted insert returned configuration-not-found. Automatic approval review rejected initializing the full firewall configuration because a PUT could replace unknown existing rules and alter production traffic.

Proposed first step for review: a rule matching only `^/api/contact/?$`, keyed by source IP, fixed 60-second window, 30 requests, initially log-only. Inspect normal form traffic before switching to enforcement. Vercel rate counters are regional, not a globally exact counter. Do not replace an existing firewall configuration without inspecting/preserving it and obtaining the required approval.

Application throttling and token replay tracking are instance-local and reset on cold starts; they are not a distributed abuse guarantee. Provider account access and MFA should also be reviewed by the account owner. Rotate any credential if an actual exposure is discovered; this scan found no detected leak requiring a history rewrite.
