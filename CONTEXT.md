# CONTEXT: ISK MASTER (NEXT.JS 16 + TS)

## 🎯 ROLE & MODE

Senior Next.js/TS Developer. Output code: production-ready, ultra-optimized, NO placeholders (NO `// TODO`). Response language: Russian.

## 💻 STACK

- Core: Next.js 16.2.4 (App Router), React 19.2.4, TypeScript 5 (strict: true)
- DB: better-sqlite3 (Node.js, local, synchronous, WAL-mode, single persistent connection)
- Styling: Tailwind CSS v4 (@tailwindcss/postcss), CSS Modules (`.module.css`)
- Async Control: `p-limit`
- ESLint: Flat Config (`eslint.config.mjs`) with nextVitals & nextTs.

## 🏛️ ARCHITECTURE & DATA FLOW

- MPA Principle: Page navigation fully resets React state. NO global heavy reactive states.
- Client Flow: Forms -> LocalStorage (on "OK") -> GET DATA (button) -> POST JSON to `/api/buy` -> Server returns flat `IMarketItem[]` -> Render static table.
- Client Interaction: ONLY theme toggle, table sorting, and row selection.
- Routing: Paths use `@/*` alias (from root `./`). NO relative paths like `../../`.
- Navigation: Use native `<a>` tags instead of Next.js `<Link>`.

## ⛔ CRITICAL CODE RULES (STRICT)

1. NO `any` type allowed. Strict interfaces only.
2. NO `setState` inside `useEffect` (prevents cascade renders & hydration errors).
3. NO native `alert()`. Use `console.error` for logs.
4. IMMUTABILITY: Never mutate pipeline input configs or intermediate states.
5. FILE HEADER MANDATORY: Every code block MUST start on line 1 with its path.

## ⚙️ ENGINE & LOGIC RULES

- **queryHandler:** Returns `(T | null)[]`. MUST preserve original array length and exact URL indices. Replace network/404 errors with `null`. Filter `null` on the caller side.
- **ESI Cache:** DB stores 100% raw ESI API responses (Orders: 5 min, History: 24h) via Expires/ETag headers. User filtering is done in RAM at the very end of the pipeline.
- **EVE Economy Math (`profitCalculations.ts`) [Viridian 2026 Update]:**
    - Sales Tax: Base 7.5%. Formula: `Base * (1 - 0.11 * AccountingLevel)`. Forge Hub Max Skill Fix: strict 3.375%.
    - Upwell Structures (Citadels): SCC Surcharge strict 0.5% (MIN: 25 ISK per order). Owner Fee: applies directly (Ignore _Broker Relations_ skill), strict MIN: 100 ISK per order.
    - NPC Stations (Jita 4-4): Broker Fee uses Unmodified Standings (Faction & Corp) BEFORE social skills apply. Strict MIN: 100 ISK per order.
    - Formula Constraints: Apply `Math.max(calculatedFee, minThreshold)` for all minimums.
    - Float Precision Fix: Use `Math.round(val * 100) / 100` step-by-step.
- **EVE UI Utilities:**
    - Prices: Apply "4 significant digits rule" via `clipboardModify.ts` before copying.
    - Table Copy Buttons: Stop propagation (`e.stopPropagation()`). Change text to `[Copied]` via direct DOM mutation (`target.innerText`) to avoid table re-renders.

## ⚡ PERFORMANCE & HYDRATION FIXES

- **Anti-Hydration Mismatch:**
    - For `UserForm` / `OptionsBar`: Use dynamic import `{ ssr: false }` and parse `localStorage` directly during state init.
    - For `/buy` (sessionStorage): Wrap inside `setTimeout(..., 0)` inside `useEffect`.
- **Session Cache:** Save server response `IMarketItem[]` to `sessionStorage` (`cached_market_items`) for instant 0ms restoration on tab navigation.
- **Table Selection:** Windows-style multi-select (`Ctrl` / `Shift`) based on `sortedItems`. Block text selection on Shift via `e.preventDefault()` and `userSelect: 'none'`.

## 🛰️ WEB WORKER RADAR SPEC (`src/app/war/`)

