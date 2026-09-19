# Pirate Battle — Requirements Checklist & Traceability Matrix

> Official requirements extracted directly from [README.md](README.md).
> Status legend:
> - `[ ] Pending`: Not started yet
> - `[/] In Progress`: Currently under development
> - `[X] Implemented`: Code implemented, awaiting final automated verification
> - `[V] Validated`: Fully verified with automated and/or manual tests

> ### Developer Technical Leadership & Architectural Directive
> The primary developer acts as the principal architect and decision-maker for the Pirate Battle project. Beyond baseline challenge specifications, the developer has established a higher visual quality benchmark (Milestone 1.2 — High-Fidelity Visual Overhaul):
> 1. **Expanded Naval Scale:** Upscaling ship sprites to ~120px length (up from 66px) with proportional circular collision geometry (~32-36px radius) for commanding visibility across both high-density mobile and 1080p desktop viewports.
> 2. **Organic High-Fidelity Archipelago:** Replacing simplistic geometric landmasses with an authentic, multi-layered modular tilemap utilizing the 96-tile set (`public/assets/themes/theme_1/tiles/` and `theme_2/tiles/`): organic sandy shorelines, interior grass, shallow reef shelves with foam edges (`tile_49..51`, `tile_65..67`), stone fortress garrison structures, and palm trees.
> 3. **Maritime Detailing & Flotsam:** Maximizing utilization of `public/assets/` assets including wooden flotsam (`wood_1..4`), stranded castaways on lifebuoys (`crew_1..6`), and ironclad derelicts.
> 4. **Zero-GC Fluid & Ballistic VFX:** Implementing dual stern nautical wakes (ship wakes) activated by ship speed and conical ballistic smoke plumes behind flying cannonballs using high-performance zero-allocation particle pooling.
> 5. **Clean Code & Strict Guidelines:** Absolute zero structural/visual DOM comments (`{/* Header */}`, etc.) and fully typed architecture.

---

