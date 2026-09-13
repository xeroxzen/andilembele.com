# Owner handoff

Read FIREBASE-SETUP.md for the production CMS and BACKEND-AUDIT.md for verified results and remaining limitations. START-HERE.md contains the complete owner setup prompt.

Open `/admin/` and continue with Google using an allowed account. Create a draft, preview it, and publish when ready. Published text posts appear immediately in `/blog/`; use export for a manual backup. Images are disabled pending storage setup. Google Cloud ownership is separate from editor access.

The separate `npm start` server stores posts and images locally and must remain bound to loopback. Export/import content deliberately when migrating; local posts never publish automatically.

Refresh Medium metadata with `npm run sync:medium`, build and redeploy. No Medium password is required and full article bodies are not copied. Automatic refresh and scheduled backups remain future work.

For andilembele.com, have Andile sign in to his registrar. Record existing DNS for rollback, confirm apex versus www, preserve email and unrelated records, and obtain approval for the exact DNS changes. Add the hostname to Firebase Authentication authorized domains, verify HTTPS and redirects, and update canonical/social metadata. Do not replace nameservers or modify mail records implicitly.
