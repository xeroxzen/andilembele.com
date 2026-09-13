# Firebase setup

Project: `andile-portfolio-personal` (148876622162). Temporary owner: thabheloduve@gmail.com. No parent organization or billing account.
Console: https://console.firebase.google.com/project/andile-portfolio-personal/overview

Google OAuth and Firestore are configured. Allowed administrators are listed once in `config/admins.json`; `npm run build:rules` generates the server-enforced Firestore rules. After changing this list, deploy `firebase/firestore.rules` to this exact project and rebuild/redeploy the frontend. Never rely on a frontend-only change.

`config/firebase.json` contains public browser SDK configuration, not admin credentials. Never commit service-account keys or OAuth secrets. Always verify the CLI account and explicitly select this project before provisioning. The Firebase CLI may still select the university account; do not deploy with that identity.

Production: `npm ci && npm run build:sites` produces `out`. Serve that directory to test Google OAuth/Firestore. `/admin/` opens the dashboard and `/admin/posts/` opens the editor. `npm start` instead runs the separate loopback-only local JSON CMS; its posts are not automatically migrated online.

Testing: `npm test`; `npm run test:rules` requires Firebase CLI and Java for the Firestore emulator. Test real Google login, draft, publish, edit, delete and logout in a normal browser as well.

Authorized domains include localhost, 127.0.0.1, the Firebase domains and andilejadenmbele.thabhelo-duve.chatgpt.site. Add the final custom domain to Firebase Authentication before its DNS cutover.

Image uploads are disabled pending separately approved storage/billing work. Do not attach billing implicitly. No scheduled backups exist: export posts manually and plan a restore test.

## Handover

CMS access is not Google Cloud project ownership. With explicit authorization, add Andile's confirmed account as project Owner, verify access, and only then remove the temporary owner. Transfer any future billing separately. No invitations have been sent. Do not use the unused university project `andile-portfolio-20260912`.
