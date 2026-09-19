# Pirate Battle — 2D Top-Down Naval Action

> **Live Deployment:** [Deploy Pending / Cloudflare Pages]  
> **Documentation:** [Portuguese Version (docs/pt/README_PT.md)](docs/pt/README_PT.md) | [Architecture (ARCHITECTURE.md)](ARCHITECTURE.md) | [Profiling Report (docs/profiling/PROFILING.md)](docs/profiling/PROFILING.md) | [Decision Log (TRANSPARENCY.md)](TRANSPARENCY.md) | [Requirements Matrix (docs/requirements/REQUIREMENTS.md)](docs/requirements/REQUIREMENTS.md)

A high-performance **2D top-down naval combat simulator** engineered with **React 19**, **PixiJS v8**, **TypeScript (Strict Mode)**, **TanStack Query v5**, **Axios**, **MSW v2**, and validated with an exhaustive suite of **34 automated Playwright E2E and visual tests**.

---

## 1. Clean Checkout & Quick Start

This project has **zero private dependencies** or proprietary third-party subscriptions. Any evaluator can clone the repository and run the full stack locally with standard Node.js (v18+ or v20+ recommended):

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

Visit `http://localhost:3000` in any modern desktop or mobile browser.

### Available npm Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server at `http://localhost:3000` with MSW active |
| `npm run build` | Compiles TypeScript and builds production bundles with optimized chunking |
| `npm run preview` | Serves the production build locally at `http://localhost:3000` |
| `npm run typecheck` | Validates TypeScript in strict mode with zero code emission (`tsc --noEmit`) |
| `npm run test:e2e` | Executes all 34 Playwright tests in Chromium (desktop + mobile) |
| `npm run test:report` | Opens the pre-generated interactive HTML Playwright report |
| `npm run test:profile` | Runs the automated 60 FPS telemetry and 5-cycle memory stability benchmark |

---

## 2. Controls & Input Mapping

The naval physics simulation supports **simultaneous steering, cruising, and weapon discharges** across both desktop keyboards and mobile touchscreens:

| Action | Desktop Keyboard | Mobile Touch Control |
| :--- | :---: | :---: |
| **Accelerate Forward (Cruise)** | `W` or `ArrowUp` | D-Pad Up Button / Virtual Joystick |
| **Steer Port (Turn Left)** | `A` or `ArrowLeft` | D-Pad Left Button / Virtual Joystick |
| **Steer Starboard (Turn Right)** | `D` or `ArrowRight` | D-Pad Right Button / Virtual Joystick |
| **Bow Cannon (1 Frontal Shot)** | `Space` | Red Cannonball Button (Front) |
| **Port Broadside (3 Shots Left)** | `Q` | Blue Dual-Cannon Button (Left) |
| **Starboard Broadside (3 Shots Right)** | `E` | Blue Dual-Cannon Button (Right) |
| **Pause Game / Resume** | `Escape` | Top-Right Pause Button (`II`) |
| **Fullscreen Toggle** | On-screen button | Built-in Fullscreen / iOS Safari Guidance Modal |

---

## 3. Gameplay Architecture & Features

### Authentic Sail & Water Physics
- **Forward Momentum & Inertia:** Ships accelerate up to terminal velocity with realistic drag deceleration; no arcade reverse gear.
- **Dynamic Ship Wakes:** High-speed sailing produces dual expanding foam trails along the stern hull.
- **Ballistic Artillery:** Cannonballs travel along heading normals with smoke plumes and individual cooldowns (Front: 0.45s; Broadsides: 1.2s).

### Enemy AI Behaviors
- **Chaser (`EnemyChaser`):** Aggressively steers towards player coordinates, rams into the player dealing 35 damage, and detonates without granting score points.
- **Shooter (`EnemyShooter`):** Employs kiting distance heuristics (~320px), aligns its bow, and fires periodic cannonballs on an independent 1.8s cooldown.

### Destruction Choreography & Archipelago Coastlines
- When a ship sinks, its hull converts into an underwater wooden wreck with smoke and fire.
- Escaped crew members (swimmers and dinghies) navigate toward the nearest sand shoreline using orthogonal tangent projection and anchor safely on the beach.
- Passing ships generate bow waves that push swimming castaways outward without damaging them or clipping into solid island terrain.

---

## 4. Gameplay Configuration (Options Screen)

The **Options** screen allows live tuning of match balance, saved instantly to `localStorage`:

- **Game Session Time:** Configurable from **60 to 180 seconds** (Default: 90s).
- **Enemy Spawn Interval:** Configurable from **2.0 to 10.0 seconds** (Default: 3.5s).
- **Archipelago Visual Theme:** Switch seamlessly between **Asset Pack 1 (Verdant Tropics)** and **Asset Pack 2 (Sandy Atolls)**.

All options take effect upon initiating a new voyage via snapshot configuration.

---

## 5. Network Scenarios & Fault Injection (MSW)

The top-right **"Network Scenarios" drawer** (or Captain's drawer) allows instant runtime verification of MSW network conditions:

| Scenario | Simulated Behavior | System Response |
| :--- | :--- | :--- |
| **Success (Default)** | Normal HTTP 200 responses with realistic 80ms latency | Instant ranking and history loading |
| **Slow Latency** | 2000ms delay on all API routes | Shows skeleton loaders; prevents race conditions |
| **Empty State** | Returns HTTP 200 with 0 records | Renders pirate empty state cards with zero errors |
| **Network Failure (500)** | Returns HTTP 500 Internal Server Error | Triggers retry policies and displays accessible error alerts |
| **Offline Resilience** | Disconnect simulation on match finish | Queues match in `localStorage` offline queue; allows immediate replay |
| **Reset State** | Restores seed fixtures and clears offline queues | Clean slate for fresh validation runs |

---

## 6. Test Reports & Performance Profiling

All evaluation reports are pre-compiled and versioned in the repository:

- **Playwright Test Report:** Located at `reports/playwright-report/index.html`. Run `npm run test:report` to open the full interactive test runner dashboard showing all 34 passing specs.
- **Automated Test Results (JSON):** Located at `reports/test-results.json`.
- **Profiling & Memory Stability Report:** Detailed in [docs/profiling/PROFILING.md](docs/profiling/PROFILING.md) and [docs/profiling/PROFILING_PT.md](docs/profiling/PROFILING_PT.md), featuring empirical V8 Heap measurements across 5 consecutive play/exit cycles and $p_{95}$ frame time telemetry.
- **Raw Telemetry Metrics:** Stored in `reports/profiling-data.json`.

---

## 7. Accessibility (WAI-ARIA)

- **Keyboard Navigation:** Full Tab, Shift+Tab, and Arrow key navigation across all interactive elements with high-contrast golden focus rings (`focus-visible:ring-4 focus-visible:ring-amber-400`).
- **Focus Trap:** Active on the Pause Modal, Match Result Dialog, and Network Drawer via `useFocusTrap` hook.
- **Screen Reader Support:** ARIA live region announcements (`aria-live="polite"`) broadcast match status (e.g. voyage paused, low health alert, ship destroyed) without flood spamming.
