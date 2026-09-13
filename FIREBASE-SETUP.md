# Firebase setup

Selected project: `andile-portfolio-personal`  
Project number: `148876622162`  
Console: https://console.firebase.google.com/project/andile-portfolio-personal/overview

This dedicated project is owned by the operator's personal Google account. It has no parent organization and billing is disabled. `.firebaserc` selects this project; always use an explicit project and account when provisioning services. The Firebase CLI still has the university login; authenticate the personal account before using it for this project. Provisioning here used the explicitly selected personal Google Cloud account.

## Remaining integration

The current live Sites deployment remains static. Registering Firebase does not enable remote CMS features. Before enabling live admin:

1. Choose the permanent Firestore region and create the database with deny-by-default rules.
2. Configure authentication and an explicit server-enforced administrator role. Verify unknown accounts cannot read drafts or write content.
3. Connect the editor to Firestore and migrate any posts. Add a content model for profile, projects, talks and site settings if they should be CMS-editable.
4. Connect public queries to published content and add native article routes. Medium needs an intentional refresh schedule.
5. Obtain billing approval before enabling Cloud Storage, which requires Blaze. Add private draft-media handling and validated image uploads.
6. Add backups, restore checks, error monitoring and end-to-end publication tests.
7. Keep Firebase configuration separate from content. Never place admin credentials or service-account keys in browser code.

## Handover

Confirm Andile's Google account. Add him as Owner and verify he accepts and can administer the project. If billing is added later, move it separately to his billing account before removing the temporary owner. Do not remove existing owner access before verification. No invitations or billing changes have been made.

The earlier university project `andile-portfolio-20260912` is unused. Its organization blocks project export; do not use it for this website's backend.

Registered web app ID: `1:148876622162:web:72e3cfadcf1aa1ac2e228b`. The SDK is not connected to the website yet.
