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

location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|pdf)$ {
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
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' https://apis.google.com; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://<FIREBASE_AUTH_DOMAIN>; img-src 'self' https: data:; style-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
```

`frame-src` holds `FIREBASE_AUTH_DOMAIN` from `.env`; the admin sign-in popup is framed from it.

The policy starts as `Content-Security-Policy-Report-Only`. Sign in at `/admin/`, save a draft, and browse the home page and blog with the console open; once no violations appear, rename the header to `Content-Security-Policy` in the snippet. Add `includeSubDomains` to HSTS only after confirming every subdomain serves HTTPS. Run `nginx -t` before every `systemctl reload nginx`.

Check the result with:

```sh
curl -sI https://andilembele.com/ | grep -iE 'strict|content-security|referrer|server'
curl -s https://andilembele.com/missing | grep -F 'Page not found'
```

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
