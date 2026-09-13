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
