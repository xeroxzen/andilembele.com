---
title: Project Atlas
icon: A
cover: brown
summary: The onboarding, offboarding, and seat-planning control plane ZimWorx runs for nearly 2,000 team members across Zimbabwe, Zambia, and Costa Rica.
status: Active
domain: Operations
stack: [Django, React, PostgreSQL, AWS Cognito]
year: 2024–2026
role: Lead Engineer and Architect
links:
  caseStudy: /blog/project-atlas/
---
## Problem

ZimWorx seats nearly 2,000 people across high-rise floors in three countries, each working for a client on that client's US timezone. Before Atlas, seating lived in manual plans: "where can the new hire sit?" meant counting by hand, and every move risked a double-booking.

## Architecture

A Django REST backend, a React frontend, and PostgreSQL. Floors are laid out on a grid of zones and clusters, with seventeen seat statuses, because "empty" and "available" are not the same thing. Every seat links to a person and every person to a client, with full history. Work hours follow each client's timezone, and admin, manager, and staff permissions run on AWS Cognito with an audit trail of every change.

## Decisions & trade-offs

The first version fetched a floor, then its zones, then clusters, then seats, then people: 15 to 20 dependent requests per page, with N+1 queries behind most of them. I redesigned the API around how the screen is read rather than how the tables are stored: one endpoint returns a whole floor as a tree, cached for 60 seconds; hot paths use `select_related` and `prefetch_related`; serializers carry only what the map draws; and React Query keeps recent floors warm.

## Impact

- API calls per page: 15–20 down to 1–2
- Page load: 3–5 seconds down to under 2
- Database queries per load: 100+ down to about 5
- Payloads 40% smaller, with a cache hit ratio over 80%

Atlas runs in production in all three countries and replaced the manual seating workflow, from a new hire's first desk to an offboarded seat being freed.
