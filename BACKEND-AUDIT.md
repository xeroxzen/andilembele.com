# Backend readiness audit

Verified 2026-09-12 against the current checkout. Seven automated tests passed. This is not a production security certification.

| Area | Current state |
| --- | --- |
| Public website | Static HTML, CSS, images, and browser JavaScript deployed through Sites. |
| Public blog | Medium metadata snapshot compiled into the deployment. Refresh requires `npm run sync:medium`, a build, and deployment. No scheduled refresh exists. |
| Live `/admin` | Setup information only. No working remote CMS or sign-in. |
| Local CMS | Dashboard, post creation/editing/deletion, draft visibility, preview, imports/exports and uploads. JSON/files under local `data/`; currently no saved posts or media. |
| Local authentication | Optional environment password; loopback-only server. Password verification, session protection, logout and login throttling tested. Not suitable for public deployment as-is. |
| Production authentication/database/storage | Not provisioned or connected. |
| Profile, experience, projects and talks | Authored directly in `templates/home.html`; not database-managed. |
| Shared footer | One component, `components/footer.mjs`; all page builds tested for parity. |
| Contact | Mailto link, not a contact-form email backend. |
| Native post publishing | Local published posts are not exported into the current public Sites blog. |
| Backups | Manual local exports exist. Scheduled cloud backups and restore verification do not. |

## Limitations to resolve before remote administration

- Add owner authentication and server-enforced authorization for every privileged read/write.
- Use durable post/media storage. Keep draft assets private; the local media route is currently public to local clients with the URL.
- Replace local in-memory sessions/rate limits with production-appropriate controls.
- Fully decode/re-encode uploaded images; the local upload handler currently checks signatures and size, not complete image validity.
- Add publication of native posts, scheduled Medium refresh, backups and a verified restore workflow.
- Move portfolio content into a validated content model if it must also be editable from admin. Static authored content is real content, but is not dynamic CMS content.
- Configure production error monitoring and prove real end-to-end login, draft, publish, edit, delete and logout behavior before calling the backend complete.

## Firebase initialization and handover

Create a dedicated project under the chosen account. Do not attach existing projects, production data, service accounts, or billing implicitly. Start without billing; Firebase Cloud Storage requires the Blaze plan before online image uploads can be enabled.

Project ownership can be handed over through IAM. Later, add Andile's confirmed Google account as owner, let him accept and verify access, separately move any billing to his billing account, and only then remove Thabhelo's access. Keep the same project and data; organization policies can restrict cross-organization transfers. Do not send an owner invitation until his Google account is confirmed.

References:
- https://support.google.com/cloud/answer/7283495
- https://firebase.google.com/docs/projects/iam/overview
- https://docs.cloud.google.com/billing/docs/how-to/modify-project
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024

Firebase project `andile-portfolio-20260912` and web app `1:325889031709:web:1e332d91c04ddbb55410f4` were created under the user-selected university account. Verified active state, that account's Owner role, and `billingEnabled: false`. No database, authentication provider, storage bucket, or live CMS integration was created.

The project was automatically parented to the university organization. Effective `iam.allowedPolicyMemberDomains` permits external members, but `resourcemanager.allowedExportDestinations` is DENY. Thus an external owner grant is not equivalent to removing university control. Further service initialization is paused pending the user's choice: personal-account project for independent handover, or knowingly continue inside the university organization. No organization policies were modified.


## Personal-account replacement

The user selected the personal account after the university export restriction was found. New project: `andile-portfolio-personal` (project number `148876622162`). Verified ACTIVE, owned by the selected personal account, with no organization parent and no billing account. This is the project selected in `.firebaserc` for future Firebase work. The university project is unused and has not been deleted or granted external access.

The absence of a parent organization removes the university export-policy dependency. When Andile is ready, confirm his Google account, grant Owner, verify acceptance/access, transfer any separately enabled billing, and then remove the temporary owner's access. No ownership invitations have been sent.
