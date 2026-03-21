# Implementation Plan: Link Capture Browser Extension

**Branch**: `001-link-capture-extension` | **Date**: 2026-03-21 | **PRD**: `docs/prd.md`

## Summary

Build a Chrome Manifest V3 extension that captures the current tab URL and an ISO 8601 timestamp on demand (toolbar click or keyboard shortcut), POSTs the payload to a configurable REST endpoint, and shows brief badge feedback. A companion mock API server is included for local development.

## Technical Context

**Language/Version**: TypeScript, Node.js LTS
**Package Manager**: `pnpm`
**Linting/Formatting**: `biome`
**Type Checking**: `tsc` (`strict: true`)
**Testing**: `vitest` + `fast-check` (PBT)
**Target Platform**: Chrome (Manifest V3)
**Mock Server Runtime**: Node.js (plain HTTP or minimal framework)
**Project Type**: Browser extension + dev-time mock server

## Project Structure

```text
src/
├── extension/
│   ├── manifest.json          # Chrome MV3 manifest
│   ├── background.ts          # Service worker: capture logic, API call, badge feedback
│   ├── types.ts               # Shared types (CapturePayload)
│   └── config.ts              # Endpoint URL + defaults
├── mock-server/
│   ├── server.ts              # HTTP server: POST /captures, GET /captures
│   └── types.ts               # Shared request/response types (or re-export from extension)
tests/
├── unit/
│   ├── background.test.ts     # Capture logic, payload construction, badge behaviour
│   ├── config.test.ts         # Config defaults and validation
│   └── mock-server.test.ts    # Mock server route behaviour
├── integration/
│   └── capture-flow.test.ts   # Extension sends POST → mock server receives correct payload
└── contract/
    └── api-contract.test.ts   # POST /captures request shape and response codes
```

## Plan

### Phase 0 — Project Scaffolding

> All steps in this phase can run in parallel.

0.1. Initialise `package.json` with `pnpm init`; add `engines.node` for LTS and `.nvmrc`.
0.2. Install dev dependencies: `typescript`, `vitest`, `fast-check`, `@biomejs/biome`, `@anthropic/chrome-types` (or `@anthropic-ai/chrome-types` — whichever provides Manifest V3 types, to be confirmed; alternatively hand-written `.d.ts` or `@anthropic/chrome-types` or `chrome-types` for chrome.\* APIs).
0.3. Create `tsconfig.json` — `strict: true`, ESM, ES2022 target, separate configs for extension and mock-server if needed.
0.4. Create `biome.json` with project formatting and linting rules.
0.5. Wire up Makefile targets (`deps`, `format`, `lint`, `typecheck`, `test`, `build`).

### Phase 1 — Shared Types and Config

1.1. 🔴 **Test**: Write unit tests for `CapturePayload` type shape validation (using `fast-check` for property-based testing of URL strings and ISO 8601 timestamps).
1.2. 🟢 **Implement**: Define `CapturePayload` type in `src/extension/types.ts` — `{ url: string; timestamp: string }`.
1.3. 🔴 **Test**: Write unit tests for `config.ts` — verify default endpoint is `http://localhost:3000/captures`, verify config validation rejects empty/invalid URLs.
1.4. 🟢 **Implement**: Create `src/extension/config.ts` — exports `API_ENDPOINT` default and a validation function.
1.5. 🔵 **Refactor**: Review types and config for clarity.

### Phase 2 — Mock API Server

2.1. 🔴 **Test**: Write unit/contract tests for `POST /captures` — expects `{ url, timestamp }` body, returns `201 Created`. Test invalid payloads return `400`.
2.2. 🔴 **Test**: Write unit/contract tests for `GET /captures` — returns JSON array of all previously posted captures.
2.3. 🟢 **Implement**: Create `src/mock-server/server.ts` using Node.js built-in `http` module (no external framework dependency). In-memory array storage. Listen on port 3000.
2.4. 🔵 **Refactor**: Extract request parsing and validation into small focused functions.
2.5. Wire Makefile target `mock-server` to start the server (`pnpm run mock-server` or `node` invocation).

### Phase 3 — Chrome Extension Core (Service Worker)

> _Depends on Phase 1._

3.1. 🔴 **Test**: Write unit tests for `buildCapturePayload(url: string, now: Date): CapturePayload` — deterministic timestamp output (inject `Date` for testability per TS-BEH-002).
3.2. 🟢 **Implement**: Create `buildCapturePayload` in `src/extension/background.ts`.
3.3. 🔴 **Test**: Write unit tests for `sendCapture(payload: CapturePayload, endpoint: string): Promise<boolean>` — mock fetch, verify correct method/headers/body, return true on 2xx, false otherwise.
3.4. 🟢 **Implement**: Create `sendCapture` using `fetch` (available in MV3 service workers).
3.5. 🔴 **Test**: Write unit tests for `showBadge(success: boolean)` — verify badge text/colour set and cleared after 2 seconds (use fake timers).
3.6. 🟢 **Implement**: Create `showBadge` using `chrome.action.setBadgeText` and `chrome.action.setBadgeBackgroundColor`.
3.7. 🟢 **Implement**: Wire up event listeners:

