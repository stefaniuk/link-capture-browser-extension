# ADR-005: Extension Runtime Defaults and Failure Semantics

> |              |                                                                                                |
> | ------------ | ---------------------------------------------------------------------------------------------- |
> | Date         | `2026-03-20`                                                                                   |
> | Status       | `Accepted`                                                                                     |
> | Significance | `Architecture, Interfaces & contracts, Security & privacy, Operations, Testability, Usability` |

---

- [ADR-005: Extension Runtime Defaults and Failure Semantics](#adr-005-extension-runtime-defaults-and-failure-semantics)
  - [Context 🧭](#context-)
  - [Decision ✅](#decision-)
    - [Assumptions 🧩](#assumptions-)
    - [Drivers 🎯](#drivers-)
    - [Options 🔀](#options-)
      - [Option A: Deterministic single-attempt runtime with strict defaults (Selected) ✅](#option-a-deterministic-single-attempt-runtime-with-strict-defaults-selected-)
      - [Option B: Optimistic client resilience with retries, queues, and broader persistence](#option-b-optimistic-client-resilience-with-retries-queues-and-broader-persistence)
      - [Option C: Leave runtime details to implementation defaults](#option-c-leave-runtime-details-to-implementation-defaults)
    - [Outcome 🏁](#outcome-)
    - [Rationale 🧠](#rationale-)
  - [Consequences ⚖️](#consequences-️)
  - [Compliance 📏](#compliance-)
  - [Notes 🔗](#notes-)
  - [Actions ✅](#actions-)
  - [Tags 🏷️](#tags-️)

## Context 🧭

The PRD for the Link Capture Browser Extension already defines the capture contract, authentication model, contract-testing strategy, and oversized-payload handling. Even with those decisions in place, a set of runtime behaviours still needed explicit defaults:

- request timeouts and retry rules
- per-tab state transitions
- duplicate-trigger handling
- token-storage and purge rules
- environment fallback behaviour
- permission boundaries for page access versus backend access
- first-release schema strictness rules
- deterministic mock-server scenario behaviour

Without explicit defaults, the first implementation would have to invent runtime semantics and could drift across the extension, schema, mock server, and automated tests.

This decision relates directly to [../prd.md](../prd.md) and builds on these ADRs:

- [ADR-001_Link_Capture_Payload_Contract.md](./ADR-001_Link_Capture_Payload_Contract.md)
- [ADR-002_Extension_API_Authentication.md](./ADR-002_Extension_API_Authentication.md)
- [ADR-003_Contract_Testing_Strategy.md](./ADR-003_Contract_Testing_Strategy.md)
- [ADR-004_Oversized_HTML_Payload_Handling.md](./ADR-004_Oversized_HTML_Payload_Handling.md)

## Decision ✅

### Assumptions 🧩

- The first release is a Chrome Manifest V3 extension installed locally as an unpacked extension during development.
- The backend does not provide an idempotency-key contract in the first release.
- The extension uses a service worker and needs token handling that survives both worker restarts and full browser restarts.
- The first release prioritises deterministic behaviour and low surprise over aggressive client-side resilience.

### Drivers 🎯

- Determinism and testability.
- Security posture for token handling.
- Low risk of duplicate submission.
- Least-privilege browser access.
- Simple, explainable runtime behaviour for users and implementers.

### Options 🔀

Scoring method: weighted score = `sum(weight * score) / sum(weights)`, where higher is better. Determinism and security posture are weighted highest because the main risk is inconsistent runtime behaviour across implementation, schema, and tests.

#### Option A: Deterministic single-attempt runtime with strict defaults (Selected) ✅

**Top criteria**: Determinism and testability, security posture

**Weighted option score**: `4.73 / 5.00`

This option defines a finite per-tab runtime state model, single-attempt submission behaviour, one refresh-driven retry path, split token persistence for restart continuity, exact schema semantics, and deterministic mock endpoints.

- `Determinism and testability`, weight `5`: ⭐⭐⭐⭐⭐ Runtime behaviour is explicit, finite, and easy to encode in unit and contract tests.
- `Security posture`, weight `5`: ⭐⭐⭐⭐ Access tokens remain non-persistent while refresh-token persistence is narrowly scoped to restart continuity.
- `UX clarity`, weight `4`: ⭐⭐⭐⭐ User-visible results are simple and predictable, even if some resilience is deferred.
- `Operability`, weight `4`: ⭐⭐⭐⭐ Deterministic mock responses and failure categories simplify diagnosis.
- `Effort`, weight `2`: ⭐⭐⭐ Moderate effort because more defaults must be documented and tested.
- `Total score`: `4.73 / 5.00`

#### Option B: Optimistic client resilience with retries, queues, and broader persistence

**Top criteria**: Determinism and testability, security posture

**Weighted option score**: `3.08 / 5.00`

This option would add automatic submission retries, queued duplicate triggers, broader token persistence, and more adaptive runtime behaviour.

- `Determinism and testability`, weight `5`: ⭐⭐ Additional branches and timing behaviour make tests and mocks more complex.
- `Security posture`, weight `5`: ⭐⭐ Broader token persistence increases exposure risk.
- `UX clarity`, weight `4`: ⭐⭐⭐ Could feel more resilient, but hidden retries and queues are harder to explain.
- `Operability`, weight `4`: ⭐⭐⭐ More moving parts complicate local diagnosis and CI reproduction.
- `Effort`, weight `2`: ⭐⭐ Higher implementation and test effort.
- `Total score`: `3.08 / 5.00`

**Why not chosen**: It adds complexity before there is an explicit idempotency contract, increasing the risk of duplicate submissions and runtime drift.

#### Option C: Leave runtime details to implementation defaults

**Top criteria**: Determinism and testability, security posture

**Weighted option score**: `1.69 / 5.00`

This option would document only the high-level product intent and allow implementation code to define timeouts, retries, storage, permissions, and mock behaviour case by case.

- `Determinism and testability`, weight `5`: ⭐ Behaviour would vary between implementations and test suites.
- `Security posture`, weight `5`: ⭐⭐ Storage and permission choices would be vulnerable to accidental overreach.
- `UX clarity`, weight `4`: ⭐⭐ Users could see inconsistent behaviour across tabs and failure modes.
- `Operability`, weight `4`: ⭐ Low clarity for debugging and little shared language for failures.
- `Effort`, weight `2`: ⭐⭐⭐⭐⭐ Lowest initial documentation effort.
- `Total score`: `1.69 / 5.00`

**Why not chosen**: It conflicts with the project constitution's requirement for deterministic, testable behaviour and leaves too much room for implementation drift.

### Outcome 🏁

Adopt Option A.

The first-release extension runtime shall use these defaults:

- Per-tab states: `idle`, `capturing`, `authenticating`, `submitting`, `succeeded_full`, `succeeded_partial`, `failed`
- One active capture per tab; duplicate same-tab triggers are ignored and return local failure reason `capture_in_progress`
- No dedicated in-progress badge or tooltip in the first release
- `10` second timeout for submission, token exchange, and token refresh requests
- No automatic retry of failed POST submissions, except one retry after successful token refresh following `401 Unauthorized`
- Access tokens stored only in memory or `chrome.storage.session`
- Refresh tokens persisted only in `chrome.storage.local` for the active environment
- Authenticated session restored after browser restart when a valid persisted refresh token exists
- All stored tokens cleared on sign-out, active-environment change, refresh failure, and authorization-server rejection
- Default environment `local` when the stored key is missing or invalid
- Local manual overrides take precedence only in the `local` profile and only when valid
- Page capture uses `activeTab`, `tabs`, and `scripting`; static `host_permissions` are limited to configured backend and identity-provider origins
- First-release command identifier `capture-current-page` with no suggested default accelerator
- Exact first-release scope set `openid profile link-capture.write`, plus audience `link-capture-api` when required
- Strict first-release schema semantics: exact `schemaVersion` `1.0.0`, unknown top-level properties rejected, extended fields omitted when disabled and fully present when enabled
- Deterministic mock endpoints at `/captures`, `/captures/400`, `/captures/401`, `/captures/403`, `/captures/500`, and `/captures/timeout`

This decision is reversible. It should be revisited if the backend introduces idempotency guarantees, if browser permission constraints change materially, or if user research shows that a richer in-progress interaction model is necessary.

### Rationale 🧠

Option A gives the cleanest balance of safety, clarity, and implementability.

- It prevents silent implementation drift in the most failure-prone parts of the extension.
- It keeps the runtime easy to reason about in a Manifest V3 service-worker model.
- It reduces the risk of duplicate capture submission before an explicit idempotency contract exists.
- It gives both human developers and AI assistants a deterministic behavioural target.

## Consequences ⚖️

- The PRD, schema, mocks, and tests must all use the same timeout, retry, and vocabulary defaults.
- The implementation must explicitly model per-tab capture state rather than relying on ad hoc event handling.
- Token handling keeps access tokens non-persistent, but refresh-token persistence introduces a bounded local secret that must be purged correctly.
- Mock behaviour becomes more prescriptive, which improves determinism but slightly increases setup effort.

This decision no longer applies if the project introduces a different client platform, adopts a backend idempotency-key contract, or chooses a richer offline or retry model in a later schema version.

## Compliance 📏

Compliance is met when:

- The PRD documents the runtime state model, timeout values, retry rules, token-storage rules, browser-restart restoration rules, permission boundaries, and mock response contract.
- The authentication artefacts align on scope set, audience, and token storage boundaries.
- Automated tests cover duplicate-trigger handling, timeout failures, refresh-driven retry, browser-restart session restoration, and environment fallback.
- Mock tests use the documented scenario endpoints and response bodies.

Validation approach:

- Run in local development and CI.
- Check the PRD, ADRs, schema artefacts, and future tests for consistency with this ADR.
- Produce evidence through lint output and automated test results.

Local command:

```bash
rg -n "10 second timeout|capture_in_progress|chrome.storage.session|chrome.storage.local|browser restart|capture-current-page|/captures/timeout|schemaVersion" docs/prd.md docs/adr/ADR-005_Extension_Runtime_Defaults_and_Failure_Semantics.md && make lint
```

## Notes 🔗

- Product requirements: [../prd.md](../prd.md)
- Related ADR: [ADR-001_Link_Capture_Payload_Contract.md](./ADR-001_Link_Capture_Payload_Contract.md)
- Related ADR: [ADR-002_Extension_API_Authentication.md](./ADR-002_Extension_API_Authentication.md)
- Related ADR: [ADR-003_Contract_Testing_Strategy.md](./ADR-003_Contract_Testing_Strategy.md)
- Related ADR: [ADR-004_Oversized_HTML_Payload_Handling.md](./ADR-004_Oversized_HTML_Payload_Handling.md)
- Template used: [ADR-nnn_Any_Decision_Record_Template.md](./ADR-nnn_Any_Decision_Record_Template.md)
- Reference guidance: [Tech_Radar.md](./Tech_Radar.md)

## Actions ✅

- [x] Dan, 2026-03-20, define first-release timeout and retry defaults
- [x] Dan, 2026-03-20, define the per-tab runtime state model and duplicate-trigger handling
- [x] Dan, 2026-03-20, define token storage and purge boundaries
- [x] Dan, 2026-03-20, define the first-release permission and mock-response defaults
- [x] Dan, 2026-03-21, define browser-restart session restoration using the persisted refresh token

## Tags 🏷️

`#reliability|#security|#privacy|#operability|#testability|#maintainability|#usability|#simplicity|#data-integrity`