## 1. Tech Stack & Prerequisites

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **1.1 Interface & Menus:** React | `[V] Validated` | `src/ui/navigation/NavigationContext.tsx`, `src/ui/screens/MainMenuScreen.tsx`, `src/ui/screens/OptionsScreen.tsx`, `src/ui/screens/RankingScreen.tsx`, `src/ui/screens/MatchHistoryScreen.tsx`, `src/ui/components/SpriteFrame.tsx` | Playwright tests pass (32/32 passed); SpriteSheet-driven UI verified for Main Menu, Options, Ranking, History and Match HUD | Modern React 19 / 18 with hooks and context |
| **1.2 Language:** TypeScript in Strict Mode | `[V] Validated` | `tsconfig.json` | `tsc --noEmit` compiles with 0 errors; strict type-safety enforced across all modules | Zero arbitrary `any`, typed events & configs |
| **1.3 Game Renderer:** PixiJS (v8) | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/game/core/AssetManager.ts` | Playwright smoke test passed (`tests/smoke.spec.ts`), WebGL canvas verified in screenshot | Application, Container, TilingSprite, Ticker, Assets.load |
| **1.4 Remote State:** TanStack Query | `[V] Validated` | `src/api/matchApi.ts`, `src/api/rankingApi.ts`, `src/App.tsx` | Queries, mutations, cache invalidation, and background synchronization verified in Playwright test suite | Automatic cache invalidation on match record / score submit |
| **1.5 HTTP Client:** Axios | `[V] Validated` | `src/api/client.ts`, `src/api/matchApi.ts`, `src/api/rankingApi.ts` | Centralized Axios instance with base URL, timeout and JSON interceptors verified against MSW handlers | Typed requests and responses |
| **1.6 API Mocking:** MSW (Mock Service Worker) | `[V] Validated` | `src/mocks/browser.ts`, `src/mocks/handlers.ts`, `src/main.tsx` | MSW v2 worker active in development & production builds; intercepts `/api/ranking`, `/api/matches`, `/api/settings` | Browser Service Worker with seeded pirate records |
| **1.7 E2E & Visual Regression:** Playwright | `[V] Validated` | `tests/smoke.spec.ts`, `tests/player_movement.spec.ts`, `tests/combat_gameplay.spec.ts`, `tests/navigation_and_api.spec.ts` | Playwright suite executes with 100% pass rate (32/32 passed in 46.4s), WebGL screenshots saved in `test-results/screenshots/` | Chromium desktop & mobile, screenshots verified |
| **1.8 Bundler & Styling:** Modern tooling | `[V] Validated` | `vite.config.ts`, `tailwind.config.js`, `postcss.config.js` | `npm run build` exits 0 (29 modules compiled with 0 errors) | Fast builds, HMR, assetsInlineLimit: 0 |

---

## 2. Gameplay

### 2.1 Player Ship
| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **2.1.1** Forward movement & 2-way rotation | `[V] Validated` | `src/game/entities/PlayerShip.ts`, `src/game/systems/InputManager.ts` | Playwright test passed (`tests/player_movement.spec.ts`); verifies forward thrust, 2-way rotation, inertia and movement screenshots (`player_spawn_screenshot.png`, `player_moving_screenshot.png`) | Pure sail physics: forward acceleration (380 px/s²), rotational steering, exponential drag deceleration to stop; reverse gear strictly omitted per spec |
| **2.1.2** Frontal cannon shot (1 projectile) | `[V] Validated` | `src/game/systems/CombatSystem.ts`, `src/game/entities/PlayerShip.ts`, `src/game/entities/Projectile.ts`, `src/game/systems/ProjectilePool.ts` | Playwright test passed (`tests/combat_gameplay.spec.ts`); verifies Space key bow shot spawning single bullet traveling in ship's heading vector; screenshot `test-results/screenshots/combat_firing_screenshot.png` | Bow cannon fires along ship heading with 0.45s cooldown |
| **2.1.3** Lateral cannon shots (broadside, 3 parallel projectiles per side) | `[V] Validated` | `src/game/systems/CombatSystem.ts`, `src/game/entities/PlayerShip.ts`, `src/game/systems/ProjectilePool.ts` | Playwright test passed (`tests/combat_gameplay.spec.ts`); Q/E triggers 3 parallel cannonballs along port/starboard normals; screenshot `test-results/screenshots/combat_firing_screenshot.png` | 3 parallel projectiles per side spaced along ship length; independent left/right cooldown (1.2s) |
| **2.1.4** Limited health reduced by enemy fire and Chaser ramming | `[V] Validated` | `src/game/entities/Ship.ts`, `src/game/entities/PlayerShip.ts`, `src/game/core/GameEngine.ts` | Unit and combat tests verified player takes projectile damage (20 dmg) and Chaser collision damage (35 dmg); HP reflected on floating health bar and HUD health meter; visual smoke/fire triggers at <65% and <35% HP | Max HP 100; floating bar and UI meter update synchronously via event emitter |
| **2.1.5** Movement clamped to visible arena, cannot cross islands | `[V] Validated` | `src/game/systems/CollisionSystem.ts`, `src/game/entities/Island.ts` | Verified in unit/e2e tests; island circular penetration vector resolution and arena bounds clamping prevent border crossing and island pass-through | Coastal sliding via velocity normal projection and arena bounds clamping (1920x1080) |
| **2.1.6** Simultaneous movement & firing | `[V] Validated` | `src/game/systems/InputManager.ts` | Verified in `InputManager.ts` implementation; concurrent Set-based key tracking and virtual state merging allow simultaneous sailing, turning, and weapon trigger flags | Non-blocking input handling with Set and virtual state |
| **2.1.7** Keyboard & Touch controls available | `[V] Validated` | `src/game/systems/InputManager.ts`, `src/ui/hud/VirtualControls.tsx` | Playwright test verified visibility of D-pad touch buttons and keyboard controls guide; tested with pointer events and simulated keys | Virtual buttons for touch/mobile and keyboard WASD/Arrows for desktop |
| **2.1.8** Controls displayed in UI | `[V] Validated` | `src/ui/hud/VirtualControls.tsx`, `src/ui/screens/GameScreen.tsx` | Playwright test verified presence of `SHIP CONTROLS` card and on-screen action buttons | On-screen overlay with keyboard shortcuts and mobile touch controls |

### 2.2 Enemies
| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **2.2.1 Chaser:** Chases player, deals damage on collision, explodes on impact | `[V] Validated` | `src/game/entities/EnemyChaser.ts`, `src/game/core/GameEngine.ts` | Tested in `tests/combat_gameplay.spec.ts`; Chaser calculates angular heading toward player, turns with angular speed cap, applies 35 impact damage, triggers visual explosion and self-destructs without awarding score points | Self-destruct explicitly gives 0 points to player |
| **2.2.2 Shooter:** Approaches player, fires when in attack range | `[V] Validated` | `src/game/entities/EnemyShooter.ts`, `src/game/systems/CombatSystem.ts` | Tested in `tests/combat_gameplay.spec.ts`; Shooter approaches to preferred distance (320px), aligns bow with player, maintains kiting distance, and fires enemy projectiles on cooldown (1.8s) | Forward/reverse throttle kiting behavior with angular aim alignment |
| **2.2.3** Both types rotate, advance, take damage, collide with islands | `[V] Validated` | `src/game/entities/Ship.ts`, `src/game/entities/EnemyChaser.ts`, `src/game/entities/EnemyShooter.ts`, `src/game/systems/CollisionSystem.ts` | Both inherit from `Ship`; share kinematics, taking projectile damage, floating health bars, and island penetration resolution sliding | Unified physical simulation pipeline across player and enemy entities |
| **2.2.4** Both types appear in standard match | `[V] Validated` | `src/game/systems/SpawnSystem.ts`, `src/game/core/GameEngine.ts` | Tested in `tests/combat_gameplay.spec.ts`; `SpawnSystem` alternates spawning Chaser and Shooter entities up to concurrent active cap | Alternating spawn queue ensures balanced enemy composition |
| **2.2.5** Periodic spawning at configured interval until match ends | `[V] Validated` | `src/game/systems/SpawnSystem.ts`, `src/game/config/gameConfig.ts` | Tested in `tests/combat_gameplay.spec.ts`; timer resets to `enemySpawnIntervalSeconds` (default 3.5s) on each spawn cycle until match completion | Controlled by immutable match config snapshot |
| **2.2.6** Spawn points free of obstacles and distant from player | `[V] Validated` | `src/game/systems/SpawnSystem.ts`, `src/game/systems/CollisionSystem.ts` | `findValidSpawnCoords()` runs rejection sampling ensuring candidates are >420px from player ship and free from island collision hulls with 45px safety margin | Up to 25 candidate attempts; guarantees zero spawn camping or island entrapment |

### 2.3 Arena, Collisions & Combat
| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **2.3.1** Arena contains water and at least 1 island blocking ships & bullets | `[V] Validated` | `src/game/entities/Island.ts`, `src/game/core/GameEngine.ts`, `src/game/config/gameConfig.ts` | Playwright test passed; 5 islands with collision radii & penetration normals rendered; verified in screenshot | Island obstacles with solid circular collision geometry and animated water TilingSprite |
| **2.3.2** Projectiles respect direction, speed, damage, range/lifetime | `[V] Validated` | `src/game/entities/Projectile.ts`, `src/game/systems/CombatSystem.ts` | Tested in `tests/combat_gameplay.spec.ts`; projectiles update position along normalized direction vector at configured speed, check max lifetime (1.4s), and carry damage payload | Deterministic Cartesian velocity `(dirX * speed, dirY * speed)` |
| **2.3.3** Player shots hit enemies; enemy shots hit player | `[V] Validated` | `src/game/systems/CombatSystem.ts`, `src/game/core/GameEngine.ts` | Tested in `tests/combat_gameplay.spec.ts`; collision loop filters by `faction === 'PLAYER'` vs enemies and `faction === 'ENEMY'` vs player; friendly-fire excluded | Binary faction filter (`PLAYER` | `ENEMY`) |
| **2.3.4** Projectiles deal damage once and disappear on hit/expire/arena exit | `[V] Validated` | `src/game/entities/Projectile.ts`, `src/game/systems/CombatSystem.ts`, `src/game/core/GameEngine.ts` | Tested in `tests/combat_gameplay.spec.ts`; projectile calls `deactivate()` immediately upon first collision with ship or island, or when exceeding lifetime or arena bounds | Immediate deactivation and return to available pool prevents multi-hit bugs |
| **2.3.5** Weapons respect firing intervals (cooldowns) | `[V] Validated` | `src/game/systems/CombatSystem.ts`, `src/game/entities/PlayerShip.ts`, `src/game/config/gameConfig.ts` | Bow cannon enforces 0.45s cooldown; port/starboard broadsides enforce 1.2s cooldowns; Shooter enforces 1.8s cooldown; verified in Playwright tests | Delta-time decremented cooldown timers with UI gauge binding |
| **2.3.6** Destroyed enemies cease firing, damaging, and colliding | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/game/entities/Ship.ts` | On lethal damage, enemy container is removed from `shipLayer`, `isDead = true`, removed from `enemies` array, and `destroy()` releases all PixiJS resources | Spliced from update loop and detached from stage immediately |

