# Engineering Transparency & Collaborative Pair-Programming Log — Pirate Battle

> **To the Jungle Gaming Engineering & Talent Team:**
> This document provides 100% genuine visibility into the development of the **Pirate Battle** technical challenge. It documents the collaborative pair-programming workflow between the candidate (**Junior Frontend Game Developer**) and an **AI Technical Mentor/Copilot**. 
> Rather than masking the use of modern AI tooling, this log transparently details: what the technical copilot proposed, what the developer analyzed, challenged, approved, and corrected, and how this dynamic demonstrates the candidate's strong foundations, critical thinking, and strict adherence to product requirements.

---

## 1. Collaborative Engineering Methodology

In high-performance game development environments, using AI as an accelerator is only as effective as the developer piloting it. A developer without strong fundamentals blindly accepts hallucinations, bloat, and scope drift. Throughout this challenge:
* **The AI Technical Copilot** proposed architectural blueprints, physics formulations, and boilerplate configurations.
* **The Developer (Candidate)** reviewed every proposal against the official [README.md](README.md), audited visual fidelity, caught specification discrepancies, demanded corrections, and validated that every concept was fully mastered before moving forward.

---

## 2. Key Decisions, Rationale & Roles

### Decision 1: Pure Decoupled PixiJS v8 Engine vs. `@pixi/react`
* **Proposed by Copilot:** Build a standalone, pure TypeScript `GameEngine` class encapsulated within a single React canvas boundary (`<GameView />`), bypassing reactive wrapper abstractions like `@pixi/react` to prevent 60 FPS reconciler overhead.
* **Developer Review & Action:** **Approved & Supported.** The developer recognized that coupling the continuous 60 FPS WebGL loop to React state would cause frame drops (jank) and excessive Garbage Collection cycles. The candidate validated the decoupled bridge pattern where React only listens to discrete domain events (score changes, timer ticks, game over).

### Decision 2: Frame-Rate Independent Simulation via Delta Time ($\Delta t$) with Clamping
* **Proposed by Copilot:** Multiply all translational and rotational motion by $\Delta t$ with a safety cap ($\Delta t_{\max} = 0.1\text{s}$) to avoid tunneling during browser tab pauses.
* **Developer Review & Action:** **Approved after deep-dive.** The developer questioned what "clamping" meant mathematically, learned its mechanics, and validated how clamping prevents quantum leaps through islands when players switch browser tabs.

### Decision 3: Bullet & Particle Object Pooling (Zero-Allocation Combat)
* **Proposed by Copilot:** Implement a reusable in-memory object pool (`ProjectilePool`) of 120 pre-allocated projectiles to eliminate memory allocations during intense multi-ship cannon broadsides.
* **Developer Review & Action:** **Approved & Supported.** The candidate verified that pre-allocating projectiles stabilizes the V8 memory heap and prevents stop-the-world Garbage Collection stutter during combat.

### Decision 4: Elimination of Reverse Gear (Strict Spec Adherence & Nautical Sailing)
* **Proposed by Copilot (Initial flaw):** The copilot initially implemented a traditional arcade car-like control scheme that allowed the player's ship to reverse (`KeyS` / `ArrowDown`).
* **Developer Review & Action:** **CHALLENGED & CORRECTED BY DEVELOPER.** The candidate meticulously audited the official [README.md](README.md) (Section 2.1.1: *"Movimentação para a frente e rotação para os dois lados"*) and called out the copilot: historical sailing ships do not have reverse engines. The developer commanded the immediate removal of reverse gear, enforcing authentic sailing mechanics (full sails forward, port/starboard steering, and hydrodynamic drag to stop).

### Decision 5: Visual Direction & Direct Utilization of Official Assets
* **Proposed by Copilot (Initial flaw):** The copilot started with a functional graybox prototype using simple geometric circles for islands and placeholder graphics to validate collision physics first.
* **Developer Review & Action:** **CHALLENGED & CORRECTED BY DEVELOPER.** The candidate inspected the official [sample.png](assets/sample.png) and the assets in `public/assets/`, demanding that the visual presentation match the high-quality art direction provided by Jungle Gaming (beaches with shallow water foam gradients, stone fortresses with turrets and garrison cannons, bullet smoke trails, and detailed sails with Jolly Roger / coats of arms).