- `chrome.action.onClicked` → get active tab URL → `buildCapturePayload` → `sendCapture` → `showBadge`
- `chrome.commands.onCommand` (command name `capture-link`) → same flow
  3.8. 🔵 **Refactor**: Ensure the capture orchestration function is a single small function composing the steps above.

### Phase 4 — Chrome Extension Manifest

4.1. Create `src/extension/manifest.json`:

- `manifest_version: 3`
- `name`: "Link Capture"
- `version`: read from `VERSION` file or hardcode `1.0.0`
- `permissions`: `["activeTab"]`
- `background.service_worker`: compiled JS entry point
- `action`: `{ "default_title": "Capture Link" }`
- `commands`: `{ "capture-link": { "suggested_key": { "default": "Ctrl+Shift+L", "mac": "Command+Shift+L" }, "description": "Capture current page link" } }`
  4.2. 🔴 **Test**: Validate manifest JSON schema (can be a unit test that reads and parses the file, checking required fields).
  4.3. 🟢 **Fix**: Ensure manifest passes validation.

### Phase 5 — Build Pipeline

5.1. Configure TypeScript build to emit JS into `dist/extension/` and `dist/mock-server/`.
5.2. Copy `manifest.json` into `dist/extension/` as part of the build.
5.3. Wire Makefile `build` target to compile and assemble the extension directory ready for Chrome loading.
5.4. Wire Makefile `clean` target to remove `dist/`.

### Phase 6 — Integration Tests

> _Depends on Phase 2 and Phase 3._

6.1. 🔴 **Test**: Write integration test: start mock server → call `sendCapture` with a test payload → assert mock server received and stored the capture → `GET /captures` returns it.
6.2. 🟢 **Implement**: Fix any issues surfaced by integration tests.
6.3. 🔵 **Refactor**: Clean up test helpers and fixtures.

### Phase 7 — Quality Gates and CI

7.1. Verify all Makefile targets work: `make deps`, `make format`, `make lint`, `make typecheck`, `make test`.
7.2. Ensure `make lint` includes biome linting for TS files alongside existing markdown/shell/file-format checks.
7.3. Ensure `make test` runs vitest.
7.4. Update `.github/workflows/stage-1-commit.yaml` and `stage-2-test.yaml` if needed to include TypeScript quality gates.

## Relevant Files

- `docs/prd.md` — PRD (source of truth for behaviour)
- `Makefile` — wire new targets (`deps`, `format`, `lint`, `typecheck`, `test`, `build`, `mock-server`, `clean`)
- `scripts/init.mk` — shared Make infrastructure
- `docs/adr/Tech_Radar.md` — mandated tooling choices
- `.specify/memory/constitution.md` — engineering guardrails
- `.github/instructions/typescript.instructions.md` — TS engineering rules

## Verification

1. `make deps` installs all dependencies without error.
2. `make lint` passes with zero errors and zero warnings.
3. `make typecheck` passes with zero errors.
4. `make test` runs all unit, integration, and contract tests — all green.
5. `make build` produces a loadable Chrome extension in `dist/extension/`.
6. Manual smoke test: load unpacked extension in Chrome → click icon → mock server logs the capture → badge shows green tick.
7. Manual smoke test: press `Ctrl+Shift+L` / `Cmd+Shift+L` → same result as above.
8. Manual smoke test: stop mock server → click icon → badge shows red cross.

## Decisions

- **No external framework for mock server**: Use Node.js built-in `http` module to avoid unnecessary dependencies for a simple two-route server. Keeps the dev dependency footprint minimal.
- **`chrome-types` for Chrome API typings**: Provides MV3 type definitions without bundling Chrome itself. The exact package name to be confirmed during Phase 0.
- **ESM throughout**: Both extension and mock-server code use ES modules (`"type": "module"` in `package.json`, `NodeNext` module resolution).
- **Badge text for feedback** (not notifications): Simpler, less intrusive, no extra permissions needed.
- **Scope boundary**: The backend API is out of scope. The mock server is a dev-time convenience only, not production code.

## Further Considerations

1. **Chrome API type definitions package**: Confirm whether `chrome-types`, `@anthropic-ai/chrome-types`, or `@anthropic/chrome-types` is the correct/current package. Alternatively, use `@anthropic/chrome-types` or hand-author minimal `.d.ts` stubs. **Recommendation**: Research in Phase 0 and record in an ADR if the choice is non-trivial.
2. **Extension icon assets**: The PRD does not specify custom icons. Default Chrome puzzle-piece icon is acceptable for v1. Custom icons can be added later.
3. **ADR for mock server approach**: The constitution requires ADRs for significant technical decisions. A lightweight ADR documenting the choice of Node.js built-in `http` over Express/Fastify/Hono for the mock server should be created during Phase 2.