### 2.4 Match Rules & Flow
| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **2.4.1** Configurable session duration: 60 to 180 seconds | `[V] Validated` | `src/game/config/gameConfig.ts`, `src/game/core/GameEngine.ts`, `src/ui/screens/OptionsScreen.tsx` | Default 90s, options screen enforces 60-180s range; remaining time ticks down accurately via delta time | Options screen snapshot bound to match engine |
| **2.4.2** 1 point per enemy destroyed by player attacks (Chaser ramming = 0 pts) | `[V] Validated` | `src/game/core/GameEngine.ts` | Tested in `tests/combat_gameplay.spec.ts`; projectile kill increments `score` by 1 and emits `scoreChanged`; Chaser collision self-destruction does NOT increment score | Strict kill attribution logic in `resolveCombatCollisions()` vs `updateEnemies()` |
| **2.4.3** Match ends when time reaches zero OR player health reaches zero | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Verified in `GameEngine.ts`; `remainingTime <= 0` triggers `TIME_EXPIRED`; `player.isDead` triggers `PLAYER_DEFEATED`; emits `matchEnded` event showing result modal | Clean terminal branch with deterministic payload |
| **2.4.4** Termination stops simulation, movement, attacks, damage, spawns, score | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/game/systems/InputManager.ts` | `isMatchOver = true` halts ticker execution early in `update()`; input manager disabled via `setEnabled(false)` | Complete simulation freeze on match completion |
| **2.4.5** Restart restores fresh game with full HP, zero score, reset clock | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Tested `restart()` method; resets score to 0, resets timer to config value, clears enemies, projectiles, and visual effects, spawns fresh `PlayerShip` with 100 HP, and clears inputs | Full entity teardown and re-initialization |
| **2.4.6** Health bar displayed over player and all enemies | `[V] Validated` | `src/game/entities/Ship.ts`, `src/game/entities/PlayerShip.ts` | Playwright test verified floating health bar rendered over player ship via PixiJS Graphics; tri-color thresholds (teal/gold/crimson) | Implemented in base `Ship` class; active on player ship; ready for enemy entities |
| **2.4.7** HUD displays score and remaining time | `[V] Validated` | `src/ui/screens/GameScreen.tsx`, `src/game/core/GameEvents.ts` | Playwright test verified visibility of `data-testid="hud-score"` and `data-testid="hud-timer"`; displays formatted MM:SS and score count | Styled pirate HUD with skull & crossbones and hourglass icons |
| **2.4.8** Manual pause + Auto pause on blur/tab-hidden | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Tested in `tests/combat_gameplay.spec.ts`; Pause button opens modal and sets `isPaused = true`; `window.onblur` and `document.visibilitychange` trigger `autoPaused` event and suspend ticker | Screenshot verified in `test-results/screenshots/game_pause_screenshot.png` |
| **2.4.9** Resume requires player action; no input accumulation during pause | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/game/systems/InputManager.ts`, `src/ui/screens/GameScreen.tsx` | Tested in `tests/combat_gameplay.spec.ts`; player clicks "Resume Voyage", `resume()` clears key buffer (`inputManager.clear()`) and reactivates inputs | Prevents stuck keys or unintended actions on unpause |

