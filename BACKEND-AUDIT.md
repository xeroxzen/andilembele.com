# Backend readiness — 2026-09-13

Production builds connect directly to Firebase Authentication and Firestore in `andile-portfolio-personal`. Firestore rules enforce access on the server; the browser allowlist alone is not a security boundary.

- Google sign-in enabled. Only verified Google accounts `thabheloduve@gmail.com` and `andilembele020@gmail.com` can read drafts or manage posts.
- Public readers can query published posts only. Drafts and all other collections are denied.
- Editor supports text drafts, publishing/unpublishing, editing, slug changes, deletion, Markdown preview and import/export. Public articles use `/blog/?post=slug`.
- Session recovery is separated by user and cleared on logout.
- Firestore Standard database is in Johannesburg (`africa-south1`), with deletion protection. Billing is disabled.
- Image uploads are disabled in the production editor. Local uploads remain local.
- Profile, experience, projects and talks remain authored in templates. Medium is a metadata snapshot refreshed manually. Contact uses mailto.
- No scheduled backups, restore verification, monitoring or automatic Medium refresh is configured.

Verification: seven application tests passed; Firestore emulator tests passed for both allowed accounts, unauthorized accounts, unverified email, wrong identity provider, draft privacy and schema validation. Live anonymous published queries succeeded; unrestricted queries were denied. A real Google popup login and complete browser publication cycle still require verification; the embedded browser closed its popup.

No ownership invitations or billing changes were made. The earlier university project is unused.