- Anti-Throttling (Chromium Fix): ALL scan/blink timers MUST live inside isolated Web Workers created dynamically via `Blob URL`. NO native `setInterval` in React components.
- Auto-Scan Pipeline: Worker triggers every 5m 05s (safe window for CCP Games ESI cache reset). Automatically sends cached JSON log to backend via POST. NO manual file re-upload required.
- OS-Level Notification (Tab Blinking): If orders are outbid, worker modifies `document.title` every 1s, toggling between `🔴 0.01 ISK WAR` and `ISK Master`. MUST bypass browser sleep mode.

## ⚔️ WAR PAGE SPEC (`src/app/war/page.tsx`)

- UI Layout: Dual independent tables (SELL ORDERS / BUY ORDERS). Strict 3-column grid: `changed` | `buy/sell` | `Item Name`. Separated strictly by `item.isBuy` flag.
- Quick Actions:
    - `[Copy]` Price: Auto-applies price step modify (+0.01 ISK for Buy, -0.01 ISK for Sell) via direct float calculations in text utils.
    - `[Copy]` Name: Copies raw Item Name text for in-game market search field.
- Row States (DOM only, NO heavy state / NO reactive arrays):
    - `changed` column: Native checkboxes `[✔ Check]`. If checked (`DONE`), visual opacity fades to `0.35` via direct DOM-mutation to avoid table re-renders.
    - Interaction: `OUTBID` and `IGNORED` buttons trigger cyclic DOM innerText swap at 0ms latency. If `item.status` is empty (`''`), native CSS pseudo-class `:empty` mutes border and background, making it completely invisible without breaking grid alignment.
- Path Helper: Native text input for Windows PC Username. Dynamically renders path: `C:\Users\{User}\Documents\EVE\logs\Marketlogs`. Includes single-click copy button.

## ⚙️ SERVER WAR ENGINE SPEC (`src/services/warExecuter.ts` & `/api/war`)

- **EVE Geography Logic:** Filter competitors via `getNeighborSystems` & `jumpFilter`. Sell Orders compete strictly inside the exact station. Buy Orders compete within order's active `Range` radius from game client log.
- **Strict Atomics (Order ID Match):** Pipeline completely avoids any type grouping (`Set<number>`). It generates granular parallel market request chains matching compound `typeID-orderType` metadata.
- **Self-Order Protection:** Pipeline loops over every individual `IMyUploadedOrder` mapping top market depth rows against unique `myOrder.orderID`. If the top order belongs to the user, status evaluates to empty `''` to prevent false positive triggers on overlapping assets.
- **Order Depth Muting (Auto-Ignore Hierarchy):** Group and sort internal player stacks by price extrema. Highest buy order and lowest sell order become flags. Deeper duplicate user orders of the same type automatically inherit `status: 'IGNORED'` from engine context to shield user from self-undercut alarms.
- **Data Integrity:** Item names MUST be raw strings from the game DB SDE. NO custom suffixes or text modifications allowed.

## 📂 DIRECTORY MAP REFERENCE

- `src/app/`: `layout.tsx` (with Header), `globals.css` (themes), `user/` (dynamic form), `buy/` (fetch & cache), `war/` (`page.tsx` isolated logic, `columnsConfig.tsx` cell renderers, `war.module.css`), `api/` (buy/war POST handlers, JSON merge).
- `src/components-feature/`: Business logic forms & bars (`header.tsx` with war tab, `inputsBlock.tsx` for radio, `optionsBar.tsx`, `infoPanel.tsx` with async React 19 useEffect, `userForm.tsx`). CSS in `css/`.
- `src/components-generic/`: Pure UI atomic components (`table.tsx` with custom EVE grid supporting `rowKey="orderID"` mapping, `overview.tsx` absolute overlay, inputs, buttons). CSS in `css/`.
- `src/db/`: `esi_cache.db` (SQLite file).
- `src/lib/`: `constants.ts` (HUBS, timers), `settings.ts` (defaults), `dbHandlers.ts` (WAL manager), `filtres.ts` (RAM filters), `warUtils.ts` (CSV parser, hierarchical stack indexer), `profitCalculations.ts` (Viridian patch taxes).
- `src/services/`: `execute.ts` (Server MPA pipeline), `warExecuter.ts` (0.01 ISK atomic war engine, 1-jump radius filter, deep ignore sorting).
- `src/types/`: `interfaces.ts` (Server types, native ESI data types, strict `IWarItem` literated schemas).

## END CONTEXT.md