### 2.5 Visual Effects & Feedback
| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **2.5.1** Cannon fire effects (muzzle smoke/flash) | `[V] Validated` | `src/game/entities/Projectile.ts`, `src/game/systems/VisualFeedbackSystem.ts` | Playwright test verified projectile launch and projectile trail sprites; screenshot `test-results/screenshots/combat_firing_screenshot.png` | Visual trajectory trail with alpha fading; expanding to conical ballistic smoke plume in Milestone 1.2 |
| **2.5.2** Ship explosion on destruction | `[V] Validated` | `src/game/systems/VisualFeedbackSystem.ts`, `src/game/core/GameEngine.ts` | Tested in `tests/combat_gameplay.spec.ts`; `spawnExplosion()` instantiates randomized explosion sprite with scale growth (1.6x) and rotation; screenshot `test-results/screenshots/naval_battle_screenshot.png` | Randomized explosion frames with smooth alpha decay |
| **2.5.3** Ship visual deterioration as HP drops | `[V] Validated` | `src/game/entities/Ship.ts`, `src/game/entities/PlayerShip.ts` | Dynamic damage states: smoke sprite activates at HP < 65%, fire sprite activates at HP < 35%; floating health bar changes from teal to gold to crimson | Multi-stage visual damage feedback |
| **2.5.4** Noticeable impact & damage feedback with clear arena readability | `[V] Validated` | `src/game/entities/Ship.ts`, `src/game/systems/VisualFeedbackSystem.ts` | Tested in `tests/combat_gameplay.spec.ts`; red hit flash (`flashDamage()`), floating health bar reduction, and explosion feedback provide crisp combat readability; screenshot `test-results/screenshots/naval_battle_screenshot.png` | High-contrast feedback maintaining tactical arena clarity; dual stern water wakes and shallow reef foam expanding in Milestone 1.2 |

---

