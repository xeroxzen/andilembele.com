---
title: Restowa
icon: R
cover: brown
summary: A macOS menu bar app and CLI that restores Claude Code, Codex, OpenCode, and Antigravity sessions after a restart, each in its own terminal tab and folder.
status: Active
domain: AI
stack: [Rust, SQLite, SwiftUI, launchd, Homebrew]
role: Creator
year: 2026
links:
  repo: https://github.com/xeroxzen/restowa
---
## Problem

I run several AI coding agents at once, each in its own terminal tab and folder. The agent CLIs already save every session to disk. What a reboot, crash, or forced macOS update loses is the set of sessions I had open, and rebuilding it by hand meant hunting for session IDs across four tools.

## Constraints

- **Observe, never interfere.** Restowa must not write to the agents' data folders, signal their processes, or attach to them.
- **Nothing resident.** No daemon left running, no network access, no analytics.
- **Invisible hooks.** The Claude Code hook has to finish in under 50 ms, print nothing, and always exit 0, so it can never slow down or break a session.

## Architecture

A single Rust binary records sessions from two sources:

- **Claude Code hooks.** `SessionStart` and `SessionEnd` hooks are merged into `~/.claude/settings.json`, after a backup, so Claude sessions are recorded exactly.
- **A 2-minute launchd scan.** For Codex, OpenCode, and Antigravity, the scan matches running agent processes to sessions by `argv`, executable path, working folder, and open files, then exits.

Everything lives in one SQLite registry. Each session stores the boot ID it was last seen live in, which is what lets `restowa restore --last-boot` reopen exactly the set that was open before the restart. Restore opens tabs in Ghostty or Terminal.app.

The SwiftUI menu bar app has no logic of its own. It calls the CLI for everything: sessions grouped by project, one-click restore of the last-boot set, pinned sessions, and switching to a running session's tab.

## Decisions & trade-offs

- **Boot IDs instead of timestamps.** "What was open before the restart" is a question about boots, not times, so the registry records boots.
- **Resume commands as config.** They are templates in `config.toml`, so a CLI that changes its flags can be fixed without a new release.
- **Say when it's guessing.** When two sessions of one tool share a folder and the scan can't tell them apart, the match is marked `(best guess)` instead of being picked silently.
- **Homebrew from day one.** A personal tap ships each release as a formula, and CI builds a universal macOS binary for every release.

## Impact

Version 0.1.0 shipped on 23 November 2026, within a day of the build spec, followed by three point releases. CI runs `cargo fmt`, `clippy`, `cargo test`, and `swift test` on every change.

## What I’d do differently

Restowa is macOS-only, and matching non-Claude sessions still relies on scanning processes. Hooks for the other agents, where they offer them, would replace the guesswork with exact records.
