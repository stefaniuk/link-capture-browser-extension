# ADR-001: Link Capture Payload Contract

| Field | Value |
| --- | --- |
| Date | `2026-03-20` |
| Status | `Accepted` |
| Significance | `Interfaces & contracts, Data, Security & privacy` |

## Context 🧭

The Link Capture Browser Extension needs a single, versioned payload contract that is clear enough for implementation, mocking, schema validation, and future contract testing.

During review of the product requirements document, the payload requirements were found to be inconsistent. Some sections described the first release as URL-only, while other sections described title and HTML capture as optional or later-phase capabilities. The agreed product direction is different:

- On supported HTML pages, the extension must send URL, title, HTML, trigger, captured timestamp, and schema version.
- When HTML capture is blocked, the extension must still send a partial payload with URL, title if available, trigger, captured timestamp, schema version, capture status, and failure reason.
- The contract should also allow recommended metadata fields when available, without making them mandatory for the first release.

This decision relates directly to the PRD sections covering functional requirements, payload model, acceptance criteria, and success criteria in [../prd.md](../prd.md).

Constraints and drivers:

- The extension runs on Chrome Manifest V3.
- The background service worker cannot access the DOM directly.
- Some pages block script injection or do not expose normal page context.
- HTML capture introduces privacy, payload-size, and downstream handling risks.
- The contract must be deterministic, testable, and suitable for consumer and provider validation.

## Decision ✅

### Assumptions 🧩

- The backend will accept JSON over HTTP POST.
- Supported HTML pages provide enough access for URL, title, and HTML capture.
- Restricted pages will continue to exist and must not force silent failure.
- Optional metadata fields may be added later if they remain backwards-compatible.

### Drivers 🎯

- Clear first-release behaviour for both supported and blocked capture scenarios.
- A stable interface contract that can be formalised later as JSON Schema or OpenAPI.
- Explicit handling of restricted pages without hiding failure.
- Controlled privacy exposure when HTML is transmitted.
- Low-friction extension behaviour that still gives the backend enough context to process captures reliably.

### Options 🔀

Scoring method: weighted score = `sum(weight * score) / sum(weights)`, where higher is better. Top criteria are weighted highest because the main risk is contract ambiguity and unreliable behaviour on restricted pages.

#### Option A: Required HTML on supported pages, partial payload when blocked, recommended metadata optional (Selected) ✅

**Top criteria**: Contract clarity, restricted-context operability

**Weighted option score**: `4.58 / 5.00`

This option defines one versioned contract with two valid first-release outcomes: a full payload for supported HTML pages and a partial payload when HTML capture is blocked. Recommended metadata stays additive.

| Criteria | Weight | Score/Notes |
| -------- | ------ | ----------- |
| Contract clarity | 5 | ⭐⭐⭐⭐⭐ Clear required fields for both full and partial capture outcomes. |
| Restricted-context operability | 5 | ⭐⭐⭐⭐⭐ Works on blocked pages without silent failure. |
| Privacy control | 4 | ⭐⭐⭐⭐ Limits mandatory fields and keeps extra metadata optional. |
| Extensibility | 3 | ⭐⭐⭐⭐⭐ Recommended metadata can be added without changing required first-release behaviour. |
| Effort | 2 | ⭐⭐⭐ Requires two payload examples and explicit fallback handling, but remains straightforward. |
| Total score | - | `4.58 / 5.00` |

#### Option B: URL and title first, HTML optional later

**Top criteria**: Contract clarity, restricted-context operability

**Weighted option score**: `3.26 / 5.00`

This option reduces first-release scope by treating HTML as a later enhancement.

| Criteria | Weight | Score/Notes |
| -------- | ------ | ----------- |
| Contract clarity | 5 | ⭐⭐ Conflicts with the agreed product direction and leaves too much ambiguity in the first-release contract. |
| Restricted-context operability | 5 | ⭐⭐⭐⭐ Easy to support on blocked pages because HTML is not required. |
| Privacy control | 4 | ⭐⭐⭐⭐ Lower risk because the payload is smaller. |
| Extensibility | 3 | ⭐⭐ Requires a material contract change when HTML becomes mandatory later. |
| Effort | 2 | ⭐⭐⭐⭐⭐ Lowest implementation effort. |
| Total score | - | `3.26 / 5.00` |

**Why not chosen**: It does not match the agreed requirement that HTML is part of the first release for supported pages. It also creates avoidable contract churn later.

