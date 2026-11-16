---
title: Ferrite
icon: F
cover: orange
summary: Rust crates and a CLI for ZKTeco biometric and access-control devices, with feature parity with pyzk. Published on crates.io.
status: Active
domain: Hardware
stack: [Rust, Tokio]
role: Creator
year: 2026
featured: 3
links:
  live: https://crates.io/crates/zkctl
  repo: https://github.com/xeroxzen/ferrite-zk
---
## Problem

ZKTeco attendance and door controllers sit in thousands of offices, and most software that talks to them is a Python library from another era. I wanted a client that is typed, async, and easy to embed in a service or run from a shell.

## Architecture

Three crates, split so the protocol can be tested without a device or a network:

- **zkteco-proto** is a sans-IO implementation of the protocol: packets, checksums, the comm key, record layouts, and time encoding.
- **zkteco-client** is an async Tokio client over TCP and UDP for device data, live events, and enrolment.
- **zkctl** is the command-line tool: device info, users, attendance export, live event streaming, and diagnostics.

> [!NOTE] Alpha
> Version 0.1.0-alpha.2 is tested against a mock device only. If you have a ZKTeco device and can run a few commands, reports are welcome on GitHub.