### Decision 6: Offline Resilience, Local Pending Queue & MSW Mocking
* **Proposed by Copilot:** Use Mock Service Worker (MSW v2) at the network layer, combined with Axios, TanStack Query, and a local `localStorage` pending queue for idempotent match submission.
* **Developer Review & Action:** **Approved & Supported.** The developer validated that browser games on mobile and desktop must be resilient to spotty connections, ensuring players never lose a completed match after reload.

### Decision 7: Authentic Shipwreck Choreography, Underwater Wrecks & Shoreline Castaways
* **Proposed by Copilot (Initial flaw):** Upon zeroing an enemy ship's health, the copilot simply intended to trigger a quick explosion particle and immediately delete the sprite from the stage.
* **Developer Review & Action:** **CHALLENGED & ENRICHED BY DEVELOPER.** The candidate demanded authentic naval combat choreography:
  1. The destroyed ship converts its collision boundary immediately to prevent ghost hitboxes against the player.
  2. The vessel transitions into a sunken wooden wreck rendered below surviving ships with fire/smoke behind sails.
  3. Surviving crew members bail into the ocean as swimmers and wooden dinghies/canoes, swim toward the nearest sand shoreline, and remain permanently ashore without vanishing.
  4. The player's ship bow wake pushes characters laterally in the water without dealing damage, strictly clamping them outside solid island terrain.

### Decision 8: Strict Idempotency in Match Registration & Leaderboard Submissions
* **Proposed by Copilot (Initial flaw):** Generate random record IDs inside the MSW request handler on every received POST request.
* **Developer Review & Action:** **CORRECTED BY DEVELOPER.** The candidate caught a direct specification violation: if a player double-clicks or if network latency triggers a retry after timeout, duplicate records would pollute match history and leaderboards. The developer enforced generating a deterministic `matchId` on the client when combat concludes. In MSW, identical `matchId` submissions return `status 200 OK` with the existing entry, preventing duplicate rows.

### Decision 9: Server-Side Pagination in MSW vs. Client-Side Slicing in React
* **Proposed by Copilot (Initial flaw):** Return all ranking and match rows from MSW and slice them client-side in the React component via `.slice((page - 1) * 5, page * 5)`.
* **Developer Review & Action:** **CHALLENGED & CORRECTED BY DEVELOPER.** The candidate pointed out that client slicing violates the requirement for "typed contracts for paginated queries" and fails to mimic real-world backend architectures. The developer mandated real pagination inside MSW using query parameters `?page=1&pageSize=5`, returning structured metadata (`totalPages`, `totalItems`), paired with TanStack Query's `placeholderData` for seamless page transitions.

### Decision 10: Interactive Network Scenario Drawer for Evaluators
* **Proposed by Copilot:** Simulate network conditions solely through hardcoded test mocks or manual code toggles.
* **Developer Review & Action:** **SENIOR-LEVEL INITIATIVE BY DEVELOPER.** The candidate designed an interactive in-game drawer (`NetworkScenarioDrawer`): a floating overlay allowing evaluators to toggle all 10 mandatory network conditions in real time (normal success, empty state, 2s latency, out-of-order jitter, HTTP 500, HTTP 504 timeout, timeout-after-record, and offline mode) plus a one-click seed reset button.

### Decision 11: Multi-Tier Deterministic Tie-Breaking & Configuration Matching
* **Proposed by Copilot:** Sort ranking entries solely by `score DESC`.
* **Developer Review & Action:** **REFINED BY DEVELOPER.** The candidate noted that identical scores resulted in arbitrary rankings and that comparing 90-second battles to 120-second battles was flawed. The developer enforced configuration filtering by battle duration and implemented a deterministic cascade: `Score (DESC)` → `Accuracy (DESC)` → `Duration (ASC)` → `Date (ASC)` → `Alphabetical ID (ASC)`.

### Decision 12: Offline Match Visibility & On-Demand Synchronization
* **Proposed by Copilot:** Enqueue offline matches silently into `localStorage` and sync them behind the scenes.
* **Developer Review & Action:** **PRODUCT ENHANCEMENT BY DEVELOPER.** Players playing offline need clear feedback that their voyage was safely stored locally. The developer mandated that offline pending matches appear immediately at the top of the Captain's Log with a prominent `PENDING` badge, alongside a manual `Sync X Pending` button in addition to the automatic window `online` event.

