---
title: Hawkeye
icon: H
cover: red
summary: Theft detection for retail stores that runs on an edge box beside the cameras, from detection and tracking to rules, evidence clips, and staff alerts.
status: Active
domain: AI
stack: [Python, Go, YOLOv5, SQLite, React, n8n]
role: Creator
year: 2026
---
## Problem

Store staff can't watch every camera. The useful signal is narrow: someone picks up goods and leaves without passing the till, bags items, lingers at a shelf, or appears after hours. Staff need to hear about it in seconds, with evidence they can judge at a glance.

## Constraints

- **Run on the edge box.** A Sophgo SE5 (BM1684) with a 5.9 GB root disk and Python 3.5, alongside the vendor's own software, which must not be touched.
- **No public URL.** The box sits on a store LAN, so nothing can depend on inbound webhooks.
- **Alerts must be trustworthy.** One person should not trigger a flood, and every alert needs a snapshot and a clip.

## Architecture

```
camera ─┬─> detect + track (Python, TPU) ──NDJSON──> rules + alerts (Go) ─> Telegram
        └─> recorder (2 s segments) ───────────────> evidence clips
```

- **Detection.** The video unit decodes the stream and the TPU runs YOLOv5s int8 at about 8 analysed frames per second. A ByteTrack-style tracker follows people and assigns bags to their owners.
- **Rules.** Each track runs a state machine over store zones with weighted signals: skipping the till, bagging after a shelf, long dwell, and after hours. A track raises one event when its score first crosses the threshold.
- **Evidence and alerts.** Stream-copied segments are kept for 10 minutes, so each event gets a clip and a snapshot. Alerts go through n8n to Telegram, with buttons to confirm, dismiss, or acknowledge, and escalation when nobody responds.
- **Dashboard.** Incidents with review labels, a zone editor drawn over a live snapshot, and device health.

## Decisions & trade-offs

- **Python only where the SDK forces it.** The vendor SDK only works from Python 3.5, so detection lives there. Everything else is one static Go binary, joined by NDJSON over a pipe, so detection can be replayed from a file.
- **Explainable rules before learned models.** Weighted zone rules can be explained to a store manager, tuned per store, and tested deterministically.
- **Snapshot first, clip as a reply.** Waiting for the clip made alerts take 25 to 33 seconds. Sending the event's exact frame first cut that to a median of 1.9 s.
- **Signed buttons, no sessions.** Each button carries the event ID and an HMAC token, so the workflow keeps no state and a token only works for its own event.

## Impact

Version 0.1 runs live on the box against a test stream: 8 analysed frames per second per camera, a snapshot in Telegram a median of 1.9 s after the event, and the clip a median of 19 s after. On the test video, the tracker follows 8 people as 8 IDs, with no switches or splits.

## What I’d do differently

Hawkeye has not been measured on real store footage yet. The evaluation harness is ready, and its precision and recall should set the alert threshold before anything else is tuned.