#### Option C: Always require HTML and fail the capture when HTML is blocked

**Top criteria**: Contract clarity, restricted-context operability

**Weighted option score**: `3.11 / 5.00`

This option enforces a single strict payload shape and treats blocked HTML capture as a hard failure.

| Criteria | Weight | Score/Notes |
| -------- | ------ | ----------- |
| Contract clarity | 5 | ⭐⭐⭐⭐ Very clear contract for supported pages. |
| Restricted-context operability | 5 | ⭐ Fails on restricted pages and increases user-visible failure cases. |
| Privacy control | 4 | ⭐⭐⭐⭐⭐ Strictly limits the system to successful HTML capture only. |
| Extensibility | 3 | ⭐⭐ Leaves little room for graceful degradation without revisiting the contract. |
| Effort | 2 | ⭐⭐⭐⭐ Simpler contract, but operationally brittle. |
| Total score | - | `3.11 / 5.00` |

**Why not chosen**: It conflicts with the need for reliable capture behaviour across restricted Chrome contexts and would force the extension to fail more often than necessary.

### Outcome 🏁

Adopt Option A.

The first-release payload contract must support two valid outcomes:

- Supported HTML pages: `url`, `title`, `html`, `trigger`, `capturedAt`, `schemaVersion`
- HTML capture blocked: `url`, `title` if available, `trigger`, `capturedAt`, `schemaVersion`, `captureStatus`, `failureReason`

The contract may also include these recommended metadata fields when available and appropriate:

- `canonicalUrl`
- `language`
- `metaDescription`
- `siteName`
- `author`
- `publishedDate`
- `htmlByteLength`
- `htmlHash`
- `extensionVersion`

This decision is reversible. It should be revisited if browser constraints change materially, the backend requires different mandatory fields, or privacy and security review rejects transmitting full HTML for the current use case.

### Rationale 🧠

Option A best fits the agreed product requirements and the repo constitution.

- It gives the extension a deterministic contract for both normal and restricted browsing contexts.
- It prevents a false choice between a URL-only first release and hard failure on blocked pages.
- It keeps HTML in scope for the first release without hiding operational realities.
- It supports later formalisation as JSON Schema, OpenAPI components, or consumer-driven contract tests.
- It keeps optional metadata additive, which reduces compatibility risk.

## Consequences ⚖️

- The PRD, mocks, tests, and any future schema artefacts must represent both full and partial payload outcomes.
- The implementation must distinguish between supported HTML pages and blocked capture cases.
- Privacy review must focus on HTML handling, payload size, and downstream storage/processing controls.
- The team still needs a follow-up decision on allowed `failureReason` values, HTML size limits, and the hashing algorithm for `htmlHash`.
- If later work makes some recommended metadata mandatory, that must be treated as a contract change and reviewed explicitly.

This decision no longer applies if the product scope changes away from HTML capture, or if the backend contract is superseded by a new versioned schema.

## Compliance 📏

Compliance is met when:

- The PRD defines the same required fields in functional requirements, payload examples, success criteria, and acceptance criteria.
- Mock and contract validation artefacts accept both the full and partial payload shapes.
- Any future schema or automated contract tests preserve `schemaVersion` and the blocked-capture fields.

Validation approach:

- Run in local development and CI.
- Evaluate PRD consistency, future schema artefacts, and contract tests.
- Produce evidence through linter output, schema validation output, and contract test results.

Local command:

```bash
rg -n "schemaVersion|captureStatus|failureReason|htmlHash|canonical URL" docs/prd.md docs/adr/ADR-001_Link_Capture_Payload_Contract.md && make lint
```

## Notes 🔗

- Product requirements: [../prd.md](../prd.md)
- Template used: [ADR-nnn_Any_Decision_Record_Template.md](./ADR-nnn_Any_Decision_Record_Template.md)
- Reference guidance: [Tech_Radar.md](./Tech_Radar.md)

## Actions ✅

- [x] Dan, 2026-03-20, align the PRD with the accepted first-release payload contract
- [ ] Dan, TBD, formalise the payload contract as JSON Schema or OpenAPI components
- [ ] Dan, TBD, define allowed `failureReason` values and `htmlHash` algorithm

## Tags 🏷️

`#privacy|#security|#interoperability|#compatibility|#data-integrity|#testability|#maintainability|#extensibility`
