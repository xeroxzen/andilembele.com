# Backend readiness — 2026-09-13

Production builds connect directly to Firebase Authentication and Firestore in `andile-portfolio-personal`. Firestore rules enforce access on the server; the browser allowlist alone is not a security boundary.

- Google sign-in enabled. Only verified Google accounts `thabheloduve@gmail.com` and `andilembele020@gmail.com` can read drafts or manage posts.
- Public readers can query published posts only. Drafts and all other collections are denied.
- Editor supports text drafts, publishing/unpublishing, editing, slug changes, deletion, Markdown preview and import/export. Public articles use `/blog/?post=slug`.
- Session recovery is separated by user and cleared on logout.
- Firestore Standard database is in Johannesburg (`africa-south1`), with deletion protection. Billing is disabled.
- Image uploads are disabled in the production editor. Local uploads remain local.
- Profile, experience, projects and talks remain authored in templates. Medium is a metadata snapshot refreshed manually. Contact uses mailto.
- Daily private local snapshots and Sunday Medium refresh are scheduled through Codex on this Mac. The first snapshot contained zero posts. This requires the Mac and its authorized login; independent cloud backups and monitoring remain unconfigured.
- Restore imports up to 100 text posts as drafts, refuses existing slugs atomically, and validates metadata. Round-trip and collision tests use the Firestore emulator, not a production browser session.
- Both custom domains are registered pending DNS validation. DNS and email routing are unchanged; exact records are in DOMAIN-SETUP.md.

Verification: seven application tests passed; Firestore emulator tests passed for both allowed accounts, unauthorized accounts, unverified email, wrong identity provider, draft privacy and schema validation. Live anonymous published queries succeeded; unrestricted queries were denied. A real Google popup login and complete browser publication cycle still require verification; the embedded browser closed its popup.

No ownership invitations or billing changes were made. The earlier university project is unused.