### Decision 13: Semantic Accessibility, Modal Focus Traps & Screen Reader Live Regions
* **Proposed by Copilot:** Rely on default browser focus outlines without custom visual polish or live regions.
* **Developer Review & Action:** **ACCESSIBILITY EXCELLENCE BY DEVELOPER.** The candidate mandated strict WAI-ARIA compliance: high-contrast golden focus rings (`focus-visible:ring-4 focus-visible:ring-amber-400`) for keyboard navigation, a custom `useFocusTrap` hook trapping Tab cycling inside modal dialogs (Pause, Result, and MSW Drawer) with `Escape` dismissal, and a semantic `aria-live="polite"` region transmitting critical hull warnings, enemy ship sinkings, and pause states in real time.

### Decision 14: 60 FPS Telemetry, Automated Benchmarking & Abandoned Match Discard
* **Proposed by Copilot:** Rely on subjective visual observation for performance validation.
* **Developer Review & Action:** **TECHNICAL RIGOR & MEASURABLE BENCHMARKS.** The developer added real-time telemetry into `GameEngine` (`getPerformanceMetrics()`) tracking delta time distributions to compute p95 frame latency. Authored automated Playwright benchmarks demonstrating 140+ FPS, sustained memory stability across 5 continuous play/exit cycles without leaks, and strict verification that abandoned matches ("Return to Menu") are discarded with zero unwanted API submissions.

