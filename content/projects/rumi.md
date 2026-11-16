---
title: Rumi
icon: R
cover: purple
summary: An autonomous job-intelligence agent that reduces roughly 4,600 daily postings from 77 company boards to a short, evidence-backed shortlist.
status: Live
domain: AI
stack: [Python, Claude, GitHub Actions]
role: Creator
year: 2026
links:
  caseStudy: /blog/rumi/
---
## Problem

For an engineer in Zimbabwe, most "remote" postings are noise: remote within the US or the EU, stated in paragraph six. Reading everything by hand cost hours every morning and still missed things.

## Constraints

"Remote" hides two separate questions: can this employer hire someone where I live, and where do I sit? A residence visa is not a work permit, so keyword filters alone can't answer either one.

## Architecture

```
collect → normalize → filter → judge → contacts → render → send
 4,600     ~3,300      ~400    Haiku,    GitHub,    HTML,   07:00
postings   unique   survivors  then Opus LinkedIn   text    Gmail
```

Ten sources and 77 Greenhouse, Lever, and Ashby boards feed one pipeline. It runs on a GitHub Actions schedule and commits its own history back, so there is no server to keep alive.

## Decisions & trade-offs

- **Deterministic work first, the model last.** Stale, region-locked, or wrong-discipline postings are dropped before any model reads them. Every posting a filter rejects for free is one I never pay to judge.
- **Two models.** Claude Haiku triages survivors in batches; Claude Opus scores the best 15 in depth. Swapping the deep model for Sonnet cuts cost roughly fivefold.
- **Every verdict shows its basis.** Eligibility notes quote the posting where it was explicit, so a wrong call is easy to spot and correct through a plain feedback file.

## Impact

A typical morning ends with 4 to 10 roles, each with pay, odds, ghost-posting flags, and a person to contact. A run costs about $0.35 to $0.70, and the code carries 150+ tests with ruff and pyright clean.