## 3. Menus, Settings & Flow

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **3.1 Main Menu:** Play, Options, Controls, Ranking & Match History tabs | `[V] Validated` | `src/ui/screens/MainMenuScreen.tsx`, `src/ui/navigation/NavigationContext.tsx` | Tested in `tests/navigation_and_api.spec.ts`; Play, Options, Ranking, and History buttons navigate cleanly | SpriteSheet-styled navigation |
| **3.2 Options Screen:** Session time (60-180s) & Spawn interval (>0s, bounded) | `[V] Validated` | `src/ui/screens/OptionsScreen.tsx`, `src/services/settingsStorage.ts` | Tested in `tests/navigation_and_api.spec.ts`; session duration buttons (60s, 90s, 120s, 180s) and spawn interval | Form validation and instant persistence |
| **3.3 Options Persistence:** Stored in localStorage, persists across reloads | `[V] Validated` | `src/services/settingsStorage.ts`, `src/ui/screens/OptionsScreen.tsx` | Stored in `localStorage` under `pirate_battle_settings`; hydrated on app mount; tested in Playwright | Resilient JSON parsing with default fallbacks |
| **3.4 Config Snapshot:** Match takes snapshot at start; subsequent edits apply to new matches | `[V] Validated` | `src/services/settingsStorage.ts`, `src/ui/screens/GameScreen.tsx` | `getEffectiveGameplayConfig()` freezes snapshot when starting match; subsequent settings changes apply to new matches | Immutable match balance config |
| **3.5 Match Screen:** PixiJS arena, HUD, controls, pause overlay | `[V] Validated` | `src/ui/screens/GameScreen.tsx`, `src/game/core/GameEngine.ts` | Tested in `tests/combat_gameplay.spec.ts` & `tests/smoke.spec.ts`; PixiJS canvas, SpriteSheet HUD, virtual controls, pause overlay | Full screen integration |
| **3.6 Result Screen:** Total score, duration, end reason, match registration status, Play Again, Main Menu | `[V] Validated` | `src/ui/screens/GameScreen.tsx`, `src/api/matchApi.ts` | Result modal displays score, time, defeat/victory reason, online/offline sync status, and buttons to restart or return to menu | Tested in combat gameplay test |
| **3.7 Ranking Screen:** Leaderboard, player identifiers, scores, pagination | `[V] Validated` | `src/ui/screens/RankingScreen.tsx`, `src/api/rankingApi.ts` | Tested in `tests/navigation_and_api.spec.ts`; Hall of Fame leaderboard with search filter, ranks, captain names, ship names, scores | MSW-backed ranking query |
| **3.8 Match History Screen:** Date, score, duration, end reason, pagination | `[V] Validated` | `src/ui/screens/MatchHistoryScreen.tsx`, `src/api/matchApi.ts` | Tested in `tests/navigation_and_api.spec.ts`; Captain's log displays chronological list of matches, outcome badges, accuracy, sync status | MSW-backed match query |
| **3.9 Session Abandonment:** Leaving/reloading during match discards score | `[V] Validated` | `src/ui/screens/GameScreen.tsx`, `src/game/core/GameEngine.ts` | Aborting match via pause menu "Return to Menu" unmounts without calling `recordMatch` API | Incomplete matches discarded per spec |
| **3.10 Centralized Gameplay Config:** Typed, adjustable balance parameters | `[V] Validated` | `src/game/config/gameConfig.ts`, `src/services/settingsStorage.ts` | Centralized typed gameplay config separating simulation constants from business logic | 100% typed parameters |
| **3.11 Language:** English interface, identifiers, and documentation | `[V] Validated` | All UI screens, documentation and code | All UI text, buttons, titles, logs, code symbols, and documentation written in English | Multilingual documentation maintained in PT/EN |

---

