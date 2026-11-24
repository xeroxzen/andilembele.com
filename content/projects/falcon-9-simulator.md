---
title: Falcon 9 simulator
icon: F9
cover: blue
summary: A 3D browser simulation of a Falcon 9 Block 5 launch and booster landing, with a deterministic physics core validated against telemetry from real flights.
status: Live
domain: Data
stack: [TypeScript, React Three Fiber, Three.js, Web Workers, Vitest, Playwright]
role: Creator
year: 2026
links:
  live: https://xeroxzen.github.io/falcon-9-simulator/
  repo: https://github.com/xeroxzen/falcon-9-simulator
---
## Problem

Most rocket animations are choreography: the booster lands because the script says it does. I wanted one where the landing is earned by the physics, and where every number on screen can be checked against a real flight.

## Constraints

- **Physics before spectacle.** The simulation core is pure TypeScript with no Three.js or DOM imports, and the 3D viewer only renders its state.
- **Honest numbers.** Every parameter is sourced, derived, or labelled as an assumption, and the live telemetry panels mark values as `SIM` or `DERIVED`.
- **No tuning on the test set.** Holdout flights and Monte Carlo seeds are never used to fit anything.

## Architecture

- **Physics core.** A deterministic 3-DOF RK4 integrator at `dt = 0.01 s` in an Earth-centred inertial frame, with a rotating WGS-84 Earth, optional J2 gravity, the US Standard Atmosphere 1976, pressure-dependent thrust, and variable mass flow.
- **Guidance.** Linear-tangent Stage 2 insertion and optimal powered descent for the booster: flip, boostback, entry burn, grid-fin descent, and a landing burn onto a droneship or landing zone.
- **Viewer.** React Three Fiber on a Web Worker physics loop, with a floating origin from the pad to orbit, seven camera modes, a timeline scrubber, and click-to-inspect panels for 13 sourced hardware components.
- **What-If lab.** Engine-out, payload mass, recovery mode, wind, and target orbit, each compared against the nominal flight.

## Decisions & trade-offs

- **Fit on some flights, test on the rest.** Vehicle parameters are fitted to 4 of 10 Falcon 9 Block 5 flights from public webcast telemetry and checked against the other 6.
- **Record what didn't work.** A falsification study of one model change is kept in the repository, and every Monte Carlo run, including superseded configurations, goes into an append-only log.
- **3-DOF, not 6-DOF.** Attitude is a rate-limited thrust vector, not full rigid-body dynamics. That keeps a 1,000-run Monte Carlo campaign practical, at the cost of slosh, bending, and gimbal torque.

## Impact

Across 6,000 Monte Carlo runs on unseen seeds, with dispersions in thrust, drag, wind, sea state, and navigation error, the booster landed in 5,999 and Stage 2 reached orbit in all of them. The median miss distance is under 1.6 m. Versions 1.0 to 1.8 shipped in five days.

## What I’d do differently

Booster descent drag is calibrated on only two flights, and Stage 2 velocity errors on the GTO-class flights are still large. More telemetry, and a 6-DOF model for the landing phase, would come before more visual features.