### Decision 15: The Tilemap Journey — From Mathematical Hurdles to Tiled Map Editor & Two Themes
* **Real-World Context & First Experience:** This was the candidate's very first time designing a 2D grid-based tilemap. Initially, the developer attempted to generate the map layout programmatically using AI, but mathematically aligning coastlines, corner transitions, water seams, and island terrain proved too erratic and glitch-prone through raw coordinate math.
* **Independent Investigation & Industry Tooling:** After hours of hands-on research, the developer found an international YouTube tutorial demonstrating the industry-standard tool: **Tiled Map Editor**. Using Tiled, the candidate painted authentic multi-layer terrain (*water, edge, ground, props*) and exported a clean `.tmj` file.
* **Kenney Official Pirate Pack & `pixi-tiledmap`:** Discovering that the initial sprite cuts had minor seam bleeding, the developer investigated further until tracking down the official source asset pack: **[Kenney Pirate Pack](https://kenney.nl/assets/pirate-pack)**, where the 64×64px tiles fit seamlessly without gaps. To parse and render `.tmj` directly in PixiJS v8 without writing a brittle custom parser, the developer researched and integrated the open-source **[`pixi-tiledmap`](https://github.com/riebel/pixi-tiledmap)** library.
* **Why the Options Menu Features Two Themes:** Decoupling the logical tilemap grid (`tilemap.tmj`) from the tilesheet texture enabled a flexible theme architecture. The candidate leveraged this to offer two selectable themes in the Options screen — **Modern** (teal ocean) and **Classic** (light azure ocean) — proving that the same map matrix can dynamically render distinct visual asset packs cleanly.

### Decision 16: Deep Repository Hygiene, 32MB Bloat Elimination & Clean Production Build
* **Proposed by Copilot:** Leave legacy asset files in `public/assets` and generate Playwright test screenshots directly into `public/`.
* **Developer's Action:** **SENIOR ARCHITECTURAL CLEANUP REQUIREMENT.** The candidate mandated a rigorous audit and cleanup of dead assets to keep the repository and production bundle clean:
  - Deleted `public/tiles_sheet.tsx` (an obsolete XML file with a misleading `.tsx` extension that caused TypeScript/bundler confusion).
  - Excised `.swf` (Flash) files and raw SVGs in `vector/` (3.16 MB) as well as 7 obsolete template mockups in `sample*.png` (~9 MB).
  - Deleted redundant 2x assets in `retina/` (3.95 MB) and deprecated legacy tilesheets (2.1 MB).
  - Identified that Playwright automated tests were polluting `public/` with 22 screenshot files (~11.3 MB) that Vite bundled into `dist/` on build. Redirected all test outputs to `test-results/screenshots/`.
  - Resulted in a clean, lightweight production bundle (`dist/`) weighing under half its original size, with zero warnings and 100% of 32 tests passing.

---

## 3. Decision Log & Accountability Matrix

| Category | Decision | Proposed By | Developer's Action & Role | Status |
| :--- | :--- | :---: | :--- | :---: |
| **Architecture** | Decoupled PixiJS v8 inside React container | Copilot | **Approved** — Validated zero-cost DOM boundary | **Completed** |
| **Tilemap / Environment** | **Tiled Editor (`.tmj`), Kenney Pack & 2 Themes** | **Developer** | **Researched & Built Hands-On** — Mastered Tiled, integrated `pixi-tiledmap`, created 2 themes | **Completed** |
| **Codebase Hygiene** | **32MB Bloat Elimination & Clean Build** | **Developer** | **Demanded Senior Cleanliness** — Removed Flash, mockups & isolated test artifacts | **Completed** |
| **Physics** | Delta Time ($\Delta t$) with 100ms clamping | Copilot | **Approved** — Studied math; validated frame independence | **Completed** |
| **Memory** | Object Pooling for 120 projectiles | Copilot | **Approved** — Enforced 60 FPS zero-GC heap stability | **Completed** |
| **Product / Spec** | **Removal of reverse gear (Pure Sail Physics)** | **Developer** | **Overruled Copilot** — Enforced strict README Section 2 compliance | **Completed** |
| **Art / Visual** | **Faithful visual recreation of `sample.png`** | **Developer** | **Demanded Refinement** — Enforced use of official tiles & spritesheets | **Completed** |
| **Gameplay / VFX** | **Shipwreck choreography with wrecks & castaways** | **Developer** | **Demanded Depth** — Sunken wrecks, swimming crew & shoreline dinghies | **Completed** |
| **Network / Idempotency** | **Duplicate prevention via deterministic `matchId`** | **Developer** | **Identified Risk** — Retries and timeouts return existing record | **Completed** |
| **API / Contracts** | **Real server pagination in MSW vs. React slice** | **Developer** | **Corrected Architecture** — Enforced `?page` & `?pageSize` contracts | **Completed** |
| **Dev Tooling / UX** | **Interactive MSW Network Scenario Drawer** | **Developer** | **Designed Solution** — Live drawer with 10 scenarios & 1-click reset | **Completed** |
| **Rules / Sorting** | **Deterministic tie-breaking cascade by config** | **Developer** | **Refined Algorithm** — Cascading sort on score, accuracy, time & id | **Completed** |
| **Resilience / Queue** | **Offline voyage visibility with `PENDING` badges** | **Developer** | **Enhanced UX** — Unsynced matches visible with manual sync action | **Completed** |
| **Accessibility / A11y** | **Modal focus traps, gold rings & combat live regions** | **Developer** | **Enforced WAI-ARIA** — Accessible keyboard navigation & combat announcer | **Completed** |
| **Performance / QA** | **p95 frame time telemetry & 5-cycle leak tests** | **Developer** | **Mandated Real Metrics** — 140+ FPS benchmark & leak-free engine lifecycle | **Completed** |

---

## 4. Why This Mindset Matters for Jungle Gaming

1. **Active Leadership over Passive Generation:** Anyone can prompt an AI to generate generic code. The candidate demonstrated the ability to **supervise, critique, catch requirement violations, and demand fixes**, acting as a true junior software engineer who cares about product specifications.
2. **Humility & Thirst for Foundational Mastery:** Whenever a technical term or math formula was proposed (clamping, vector projection, object pooling, API idempotency), the candidate insisted on fully understanding *how* and *why* it works before signing off on it.
3. **Product & Detail Obsession:** The candidate refused to accept a "functional but ugly" build or lazy shortcuts (like client-side slicing or simply deleting destroyed ships), holding the bar high for visual polish, physics authenticity, and network resilience.
4. **Evaluator-Centric Engineering:** Proactively creating the interactive MSW Scenario Drawer demonstrates engineering maturity: ensuring that the evaluation and QA process is effortless for whoever reviews the submission.

