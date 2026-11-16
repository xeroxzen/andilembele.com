---
title: Sentinel
icon: S
cover: red
summary: A DevSecOps control plane that inventories repositories, correlates threat intelligence, generates SBOMs, and enforces policy in CI.
status: Shipped
domain: Security
stack: [Go, PostgreSQL, Redis, NATS, OPA/Rego, Trivy, Gitleaks, GitHub App]
role: Lead Engineer and Architect
year: 2026
links:
  caseStudy: /blog/sentinel/
---
## Problem

At ZimWorx, engineers were shipping code faster than a few reviewers could audit it. Dependency review was the part that slipped: maintenance risk, fresh advisories in transitive packages, committed keys, across 50+ production repositories.

## Architecture

Sentinel doesn't replace good scanners. It orchestrates them, correlates their findings, and enforces policy across the GitHub organisation.

- **Dependency intelligence.** A CycloneDX or SPDX bill of materials per repository, transitive dependencies included, with maintenance and typosquatting risk scores.
- **Live threat intelligence.** GHSA, OSV.dev, NVD, and CISA's Known Exploited Vulnerabilities list, matched against every stored SBOM. A new advisory flags every affected repository, not just the next pull request.
- **Policy as code.** Rules in Rego, evaluated by Open Policy Agent, so "block critical vulnerabilities" is a reviewed file, not tribal knowledge.
- **Pull request gates.** A GitHub App and a reusable Action fail the check when policy returns `block`. Overrides go through an authenticated API, so exceptions are deliberate and recorded.

Go services share PostgreSQL (SBOM graphs in JSONB), with Redis and NATS distributing work and Trivy and Gitleaks doing the scanning.

## Decisions & trade-offs

Design targets set the shape: under 10 seconds from webhook to a worker, lightweight checks in under 2 minutes, full dependency scans with SBOMs in under 15, and horizontal scaling past 1,000 repositories. Fast checks gate the pull request; slow scans run behind it.

## Impact

Onboarded to 45 repositories, Sentinel surfaced more than 5,000 vulnerabilities: known CVEs, outdated libraries, and exposed secrets. Reviewers stopped auditing dependencies by hand and spent their time on design and correctness.
