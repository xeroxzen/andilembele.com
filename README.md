# Andile Jaden Mbele

A minimal personal website with a responsive experience timeline, selected projects, entrepreneurship, talks, and a local blog/CMS.

## Run locally

Requires Node.js 20 or newer. There are no package dependencies. Run `npm run build` after changing blog layout or Medium metadata.

```sh
git clone https://github.com/Thabhelo/andile.git
cd andile
npm start
```

- Website: http://127.0.0.1:4173
- Blog: http://127.0.0.1:4173/blog
- Local editor: http://127.0.0.1:4173/blog/admin

Use `PORT=4174 npm start` if port 4173 is occupied. Stop an older preview before restarting the updated server.

## Editing

Portfolio content: `dist/index.html`. Shared styles: `dist/styles.css`. Blog and CMS: `dist/blog/`. Request handling: `server.mjs`. Content persistence: `lib/store.mjs`.

The editor supports Markdown, previews, draft visibility, tags, covers, image uploads, and exports. Saved posts and media live in `data/`, which is deliberately excluded from Git. Back up that whole directory to preserve both posts and images.

## Production setup

The CMS is local-only. It does not provide production authentication and must not be exposed through a tunnel or deployed as a public admin service. Hosting, authenticated administration, remote storage, and domain configuration remain to be set up under the owner's accounts.

Read [HANDOFF.md](HANDOFF.md) before configuring the backend or deploying. No cloud credentials or deployed services are included.

## Checks

```sh
npm test
```

Tests cover persistence, draft exclusion, slug changes, request protection, media handling, and Markdown safety. They exercise request handlers without opening a network port. The public static preview has been checked in the browser for rendering, search and archive expansion. The CMS still needs a complete live browser walkthrough after starting the updated server.

## Content and notices

The résumé is included unchanged. Profile content is based on supplied professional information and public project descriptions; confirm it before launch. The blog includes ten Medium article links, a featured article, year archive, search, topic/source filters, and incremental browsing. Native posts start empty and can be authored in the local CMS. Article pages support a table of contents, copy-link action, and more-writing links. Medium article bodies are not republished.

Third-party license notices are retained in `licenses/`.

## Blog preview and build

`npm run build` regenerates the public blog fallback and `dist/blog-preview.html`. The latter is an interactive preview of public Medium metadata that works on a basic static server, without the CMS. It includes no drafts or saved local posts. Open `/blog-preview.html` on the existing preview server; use `/blog` and `/blog/admin` when running `npm start`. `npm run sync:medium` refreshes public metadata and rebuilds the blog. The normal blog has readable article links even before JavaScript loads.

## Shared page components

Edit `components/footer.mjs` for footer markup and all footer social links. It is rendered at build time into every page, so it works without browser JavaScript. Edit `templates/home.html` and `templates/blog.html` for page layout; keep their `{{footer}}` placeholder. The blog template also uses `{{content}}`. Files in `dist/` and `out/` generated from these templates are build outputs; do not edit their footer copies. Run `npm run build:sites` to regenerate the full public site. `npm start` and `npm run dev` regenerate local pages first.
