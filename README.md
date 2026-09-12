# Andile Jaden Mbele

A minimal personal website with a responsive experience timeline, selected projects, entrepreneurship, talks, and a local blog/CMS.

## Run locally

Requires Node.js 20 or newer. There are no package dependencies or build step.

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

Tests cover persistence, draft exclusion, slug changes, request protection, media handling, and Markdown safety. They exercise request handlers without opening a network port. The new CMS still needs a complete live browser walkthrough after starting the updated server.

## Content and notices

The résumé is included unchanged. Profile content is based on supplied professional information and public project descriptions; confirm it before launch. The native blog starts empty. Existing writing is linked on Medium and Rooibos Radar.

Third-party license notices are retained in `licenses/`.
