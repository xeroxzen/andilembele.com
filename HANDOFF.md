# Andile's blog and CMS handoff

## Works now, entirely locally

Run `npm start` from this folder. Home: http://127.0.0.1:4173. Blog: /blog. Editor: /blog/admin.

The editor supports new and existing posts, Markdown import/export, full post JSON export, tags, dates, excerpts, slug editing, reading-time estimates, covers and inline image uploads, preview, draft visibility, and browser recovery for unsaved edits. Saved posts persist in `data/posts.json`; images persist in `data/media/`. Back up the entire data folder to retain images along with posts. JSON export contains posts and media paths, not the image files. Drafts are omitted from the public post API and cannot be read on an article route. All content belongs to Andile: no Thabhelo posts, drafts, or images were copied.

“Visible locally” means the post appears on this computer's blog. It does not publish anything online. The editor is a local workspace, not an authenticated production service. The server binds only to 127.0.0.1, checks the Host header, and requires same-origin, token-bearing writes. Do not expose this server through a tunnel or deploy it as a remote CMS.

## Adapted from ~/three

- Blog metadata and draft/hidden workflow: src/lib/blog-service.ts.
- Editor fields, Markdown snippets, preview, images, reading time: src/pages/blog-admin.tsx and src/lib/blog-markdown.ts.
- Search/topic browsing and article presentation inspired by BlogNativeIndex.tsx and MarkdownContent.
- Lede, stat, and source blocks were adapted into a safe limited Markdown renderer. Raw HTML is escaped; arbitrary scripts, embeds, and LaTeX rendering are not supported.
- Original MIT license is in licenses/three-MIT.txt.

The original React/Firebase components were not copied wholesale: they depend on Thabhelo's content, accounts, and app structure. The equivalent writing workflow is implemented in this site's small standalone stack. No credentials, environment files, cloud configuration, deployment scripts, Firebase rules tied to the old project, contact/email services, analytics, or remote data were copied or contacted.

## Where Andile needs to join

1. Choose hosting under his own account and confirm his domain access.
2. Choose a CMS backend: his own Firebase project, another managed CMS, or a persistent server with a database. No provider has been preselected or initialized.
3. Provide the intended administrator identity. Implement real authentication and server-enforced authorization before exposing admin APIs online. Never put administrative credentials in browser code.
4. Configure his own database and media storage, access rules, upload limits, backups, and any required CORS policy. The current data adapter is lib/store.mjs; HTTP wiring is in server.mjs.
5. Migrate data/posts.json and data/media, verify draft access protections and image rendering, then review the final domain before deployment.
6. Configure canonical URLs, sitemap/RSS and social metadata for the chosen deployment. Optional analytics, comments/reactions, newsletter and transactional mail remain disconnected and require his accounts and choices.

Do not reuse Thabhelo's Google Cloud, Firebase, Vercel, email, or analytics projects. No live deployment has been performed. This implementation deliberately stops before remote infrastructure, authentication, and publishing.

## Content

The Writing page combines native published posts with ten verified Medium article links, sorted by date and searchable by title and topic. Medium articles open on Medium; their bodies are not copied. The homepage highlights three recent articles. Native posts still start empty.

Run `npm run sync:medium` (Python 3 required) to refresh `dist/blog/medium-posts.json` from Andile's public RSS feed. Previously indexed articles are retained because Medium exposes a limited recent feed. This is a checked-in snapshot, not a live automatic sync. Configure a scheduled refresh or build-time refresh on Andile's chosen hosting, preserve the last good snapshot on failures, and regenerate homepage highlights as part of that production workflow. No Medium password or API key is needed for public RSS. Ask Andile before importing full articles, and preserve original links and canonical attribution if he chooses to republish.

## Existing domain: andilembele.com

Andile already controls his domain. Have him sign in to its registrar/DNS provider and chosen hosting account himself. Inspect current DNS and record a rollback before changes. Confirm apex versus www, connect the domain using the hosting provider's verified records, and change only website records. Preserve MX, SPF, DKIM, DMARC and unrelated verification records. Confirm any old website routes and add redirects where necessary. Verify HTTPS, both hostnames, canonical URLs, social metadata, sitemap and RSS, and keep admin/drafts out of indexing. Show the staging site and proposed DNS changes for approval before production cutover. Use only Andile's accounts and infrastructure.

## Validation and preview restart

The automated request-handler tests pass for save/reload persistence, duplicate slugs, slug renaming, draft exclusion, same-origin token checks, invalid/valid image handling, private data paths, and Markdown HTML/URL safety. The tests invoke the HTTP handler directly without listening on a port.

Run `npm start` from this folder and open `/admin`. Restart an older server first if needed. The new server prints Home, Blog, and Local CMS addresses. Test a draft, preview it, change it to Visible locally, and confirm it appears on `/blog`; return it to Draft to hide it again.

## Finished blog interface

The public blog now has a featured article, a year archive, search, topic/source filters, URL-preserved filters, and incremental browsing. Native reading pages include a table of contents for longer posts, copy-link control, and more-writing links. `npm run build` regenerates a readable HTML fallback and an interactive `/blog-preview.html` for static previews. The preview contains only public Medium metadata, not CMS content. The updated server remains required for native article routes and the editor. Public preview search and archive expansion were verified in a browser; starting the updated CMS server was still blocked by session permissions.


## Admin workspace

`/admin` is the local dashboard. `/admin/posts` opens the editor; `/blog/admin` remains compatible. It supports drafts, local visibility, previews, cover/inline images, Markdown import/export, full post export, recovery, and deletion with confirmation. The dashboard reports post and draft counts.

The Node server remains bound to loopback and rejects other Host headers. Set `CMS_ADMIN_PASSWORD` (at least 12 characters) in the server environment to enable password sign-in. Passwords are compared using scrypt; sessions use HttpOnly SameSite cookies, expire after 30 minutes of inactivity, and are invalidated at logout. Restarting invalidates all sessions. Login attempts are rate limited. Without a password, access relies on the local-computer boundary. Do not expose this server to the internet.

The public `/admin` is an honest setup page, with no login form or privileged API. Before enabling remote administration, have Andile sign in to his own chosen hosting/auth/storage providers. Add server-enforced owner authorization, HTTPS Secure session cookies, durable sessions and rate limits, persistent post/media storage, backups, password recovery, and a production publication workflow. Test anonymous access, unauthorized accounts, session expiry, draft privacy, upload validation, and backup/restore before enabling online writes. No existing third-party infrastructure or credentials are reused.
