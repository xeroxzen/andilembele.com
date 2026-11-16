# Andile Jaden Mbele

Source for [andilembele.com](https://andilembele.com): a static portfolio, a blog that mixes Medium links with journal posts, and a Firebase-backed CMS at `/admin/`.

## Run locally

Requires Node.js 20 or newer.

```sh
git clone https://github.com/xeroxzen/andilembele.com.git
cd andilembele.com
npm ci
cp .env.example .env   # fill in the values; see Production below
npm start
```

- Website: http://127.0.0.1:4173
- Blog: http://127.0.0.1:4173/blog
- Local editor: http://127.0.0.1:4173/blog/admin

`npm start` rebuilds the pages, then serves `dist/` with a local-only CMS that saves posts and media to `data/` (gitignored; back it up). Set `CMS_ADMIN_PASSWORD` (12+ characters) to lock the editor. Never expose this server publicly. Use `PORT=4174 npm start` if 4173 is taken.

## Where things live

| Change | Edit |
| --- | --- |
| Name, positioning, roles open to, proof strip, principles, skills | `content/site.json` |
| Projects (one Markdown file each; case-study sections must follow the template order) | `content/projects/*.md` |
| Timeline, talks, Now page | `content/timeline.json`, `content/talks.json`, `content/now.json` |
| Content schemas and validation | `lib/content.mjs` |
| Pages | `components/pages.mjs` |
| Building blocks (callouts, toggles, pills, gallery cards) and database views | `components/blocks.mjs`, `components/database.mjs` |
| Header, navigation, ⌘K palette and `/` menu | `components/layout.mjs` |
| Line-art illustrations | `components/illustrations.mjs` |
| Blog page layout | `templates/blog.html` |
| Footer and social links | `components/footer.mjs` |
| Link-preview tags, canonical links, structured data | `components/social-meta.mjs` |
| Share-card images | `components/og-image.mjs` |
| `robots.txt`, `sitemap.xml`, RSS feed | `components/crawl-files.mjs` |
| Styles and design tokens | `dist/styles.css`, `dist/blog/blog.css` |
| Browser code (menus, theme, database views, motion, widgets) | `src/client/*.js`, bundled to `/site.js` |
| Blog and CMS behaviour | `dist/blog/*.js` |
| Images, résumé, icons, fonts | `dist/assets/` |
| Spotify now-playing widget and service | `src/client/now-playing.js`, `services/now-playing/` (deployed by hand; see `docs/deployment.md`) |

Every page except the blog is generated from `content/` by `npm run build`, which fails if a content file breaks its schema. The generated HTML in `dist/` and `dist/site.js` should not be edited by hand. `out/` is the full public build and is not committed.

## Builds

- `npm run build` renders the templates into `dist/`.
- `npm run build:sites` reads `.env` and writes the public site to `out/`: home, blog, a static page and share card for each journal post, the bundled production CMS, `robots.txt`, `sitemap.xml`, and `/blog/feed.xml`.
- `npm run fetch:posts` snapshots published journal posts from Firestore for `build:sites`.
- `npm run sync:medium` refreshes Medium article metadata and rebuilds.

## Production

`.env.example` lists the settings: `SITE_URL`, the Firebase web config, and `CMS_ADMIN_EMAILS`, the Google accounts allowed into `/admin/`. Firestore rules are generated from that list (`npm run build:rules`). Firebase web keys end up in the public CMS JavaScript, so restrict authorized domains in the Firebase console.

GitHub Actions (`.github/workflows/deploy.yml`) builds and tests every pull request, deploys every push to `main`, and checks hourly for newly published journal posts. Server setup, nginx headers, and rollback are in [`docs/deployment.md`](docs/deployment.md).

## Checks

```sh
npm test          # builds out/, then runs tests/*.test.mjs
npm run test:rules  # Firestore rules against the emulator
```

## Content and notices

Medium article bodies are linked, not republished. Third-party license notices are in `licenses/`.
