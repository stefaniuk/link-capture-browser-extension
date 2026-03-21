# ADR-004: Oversized HTML Payload Handling

> |              |                                                                 |
> | ------------ | --------------------------------------------------------------- |
> | Date         | `2026-03-20`                                                    |
> | Status       | `Accepted`                                                      |
> | Significance | `Interfaces & contracts, Data, Performance, Security & privacy` |

---

- [ADR-004: Oversized HTML Payload Handling](#adr-004-oversized-html-payload-handling)
  - [Context 🧭](#context-)
  - [Decision ✅](#decision-)
    - [Assumptions 🧩](#assumptions-)
    - [Drivers 🎯](#drivers-)
    - [Options 🔀](#options-)
      - [Option A: Keep full HTML canonical and handle oversize explicitly (Selected) ✅](#option-a-keep-full-html-canonical-and-handle-oversize-explicitly-selected-)
      - [Option B: Silently trim HTML to fit a configured size limit](#option-b-silently-trim-html-to-fit-a-configured-size-limit)
      - [Option C: Replace large HTML with extracted text or reader-mode content](#option-c-replace-large-html-with-extracted-text-or-reader-mode-content)
    - [Outcome 🏁](#outcome-)
    - [Rationale 🧠](#rationale-)
  - [Consequences ⚖️](#consequences-️)
  - [Compliance 📏](#compliance-)
  - [Notes 🔗](#notes-)
  - [Actions ✅](#actions-)
  - [Tags 🏷️](#tags-️)

## Context 🧭

The Link Capture Browser Extension captures full page HTML for supported pages and sends it to a backend API as part of a versioned JSON payload.

That contract is already defined in [../prd.md](../prd.md) and [ADR-001_Link_Capture_Payload_Contract.md](./ADR-001_Link_Capture_Payload_Contract.md). However, a follow-up question remained open: what should happen when the captured HTML is very large?

A tempting approach is to trim the HTML or switch to extracted text for large pages. That looks simple, but it changes the semantic meaning of the payload. A trimmed HTML string is no longer the original source, and extracted text or reader-mode content is a derived representation rather than the captured page HTML. If that change happens implicitly, the contract becomes ambiguous and harder to validate.

Research and implementation guidance indicate the following:

- JSON and HTTP can transport large request bodies, so payload size is not by itself a reason to change content format.
- Compression is the standard way to reduce transfer size without changing the logical content.
- Reader-mode or extracted-text tooling such as Mozilla Readability is useful for derived content extraction, but it is heuristic and does not preserve the original HTML contract.
- Large payloads still matter because they affect latency, user experience, backend limits, and privacy exposure.

The decision needed here is not the exact numeric size threshold. That remains an implementation and product-limit question. The decision is about behaviour: whether the first-release contract should silently degrade large HTML captures or handle them explicitly.

This decision relates directly to the PRD sections on FR6, FR7, payload encoding, constraints, risks, success criteria, and acceptance criteria in [../prd.md](../prd.md).

## Decision ✅

### Assumptions 🧩

- The first-release payload contract continues to treat full HTML as the canonical representation for supported-page capture.
- The backend will have practical request-size limits, even if those limits are not yet fixed in the PRD.
- The extension must remain deterministic and contract-testable.
- Privacy and performance concerns increase as HTML payload size increases.
- A future product version may choose to support derived text capture explicitly, but that would require a separate contract decision.

### Drivers 🎯

- Preserve contract clarity and data integrity for the `html` field.
- Avoid silent semantic changes that are hard to test and reason about.
- Support explicit failure semantics for edge cases.
- Keep the first release simple and verifiable.
- Leave room for later transport optimisation, such as compression, without redefining the payload.

### Options 🔀

Scoring method: weighted score = `sum(weight * score) / sum(weights)`, where higher is better. The highest weights are given to contract clarity and deterministic behaviour because the main risk is silently changing what the payload means.

#### Option A: Keep full HTML canonical and handle oversize explicitly (Selected) ✅

**Top criteria**: Contract clarity, deterministic behaviour

**Weighted option score**: `4.67 / 5.00`

This option keeps full HTML as the canonical supported-page payload. If the captured HTML exceeds the configured maximum payload size, the extension returns an explicit failure or partial-capture outcome with a documented failure reason such as `payload_too_large`. Compression may be used separately for transport, but the logical contract remains unchanged.

| Criteria                    | Weight | Score/Notes                                                                                        |
| --------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| Contract clarity            | 5      | ⭐⭐⭐⭐⭐ The `html` field always means captured source HTML, never a lossy substitute.           |
| Deterministic behaviour     | 5      | ⭐⭐⭐⭐⭐ Oversize handling is explicit, testable, and visible in contract validation.            |
| Performance and operability | 4      | ⭐⭐⭐⭐ Prevents oversized submissions while keeping behaviour straightforward.                   |
| Extensibility               | 3      | ⭐⭐⭐⭐⭐ Leaves room for future explicit derived-content modes without overloading the contract. |
| Effort                      | 2      | ⭐⭐⭐⭐ Requires explicit size checks and failure handling, but remains simple.                   |
| Total score                 | -      | `4.67 / 5.00`                                                                                      |

#### Option B: Silently trim HTML to fit a configured size limit

**Top criteria**: Contract clarity, deterministic behaviour

**Weighted option score**: `2.42 / 5.00`

This option shortens the captured HTML when it exceeds a threshold and still sends the payload as if it were a normal full capture.

| Criteria                    | Weight | Score/Notes                                                                                                      |
| --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Contract clarity            | 5      | ⭐ A trimmed `html` field no longer represents the full captured source.                                         |
| Deterministic behaviour     | 5      | ⭐⭐⭐ Can be made deterministic technically, but still hides a semantic downgrade inside a normal success path. |
| Performance and operability | 4      | ⭐⭐⭐⭐ Smaller payloads are easier to send and store.                                                          |
| Extensibility               | 3      | ⭐⭐ Encourages hidden coupling between size policy and payload meaning.                                         |
| Effort                      | 2      | ⭐⭐⭐⭐ Easy to implement.                                                                                      |
| Total score                 | -      | `2.42 / 5.00`                                                                                                    |

**Why not chosen**: It weakens the payload contract by overloading a successful HTML capture with lossy content. That creates ambiguity for backend consumers and contract tests.

#### Option C: Replace large HTML with extracted text or reader-mode content

**Top criteria**: Contract clarity, deterministic behaviour

**Weighted option score**: `2.25 / 5.00`

This option uses content extraction, for example reader-mode or text-only output, whenever the original HTML is too large.

| Criteria                    | Weight | Score/Notes                                                                                           |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Contract clarity            | 5      | ⭐ The `html` field would no longer mean HTML, or an additional silent mode would be introduced.      |
| Deterministic behaviour     | 5      | ⭐⭐ Extraction tools are heuristic and can vary by page structure.                                   |
| Performance and operability | 4      | ⭐⭐⭐⭐ Payloads become smaller and often more readable.                                             |
| Extensibility               | 3      | ⭐⭐⭐ Useful if a future product explicitly wants derived content, but poor as an implicit fallback. |
| Effort                      | 2      | ⭐⭐ Higher complexity because extraction logic and edge cases must be maintained.                    |
| Total score                 | -      | `2.25 / 5.00`                                                                                         |

**Why not chosen**: It changes the meaning of the payload most aggressively and introduces heuristic behaviour into a contract that should remain deterministic.

### Outcome 🏁

Adopt Option A.

The first-release extension shall keep full HTML as the canonical supported-page capture format. The default first-release maximum HTML payload size shall be `1 MiB` (`1,048,576` bytes), measured as the UTF-8 byte length of the captured `html` string before submission. If the captured HTML exceeds that limit, the extension shall not silently trim the HTML and shall not substitute extracted text or reader-mode output. Instead, it shall return an explicit failure outcome with a documented failure reason, such as `payload_too_large`, and it shall not send a payload.

Transport-level compression may be used where supported, but only as a transport optimisation. Compression must not change the logical payload contract.

This decision is reversible. It should be revisited if the product later requires a distinct derived-content capture mode, or if backend and product needs change enough to justify a new versioned payload contract.

### Rationale 🧠

Option A gives the cleanest balance of correctness, clarity, and practicality.

- It preserves the meaning of the `html` field.
- It makes failure semantics explicit instead of hiding them.
- It aligns with schema validation and mandatory contract testing.
- It separates content fidelity decisions from transport-efficiency decisions.
- It keeps future options open without polluting the first-release contract.

## Consequences ⚖️

- The implementation must measure HTML size deterministically before submission.
- The schema, mocks, and tests must include oversized-payload behaviour.
- The backend and extension teams must keep the documented `1 MiB` threshold aligned across schema, mocks, and tests.
- Compression can still be evaluated as an optimisation, but not as a substitute for contract decisions.
- If the product later needs text extraction or reader-mode capture, that should be introduced as a new explicit contract shape or field, not as hidden fallback behaviour.

This decision no longer applies if the product stops transmitting HTML as the canonical capture format, or if a later versioned schema introduces an explicit derived-content mode.

## Compliance 📏

Compliance is met when:

- The PRD states that oversized HTML must be handled explicitly.
- The PRD does not permit silent HTML trimming or text substitution as normal full capture.
- Automated tests cover oversized HTML handling.
- Contract artefacts and mocks use an explicit failure reason for oversize cases.

Validation approach:

- Run in local development and CI.
- Check the PRD, ADRs, schema artefacts, and tests for consistent oversized-payload semantics.
- Produce evidence through linter output, schema validation output, and test results.

Local command:

```bash
rg -n "payload_too_large|silently trim|extracted text|maximum payload size" docs/prd.md docs/adr/ADR-004_Oversized_HTML_Payload_Handling.md && make lint
```

## Notes 🔗

- Product requirements: [../prd.md](../prd.md)
- Related ADR: [ADR-001_Link_Capture_Payload_Contract.md](./ADR-001_Link_Capture_Payload_Contract.md)
- Related ADR: [ADR-003_Contract_Testing_Strategy.md](./ADR-003_Contract_Testing_Strategy.md)
- Template used: [ADR-nnn_Any_Decision_Record_Template.md](./ADR-nnn_Any_Decision_Record_Template.md)
- Reference guidance: [Tech_Radar.md](./Tech_Radar.md)

## Actions ✅

- [x] Dan, 2026-03-20, define first-release oversized HTML handling semantics
- [x] Dan, 2026-03-20, agree and document the maximum HTML payload-size threshold as `1 MiB` measured by UTF-8 byte length
- [ ] Dan, TBD, add oversize handling to schema, mocks, and automated tests

## Tags 🏷️

`#performance|#privacy|#security|#interoperability|#compatibility|#data-integrity|#testability|#maintainability|#simplicity`
