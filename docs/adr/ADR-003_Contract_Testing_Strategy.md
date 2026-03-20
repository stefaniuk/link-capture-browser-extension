# ADR-003: Contract Testing Strategy

> |              |                                                               |
> | ------------ | ------------------------------------------------------------- |
> | Date         | `2026-03-20`                                                  |
> | Status       | `Accepted`                                                    |
> | Significance | `Interfaces & contracts, Delivery & build, Testability, Data` |

---

- [ADR-003: Contract Testing Strategy](#adr-003-contract-testing-strategy)
  - [Context 🧭](#context-)
  - [Decision ✅](#decision-)
    - [Assumptions 🧩](#assumptions-)
    - [Drivers 🎯](#drivers-)
    - [Options 🔀](#options-)
      - [Option A: Mandatory shared JSON Schema validated by both consumer and provider (Selected) ✅](#option-a-mandatory-shared-json-schema-validated-by-both-consumer-and-provider-selected-)
      - [Option B: Mandatory consumer-driven contract testing with Pact](#option-b-mandatory-consumer-driven-contract-testing-with-pact)
      - [Option C: Mocks and integration tests without a shared executable contract](#option-c-mocks-and-integration-tests-without-a-shared-executable-contract)
    - [Outcome 🏁](#outcome-)
    - [Rationale 🧠](#rationale-)
  - [Consequences ⚖️](#consequences-️)
  - [Compliance 📏](#compliance-)
  - [Notes 🔗](#notes-)
  - [Actions ✅](#actions-)
  - [Tags 🏷️](#tags-️)

## Context 🧭

The Link Capture Browser Extension and its backend API share a payload contract that now includes full-capture and partial-capture outcomes, optional extended metadata behind configuration, authentication-related expectations, and explicit failure semantics.

The PRD previously treated contract testing as a possible future improvement. That is not strong enough. The project constitution requires deterministic, testable behaviour and explicitly mandates contract tests for service boundaries. The integration between the extension and the backend API is exactly such a boundary.

The team therefore needs a contract-testing strategy that is mandatory, automatable, understandable by both extension and backend teams, and practical for a payload that is primarily a versioned JSON request body.

Research and context indicate the following:

- Consumer-driven contract tools such as Pact are powerful when consumer and provider teams actively collaborate around specific API interactions and want generated contracts plus provider verification workflows.
- Pact is less attractive when the main need is a shared, deterministic definition of a JSON payload shape and when introducing broker and pact-file workflows would add more moving parts than value.
- JSON Schema is a standard for describing the structure and constraints of JSON documents and is well suited to validation, documentation, and automated testing across languages.

This decision relates directly to the PRD requirements in [../prd.md](../prd.md) and builds on the payload decision recorded in [ADR-001_Link_Capture_Payload_Contract.md](./ADR-001_Link_Capture_Payload_Contract.md).

## Decision ✅

### Assumptions 🧩

- The capture payload will remain JSON over HTTP POST.
- Both the extension and the backend are under coordinated delivery, even if they are implemented in different repositories or languages.
- The project needs a machine-readable contract that can be validated locally and in CI.
- The first-release API surface is centred on a small number of request shapes rather than a large public API portfolio.

### Drivers 🎯

- Deterministic, machine-verifiable contract enforcement for both consumer and provider.
- Simplicity and low operational overhead for the first release.
- Good fit for a versioned JSON payload contract.
- Clear CI failure when schema drift occurs.
- Compatibility with future documentation and tooling.

### Options 🔀

Scoring method: weighted score = `sum(weight * score) / sum(weights)`, where higher is better. The highest weights are given to determinism and implementation fit because the core need is a reliable, low-friction executable contract.

#### Option A: Mandatory shared JSON Schema validated by both consumer and provider (Selected) ✅

**Top criteria**: Determinism and testability, implementation fit

**Weighted option score**: `4.67 / 5.00`

This option defines the payload contract once as a versioned JSON Schema. The extension validates emitted payloads against it, the backend validates accepted request bodies against it, and CI fails when either side drifts.

| Criteria                        | Weight | Score/Notes                                                                                      |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Determinism and testability     | 5      | ⭐⭐⭐⭐⭐ One executable contract with deterministic validation results on both sides.          |
| Implementation fit              | 5      | ⭐⭐⭐⭐⭐ Excellent fit for a JSON request payload with clear field constraints and versioning. |
| Operational simplicity          | 4      | ⭐⭐⭐⭐ Low moving parts and no broker requirement for the first release.                       |
| Cross-language interoperability | 3      | ⭐⭐⭐⭐⭐ JSON Schema validators exist across languages and toolchains.                         |
| Effort                          | 2      | ⭐⭐⭐⭐ Moderate effort to create and wire into CI, but straightforward.                        |
| Total score                     | -      | `4.67 / 5.00`                                                                                    |

#### Option B: Mandatory consumer-driven contract testing with Pact

**Top criteria**: Determinism and testability, implementation fit

**Weighted option score**: `3.83 / 5.00`

This option uses Pact to generate consumer contracts from extension-side tests and verify them against the backend provider.

| Criteria                        | Weight | Score/Notes                                                                                   |
| ------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Determinism and testability     | 5      | ⭐⭐⭐⭐ Strong verification model when both sides actively use Pact.                         |
| Implementation fit              | 5      | ⭐⭐⭐ Good for HTTP interactions, but heavier than needed for a small JSON payload boundary. |
| Operational simplicity          | 4      | ⭐⭐ Introduces pact files, provider-state handling, and often a broker workflow.             |
| Cross-language interoperability | 3      | ⭐⭐⭐⭐ Good ecosystem support, but more tooling conventions to align.                       |
| Effort                          | 2      | ⭐⭐ Higher setup and maintenance effort than schema validation alone.                        |
| Total score                     | -      | `3.83 / 5.00`                                                                                 |

**Why not chosen**: Pact is credible, but it is a heavier solution than the current integration needs. The first release benefits more from one shared schema than from a fuller consumer-driven contract toolchain.

#### Option C: Mocks and integration tests without a shared executable contract

**Top criteria**: Determinism and testability, implementation fit

**Weighted option score**: `1.92 / 5.00`

This option relies on documentation, example payloads, mocks, and ordinary integration tests, but without a single shared machine-readable contract.

| Criteria                        | Weight | Score/Notes                                                                                  |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Determinism and testability     | 5      | ⭐ Weakest option because drift is detected late and inconsistently.                         |
| Implementation fit              | 5      | ⭐⭐ Easy to start, but poor long-term fit for an evolving payload contract.                 |
| Operational simplicity          | 4      | ⭐⭐⭐⭐ Simple at first, but brittle once the contract changes.                             |
| Cross-language interoperability | 3      | ⭐⭐ Works socially, not technically; consistency depends on discipline rather than tooling. |
| Effort                          | 2      | ⭐⭐⭐⭐⭐ Lowest initial effort.                                                            |
| Total score                     | -      | `1.92 / 5.00`                                                                                |

**Why not chosen**: It does not satisfy the constitutional requirement for contract tests on service boundaries and leaves too much room for schema drift.

### Outcome 🏁

Adopt Option A.

Contract testing is mandatory for the extension-to-backend integration. The required first-release strategy is:

- define the payload contract as a shared, versioned JSON Schema
- validate extension-emitted payloads against that schema in automated tests
- validate backend request handling against the same schema in automated tests
- run those checks in CI so schema drift fails builds before integration or release

This decision is reversible. It should be revisited if the API surface grows materially, multiple independently evolving consumers appear, or the team finds that a consumer-driven toolchain such as Pact would produce materially better value than schema-based validation alone.

### Rationale 🧠

Option A gives the project the strongest balance of rigour and pragmatism.

- It matches the actual contract shape: a versioned JSON payload.
- It produces one source of truth that is both human-readable and machine-verifiable.
- It supports local development, CI, mocking, and future documentation with the same contract artefact.
- It keeps the first release simple while still meeting the constitutional requirement for contract tests.

Pact remains a viable future option if the integration landscape becomes more complex, but it is not the best default for this boundary today.

## Consequences ⚖️

- The repository or its near-term implementation work must introduce a shared JSON Schema artefact for the payload.
- Extension tests and backend tests must both consume that schema rather than re-implementing contract rules separately.
- CI must fail when schema validation fails on either side.
- The team must maintain schema versioning explicitly as the payload evolves.
- If OpenAPI documentation is added, it should reuse the same schema definitions rather than creating a second independent contract source.

This decision no longer applies if the integration stops being JSON-based, or if the contract boundary expands enough that a consumer-driven contract platform becomes the clearer fit.

## Compliance 📏

Compliance is met when:

- The PRD states that contract testing is mandatory.
- A shared, versioned JSON Schema exists for the payload contract.
- Automated tests in the extension validate full and partial payload examples against that schema.
- Automated tests in the backend validate request handling against the same schema.
- CI fails when either side no longer conforms to the schema.

Validation approach:

- Run in local development and CI.
- Check the PRD, schema artefacts, and test suites for consistency with this ADR.
- Produce evidence through linter output, schema validation output, and test results.

Local command:

```bash
rg -n "contract testing is mandatory|shared, versioned JSON Schema|schema drift" docs/prd.md docs/adr/ADR-003_Contract_Testing_Strategy.md && make lint
```

## Notes 🔗

- Product requirements: [../prd.md](../prd.md)
- Related ADR: [ADR-001_Link_Capture_Payload_Contract.md](./ADR-001_Link_Capture_Payload_Contract.md)
- Related ADR: [ADR-002_Extension_API_Authentication.md](./ADR-002_Extension_API_Authentication.md)
- Template used: [ADR-nnn_Any_Decision_Record_Template.md](./ADR-nnn_Any_Decision_Record_Template.md)
- Reference guidance: [Tech_Radar.md](./Tech_Radar.md)

## Actions ✅

- [x] Dan, 2026-03-20, make contract testing a mandatory PRD requirement
- [ ] Dan, TBD, define the shared payload JSON Schema artefact
- [ ] Dan, TBD, wire schema validation into extension CI and backend CI

## Tags 🏷️

`#interoperability|#compatibility|#testability|#maintainability|#data-integrity|#deployability|#simplicity`
