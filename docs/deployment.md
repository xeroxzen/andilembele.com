# Production deployment

GitHub Actions builds and tests every pull request and every push to `main`. Production deployment is deliberately gated by the `DEPLOY_ENABLED` repository variable while the server is being prepared.

## Release layout

The workflow uploads each build to an immutable directory and atomically moves the `current` symlink:

```text
/var/www/andilembele-releases/
├── current -> releases/<git-sha>
└── releases/
    └── <git-sha>/
```

Nginx uses `/var/www/andilembele-releases/current` as the document root. The existing TLS and server-block settings remain unchanged. The workflow retains the five newest releases for quick rollback.

## One-time server setup

Run these steps from an authenticated root session on `139.84.233.151`:

```sh
adduser --disabled-password --gecos '' deploy
install -d -o deploy -g deploy -m 755 /var/www/andilembele-releases /var/www/andilembele-releases/releases
install -d -o deploy -g deploy -m 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

Append the repository's dedicated CI public key to the account:

```sh
cat ops/andilembele-github-actions.pub >> /home/deploy/.ssh/authorized_keys
```

Only the public key is committed; its private half is stored in the `DEPLOY_SSH_KEY` GitHub secret. Before changing nginx, locate the active configuration with `nginx -T` and update only the `root` directive for `andilembele.com` to:

```nginx
root /var/www/andilembele-releases/current;
```

Validate and reload it with:

```sh
nginx -t
systemctl reload nginx
```

### Error page and security headers

Applied on 2026-11-09. Security headers live in `/etc/nginx/snippets/andilembele-headers.conf`. nginx drops inherited `add_header` lines in any `location` that sets its own (the immutable-cache block for static files does), so the snippet is included both at server level and in that block. Include it in any new location that adds headers.

```nginx
# /etc/nginx/sites-available/andilembele.com, inside the 443 server block
server_tokens off;
error_page 404 /404.html;
include /etc/nginx/snippets/andilembele-headers.conf;

# The resume was renamed; keep old links and search results working.
location = /assets/Andile_Mbele_Resume.pdf {
    return 301 /assets/Andile_Mbele.pdf;
}

location ~* \.(jpg|jpeg|png|gif|webp|ico|css|js|svg|pdf)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    include /etc/nginx/snippets/andilembele-headers.conf;
}
```

```nginx
# /etc/nginx/snippets/andilembele-headers.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://apis.google.com; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://<FIREBASE_AUTH_DOMAIN>; img-src 'self' https: data:; style-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
```

`frame-src` holds `FIREBASE_AUTH_DOMAIN` from `.env`; the admin sign-in popup is framed from it.

The policy was verified in report-only mode against admin sign-in and saving, then switched to enforcing on 2026-11-09. Before loosening or tightening it, rename the header to `Content-Security-Policy-Report-Only`, check the console on `/admin/`, home, and blog, then switch back. Add `includeSubDomains` to HSTS only after confirming every subdomain serves HTTPS. Run `nginx -t` before every `systemctl reload nginx`.

Check the result with:

```sh
curl -sI https://andilembele.com/ | grep -iE 'strict|content-security|referrer|server'
curl -s https://andilembele.com/missing | grep -F 'Page not found'
```

### Spotify now-playing service

The home page polls `/api/now-playing`, served by `services/now-playing/server.mjs`, a dependency-free Node service on `127.0.0.1:4180`. It is deployed by hand, not by the workflow, because it changes rarely and holds credentials. If it is down, the widget hides.

One-time Spotify setup:

1. Create an app at https://developer.spotify.com/dashboard with the Web API and the redirect URI `http://127.0.0.1:8888/callback`.
2. Put `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` in the local `.env`.
3. Run `node services/now-playing/authorize.mjs`, open the printed URL, approve, and copy the printed `SPOTIFY_REFRESH_TOKEN`.

Install or update on the server:

```sh
sudo install -d -m 755 /opt/now-playing
sudo install -m 644 server.mjs spotify.mjs /opt/now-playing/
sudo install -m 600 -o root -g root now-playing.env /etc/now-playing.env   # the three SPOTIFY_* lines
sudo install -m 644 now-playing.service /etc/systemd/system/now-playing.service
sudo systemctl daemon-reload && sudo systemctl enable --now now-playing
curl -s http://127.0.0.1:4180/api/now-playing
```

nginx, inside the `andilembele.com` 443 server block:

```nginx
location = /api/now-playing {
    proxy_pass http://127.0.0.1:4180;
    proxy_set_header Host $host;
}
```

Logs: `journalctl -u now-playing`. Revoking access at https://www.spotify.com/account/apps/ invalidates the refresh token; rerun `authorize.mjs` to get a new one.

## GitHub configuration

The workflow expects these repository settings:

| Type | Name | Value |
| --- | --- | --- |
| Variable | `DEPLOY_ENABLED` | `false` until setup is verified, then `true` |
| Variable | `DEPLOY_USER` | `deploy` |
| Variable | `DEPLOY_PORT` | `22` |
| Variable | `DEPLOY_PATH` | `/var/www/andilembele-releases` |
| Variable | `DEPLOY_URL` | `https://andilembele.com` |
| Secret | `DEPLOY_SSH_KEY` | Dedicated private key used only by GitHub Actions |
| Secret | `DEPLOY_KNOWN_HOSTS` | Pinned SSH host-key entry for `139.84.233.151` |

The Firebase build values and `CMS_ADMIN_EMAILS` are also stored as GitHub Actions secrets. Pull requests fall back to inert placeholders, so untrusted pull requests cannot read production values.

## First deployment

Keep `DEPLOY_ENABLED=false` until all of the following succeed:

1. `ssh deploy@139.84.233.151` authenticates with the dedicated key.
2. The deploy user can create a directory under `/var/www/andilembele-releases/releases`.
3. Nginx points to `/var/www/andilembele-releases/current`.
4. A valid initial `current` symlink exists, so nginx never serves an empty root.

Then set `DEPLOY_ENABLED=true` and run **Build and deploy** from the Actions tab. Each subsequent merge to `main` will deploy automatically.

## Rollback

Point `current` at any retained release; nginx follows the symlink without a reload:

```sh
ln -sfn /var/www/andilembele-releases/releases/<git-sha> /var/www/andilembele-releases/current
```