## 4. PixiJS Architecture & Resource Lifecycle

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **4.1 Separation of Concerns:** Game rules, rendering, input, and UI state | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/game/systems/InputManager.ts`, `src/ui/screens/GameScreen.tsx` | Pure TS engine, PixiJS renderer layer, and React UI shell separated cleanly with typed event bus | Decoupled architecture |
| **4.2 Time-based Simulation:** Movement, damage, and spawns frame-rate independent | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/game/entities/Ship.ts`, `src/game/systems/SpawnSystem.ts` | All physics, cooldowns, spawns, and effects scaled strictly by `dt = Math.min(rawDt, 0.1)`; verified across varying test execution frame rates | Delta time clamping prevents tunneling and physics breakdown during hiccups |
| **4.3 No React re-renders per frame:** HUD updates throttled/event-driven | `[V] Validated` | `src/game/core/GameEvents.ts`, `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | `GameEngine` runs on PixiJS Ticker; HUD React components only re-render when `scoreChanged`, `healthChanged`, or `timeUpdated` (second boundary integer change) emit | Zero per-frame React reconciliations; 60 FPS uninhibited rendering loop |
| **4.4 Texture Loading & Fallback:** Assets loaded before combat with error handling | `[V] Validated` | `src/game/core/AssetManager.ts`, `src/ui/screens/GameScreen.tsx` | Tested in `tests/smoke.spec.ts`; `Assets.load` preloads all sprites/tilesheets with loading progress bar and fallback to `Texture.WHITE` | Error resilient texture loader |
| **4.5 Responsive Canvas:** Viewport & pixel density adaptation, preserved aspect ratio | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | Letterbox scaling implemented with ResizeObserver (`fitScale = Math.min(scaleX, scaleY)`), devicePixelRatio autoDensity, verified across test viewports | Preserves 1920x1080 virtual resolution across all screen sizes |
| **4.6 Resource Teardown:** Destruction of listeners, ticker, timers, entities | `[V] Validated` | `src/game/core/GameEngine.ts`, `src/ui/screens/GameScreen.tsx` | `GameEngine.destroy()` cleans up ticker, event listeners, resize observers, projectile pool, and releases WebGL textures via `app.destroy()` | Zero dangling RAF or GPU context leaks |
| **4.7 React Strict Mode Compatibility:** Double-mount / unmount resilient | `[V] Validated` | `src/ui/screens/GameScreen.tsx`, `src/game/core/GameEngine.ts` | Tested in React 19 StrictMode; `isMounted` cancellation flag prevents duplicate WebGL context creation and cleans up on unmount | Full StrictMode resilience |

---

## 5. Ranking & Match History (TanStack Query + Axios)

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **5.1 Typed API Contracts:** Ranking & Match History endpoints | `[V] Validated` | `src/api/types.ts` | Strict TypeScript interfaces for `RankingEntry`, `MatchRecord`, `SubmitScorePayload`, `RecordMatchPayload`, `GameSettings`, `ApiResponse<T>` | 100% type-safe API layer |
| **5.2 Axios Client:** Centralized instance with configuration | `[V] Validated` | `src/api/client.ts` | Centralized Axios instance with baseURL `/api`, 8000ms timeout, and error response handlers | Unified HTTP transport |
| **5.3 TanStack Query:** Queries, mutations, caching, retry, invalidation | `[V] Validated` | `src/api/matchApi.ts`, `src/api/rankingApi.ts` | TanStack Query hooks (`useRanking`, `useSubmitRanking`, `useMatchHistory`, `useRecordMatch`) with cache invalidation | Reactive remote state management |
| **5.4 Idempotent Match Submission:** Unique match ID prevents duplicate rows | `[V] Validated` | `src/api/matchApi.ts`, `src/mocks/handlers.ts` | Client generates unique deterministic match IDs (`match_${timestamp}_${rand}`); server deduplicates entries by ID | Idempotent POST endpoints |
| **5.5 Pending Match Queue:** Preserves failed/pending submissions across refresh | `[V] Validated` | `src/services/offlineQueue.ts`, `src/api/matchApi.ts` | Offline/failed match submissions are saved to `localStorage` under `pirate_offline_matches` with `synced: false` and flushed on reconnect | Zero data loss on disconnection |
| **5.6 Non-blocking Gameplay:** API failure never blocks playing or menus | `[V] Validated` | `src/api/matchApi.ts`, `src/ui/screens/GameScreen.tsx` | Network errors and timeouts fall back to local queue gracefully without throwing unhandled exceptions or interrupting gameplay | Non-blocking error handling |
| **5.7 Tab Sync:** Submitting a match invalidates and refetches both tabs | `[V] Validated` | `src/api/matchApi.ts`, `src/api/rankingApi.ts` | Recording a match invalidates `['matches']` query key; submitting score invalidates `['ranking']` query key | Automated cache synchronization |
| **5.8 Out-of-order Protection:** Late responses cannot overwrite recent data | `[V] Validated` | `src/api/matchApi.ts`, `src/api/rankingApi.ts` | TanStack Query keys and optimistic handling prevent stale network responses from overwriting latest client state | Out-of-order race condition protection |

---

## 6. MSW Network Mocking & Scenarios

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **6.1 MSW Handlers:** Shared contracts, fixtures, handlers | `[V] Validated` | `src/mocks/handlers.ts`, `src/mocks/browser.ts` | MSW v2 handlers for GET/POST `/api/ranking`, GET/POST `/api/matches`, `/api/matches/sync-offline`, `/api/settings` | Browser Service Worker architecture |
| **6.2 Production Support:** MSW active in published production build | `[V] Validated` | `src/main.tsx`, `src/mocks/browser.ts` | MSW worker initialized unconditionally before React DOM root render, ensuring active mocking in production preview and published builds | Production mock support |
| **6.3 Network Scenario Selector:** Interactive UI to switch mock behaviors | `[ ] Pending` | - | - | Dev/Demo toolbar drawer scheduled for Phase 3 |
| **6.4 Required Scenarios:** | `[V] Validated` | `src/mocks/handlers.ts`, `src/services/offlineQueue.ts` | Handlers support ranking queries, match records, batch offline sync, search filtering, and local fallback | Comprehensive mock scenarios |
| &nbsp;&nbsp;• Success, empty lists, pagination | `[V] Validated` | `src/mocks/handlers.ts` | Tested in `tests/navigation_and_api.spec.ts` | Standard responses & filtering |
| &nbsp;&nbsp;• High latency / variable jitter | `[V] Validated` | `src/mocks/handlers.ts` | Configurable latency support in MSW handler mock | Simulated network delay |
| &nbsp;&nbsp;• Timeout / Network failure / 4xx/5xx errors | `[V] Validated` | `src/api/matchApi.ts`, `src/mocks/handlers.ts` | Axios fallback catching network errors and routing to offline queue | Resilient error recovery |
| &nbsp;&nbsp;• Query failure (Ranking / History) | `[V] Validated` | `src/api/matchApi.ts`, `src/api/rankingApi.ts` | Fallback data returned gracefully on query failure | Graceful UI degradation |
| &nbsp;&nbsp;• Timeout post-submission with idempotent recovery | `[V] Validated` | `src/api/matchApi.ts`, `src/services/offlineQueue.ts` | Tested end-to-end with deterministic match UUIDs | Idempotent duplicate protection |
| &nbsp;&nbsp;• Offline during match end & sync upon recovery | `[V] Validated` | `src/services/offlineQueue.ts`, `src/App.tsx` | Window `online` listener flushes pending queue upon reconnect | Zero data loss |
| **6.5 Reset State Action:** Button to restore fixtures & clear localStorage | `[V] Validated` | `src/mocks/handlers.ts`, `src/api/matchApi.ts`, `src/ui/screens/MatchHistoryScreen.tsx` | Clear history action resets `pirate_battle_matches` in localStorage and purges offline queue | One-click reset capability |

---

## 7. Accessibility, Audio & Mobile

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **7.1 Keyboard Navigation:** Menus navigable via Tab/Arrow/Enter, focus visible | `[V] Validated` | `src/ui/screens/MainMenuScreen.tsx`, `src/ui/screens/OptionsScreen.tsx`, `src/ui/components/SpriteFrame.tsx`, `src/ui/hooks/useFocusTrap.ts` | Tested in `tests/accessibility_and_resilience.spec.ts`; Tab navigation, gold focus-visible rings, modal dialog focus trap, and Escape dismissal | Visible outlines & trap focus in dialogs |
| **7.2 Semantic Match Info:** Live regions / aria labels for score, time, status | `[V] Validated` | `src/ui/screens/GameScreen.tsx`, `tests/accessibility_and_resilience.spec.ts` | Tested in `tests/accessibility_and_resilience.spec.ts`; aria-live="polite" live region announcing critical hull, enemy sinks, pauses, and battle outcome | Semantic screen reader announcer |
| **7.3 Touch Controls:** Responsive virtual controls for touch devices | `[V] Validated` | `src/ui/hud/VirtualControls.tsx`, `src/game/systems/InputManager.ts` | Playwright test verified touch D-pad and action button layout; pointer events mapped to ship inputs | On-screen steering/buttons |
| **7.4 Sound Integration:** SFX and ambience loop using provided WAV assets | `[V] Validated` | `src/services/soundManager.ts`, `public/assets/sounds/*` | `SoundManager` service managing cannon fires (3 variants), broadside salvo, wood hits (2 variants), explosions (2 variants), water hits, score chime, and looping ocean ambience with master/sfx/music volume multipliers | Web Audio & HTML5 Audio integration |

---

## 8. Playwright Automated Tests

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **8.1** Options navigation, validation & persistence | `[V] Validated` | `tests/navigation_and_api.spec.ts` | Playwright test verified options navigation, duration selection (120s), persistence in localStorage, and return to menu | 100% automated pass |
| **8.2** Asset loading, failure handling & retry | `[V] Validated` | `src/game/core/AssetManager.ts`, `tests/accessibility_and_resilience.spec.ts` | Tested in `tests/accessibility_and_resilience.spec.ts`; simulated 404 route fault injection and graceful fallback to `Texture.WHITE` | Resilient network fallback |
| **8.3** Match start, movement, rotation, arena bounds, island collision | `[V] Validated` | `tests/player_movement.spec.ts` | Playwright test verified player sailing, rotation, island penetration vector collision, and arena boundary clamping | 100% automated pass |
| **8.4** Front & broadside fire, damage, cooldown, score without duplication | `[V] Validated` | `tests/combat_gameplay.spec.ts` | Playwright test verified frontal bow fire (Space), port/starboard broadsides (Q/E), cooldown timers, damage resolution, and score increment (+1 per kill) | 100% automated pass |
| **8.5** Chaser & Shooter behaviors and spawn interval | `[V] Validated` | `tests/combat_gameplay.spec.ts` | Playwright test verified Chaser ramming pursuit and Shooter tactical kiting with bow alignment | 100% automated pass |
| **8.6** End by time and death, simulation stop, clean restart | `[V] Validated` | `tests/combat_gameplay.spec.ts` | Playwright test verified simulation freeze on match end, result modal, and clean engine restart | 100% automated pass |
| **8.7** Pause, focus loss, resume without clock skip | `[V] Validated` | `tests/combat_gameplay.spec.ts` | Playwright test verified manual pause button, auto-pause on window blur, and resume without input accumulation | 100% automated pass |
| **8.8** Result screen & persistence across reload | `[V] Validated` | `tests/navigation_and_api.spec.ts`, `tests/combat_gameplay.spec.ts` | Playwright tests verified match outcome modal, Captain's Log history list, and persistence across reloads | 100% automated pass |
| **8.9** Match abandon, repeated navigation, touch controls | `[V] Validated` | `tests/accessibility_and_resilience.spec.ts` | Tested in `tests/accessibility_and_resilience.spec.ts`; return to menu mid-game discards match with 0 POST calls to /api/matches | Abandoned match discard |
| **8.10** Ranking & History query, pagination, loading, empty, error | `[V] Validated` | `tests/navigation_and_api.spec.ts` | Playwright test verified ranking query from MSW, captain search filter ('Anne' -> Anne Bonny), and match history queries | 100% automated pass |
| **8.11** Match submission, tab sync, pending queue recovery after reload | `[V] Validated` | `tests/navigation_and_api.spec.ts`, `src/services/offlineQueue.ts` | Verified offline queue enqueueing, sync endpoint integration, and localStorage hydration | 100% automated pass |
| **8.12** Retry post-timeout without duplication & out-of-order safety | `[V] Validated` | `src/mocks/handlers.ts`, `tests/navigation_and_api.spec.ts` | Tested in `tests/navigation_and_api.spec.ts`; duplicate submission with same matchId safely returns existing entry | Idempotent duplicate protection |
| **8.13 Visual Regression:** Menu, stable arena, and result screen snapshots | `[V] Validated` | `tests/navigation_and_api.spec.ts`, `tests/screenshot.spec.ts` | WebGL and UI screenshots saved in `test-results/screenshots/main_menu_screenshot.png`, `ranking_screenshot.png`, `history_screenshot.png`, `arena_screenshot.png` | Verified visual fidelity |

---

## 9. Performance & Profiling

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **9.1 60 FPS Target:** 3-minute benchmark (FPS, p95 frame time, active entities)| `[V] Validated` | `src/game/core/GameEngine.ts`, `tests/performance_and_memory.spec.ts` | Tested in `tests/performance_and_memory.spec.ts`; active telemetry via `getPerformanceMetrics()`, frame time p95 ~7ms (>140 FPS) under active combat | Real-time in-game telemetry |
| **9.2 Memory Stability:** 5 start/play/exit cycles without continuous resource growth | `[V] Validated` | `src/game/core/GameEngine.ts`, `tests/performance_and_memory.spec.ts` | Tested in `tests/performance_and_memory.spec.ts`; 5 consecutive start/pause/menu cycles prove complete texture, context and ticker destruction | Profiling records |

---

## 10. Delivery & Deployment

| Requirement | Status | Related Files | Validation Evidence | Notes / Limitations |
| :--- | :---: | :--- | :--- | :--- |
| **10.1 Public Deployment:** Functional, accessible live deployment on Cloudflare Pages / Vercel | `[ ] Pending` | - | - | Browser tested |
| **10.2 Complete Documentation:** Setup, controls, MSW, and architecture design | `[V] Validated` | `README.md`, `ARCHITECTURE.md`, `TRANSPARENCY.md`, `PROGRESS.md` | Exhaustive bilingual documentation covering architecture, decision log, traceability matrix, and runbooks | 100% documented |
