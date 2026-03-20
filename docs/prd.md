# Product Requirements Document (PRD)

## Project Title

Link Capture Browser Extension

## Document Status

Draft

## Document Owner

Dan

## 1. Overview

This project will deliver a Google Chrome extension that captures information about the page a user is currently viewing and sends that information to a backend REST API for further processing.

This is not a hobby or DIY utility. It is part of a wider professional service intended to support link capture from users’ browsing activity in a controlled and repeatable way. The browser extension is the client-side capture mechanism only. Downstream processing, enrichment, storage, classification, workflow automation, and any other backend-side handling are out of scope for this PRD and will be covered by a separate project.

The extension must allow the user to send the current page information by either:

- clicking the extension icon in Chrome
- using a keyboard shortcut

The extension must initially support sending the current page URL to a backend REST endpoint. The design should also support sending additional page metadata and, where required, HTML content captured from the active page.

A local mock service is required during development and testing so that payloads emitted by the extension can be validated safely before integration with a real backend service. Contract testing should be considered as part of the delivery approach to ensure that the payload schema is implemented consistently by both the extension and the backend service.

## 2. Purpose

The purpose of this product is to provide a simple, reliable and low-friction mechanism for capturing links from a user’s active browser session and forwarding them to a backend platform for later processing.

The product should:

- reduce friction in capturing links from the browser
- provide a consistent API payload to backend services
- support professional engineering practices, including local development, mocking, and contract verification
- offer an extensible foundation for future metadata capture without forcing the first release to solve downstream processing concerns

## 3. Goals

### 3.1 Primary Goals

- Enable a user to send the active page URL to a backend REST API from Chrome.
- Support two user invocation methods:
  - extension toolbar icon click
  - keyboard shortcut

- Define a clear, versionable API payload contract between the extension and backend service.
- Provide a local mock/testing approach so the extension can be developed and verified independently of the real backend.
- Establish a design that can be extended later to include page title and page HTML.

### 3.2 Secondary Goals

- Minimise user effort and interaction overhead.
- Keep permissions as narrow as reasonably possible.
- Support straightforward local installation and development as an unpacked Chrome extension.
- Enable future observability and troubleshooting through meaningful success and error handling.

## 4. Non-Goals

The following are explicitly out of scope for this PRD:

- backend processing of captured links after receipt
- classification, tagging, summarisation, indexing, storage, search, or retrieval of captured links
- user account management
- cross-browser support beyond Chrome for the initial release
- enterprise deployment packaging and store publication
- advanced UI workflows beyond icon click and keyboard shortcut
- full scraping, parsing, extraction, or transformation of captured HTML on the backend
- implementation of downstream data contracts outside the capture payload itself

## 5. Background and Context

The product is part of a larger professional service. The browser extension acts as a focused capture client that transmits page-related data to a backend service. The backend service will process the payload further, but that processing belongs to a separate workstream.

The conversation to date established the following delivery assumptions:

- the browser target is Google Chrome
- the extension should use the Chrome Extensions Manifest V3 model
- the extension should support both toolbar action and keyboard command invocation
- a background service worker is the correct place to coordinate sending data to the API
- page HTML capture is possible, but requires page-context access through a content script or `chrome.scripting.executeScript()`
- a local mock endpoint is needed to inspect and test payloads during development
- contract testing should be considered to keep both extension and backend aligned on payload format

## 6. Users and Stakeholders

### 6.1 Primary Users

- end users who want to capture the current page into a wider service with minimal effort

### 6.2 Delivery Stakeholders

- product owner or service owner for the broader link capture service
- extension developers
- backend API developers
- QA and test engineers
- platform or DevOps engineers supporting local and integration environments

## 7. User Needs

Users need to:

- capture the current page quickly without leaving their browsing flow
- trust that the correct page information is being sent
- use either the mouse or keyboard, depending on preference
- have a solution that behaves consistently and predictably

Engineering and delivery teams need to:

- test the extension without depending immediately on a live backend
- verify that payloads conform to an agreed schema
- evolve the payload over time without breaking compatibility unexpectedly

## 8. Product Scope

## 8.1 In Scope

The product will include:

- a Chrome extension using Manifest V3
- an extension action that triggers capture when the icon is clicked
- a keyboard command that triggers the same capture flow
- retrieval of the active tab URL
- optional retrieval of the active tab title
- optional retrieval of page HTML for supported pages
- POST submission of payload data to a configured REST API endpoint
- local development support using an unpacked extension
- local mock server support for payload inspection and testing
- documented payload schema
- consideration of contract testing between client and backend

## 8.2 Out of Scope

The product will not include:

- backend-side business logic after payload receipt
- UI for browsing previously captured links
- rich user settings UI in the initial version unless required for API configuration
- support for unsupported or restricted browser pages beyond graceful handling

## 9. Functional Requirements

### FR1. Capture Trigger by Extension Icon

The system shall allow the user to trigger a capture by clicking the Chrome extension icon.

### FR2. Capture Trigger by Keyboard Shortcut

The system shall allow the user to trigger a capture by using a configured keyboard shortcut.

### FR3. Retrieve Active Tab Context

When triggered, the system shall identify the currently active tab in the focused Chrome window.

### FR4. Capture URL

The system shall capture the URL of the active page, where Chrome permissions and page type allow access.

### FR5. Capture Title

The system should capture the page title as part of the payload.

### FR6. Optional HTML Capture

The system may capture the page HTML content in addition to the URL and title.

Notes:

- HTML capture is expected to use page-context execution rather than direct access from the background service worker.
- HTML capture should be feature-flagged or configurable during implementation to avoid unnecessary payload size and privacy risk in the earliest version.

### FR7. Submit Payload to REST API

The system shall send the capture payload to a configured backend REST endpoint using an HTTP POST request with a JSON body.

### FR8. Include Basic Metadata

The system should include useful request metadata in the payload, such as:

- URL
- page title
- trigger source, for example `icon` or `shortcut`
- timestamp of capture
- optional HTML content

### FR9. Handle Submission Errors

The system shall handle API failures gracefully and log or surface errors in a way that supports development and troubleshooting.

### FR10. Support Local Mock Endpoint

The system shall support configuration that allows the payload to be sent to a local mock server during development and test.

### FR11. Use Shared Capture Logic

The system shall implement a single internal capture-and-send flow used by both trigger mechanisms.

### FR12. Restricted Page Handling

The system shall handle cases where the active tab does not expose a readable URL or does not allow page script injection.

## 10. Proposed Payload Model

The minimum viable payload is:

```json
{
  "url": "https://example.com/article"
}
```

The preferred initial professional payload is:

```json
{
  "url": "https://example.com/article",
  "title": "Example Article",
  "trigger": "icon",
  "capturedAt": "2026-03-20T10:15:00.000Z"
}
```

The extended payload model for pages where HTML capture is enabled is:

```json
{
  "url": "https://example.com/article",
  "title": "Example Article",
  "trigger": "shortcut",
  "capturedAt": "2026-03-20T10:15:00.000Z",
  "html": "<html>...</html>"
}
```

## 10.1 Payload Design Principles

- JSON over HTTP POST
- stable and versionable
- minimal required fields in the first release
- explicitly extensible for future metadata
- suitable for schema validation and contract testing

## 10.2 Contract Considerations

The payload contract should be documented formally and ideally expressed in a machine-readable format, for example JSON Schema or OpenAPI schema components.

The contract should define:

- required fields
- optional fields
- allowed value types
- field naming conventions
- payload size expectations where relevant
- versioning approach if the schema evolves

Contract testing should be considered or adopted so that:

- the extension can verify that it emits valid payloads
- the backend can verify that it accepts the agreed contract
- schema drift is detected early in CI

## 11. Technical Requirements

### 11.1 Browser Platform

- Google Chrome
- Chrome Extensions Manifest V3

### 11.2 Extension Architecture

The expected architecture is:

- `manifest.json` for extension declaration, commands, permissions and host permissions
- background service worker for orchestration and API submission
- use of Chrome action click event for icon-triggered capture
- use of Chrome commands API for keyboard shortcut capture
- use of `chrome.tabs.query()` to resolve the active tab
- use of `chrome.scripting.executeScript()` or content script injection where page HTML is required

### 11.3 Permissions

Initial permissions are expected to include only what is necessary, likely including:

- `activeTab`
- `tabs`
- `scripting` if HTML capture is enabled
- `host_permissions` for the backend API domain

The implementation should prefer least privilege and avoid unnecessary broad permissions.

### 11.4 Local Installation and Development

The extension should be installable locally in Chrome as an unpacked extension during development.

### 11.5 Configuration

The implementation should support environment-specific API targets, at minimum:

- local mock endpoint
- non-production backend endpoint
- production backend endpoint

This may be achieved through build-time configuration, environment substitution, or a minimal extension options mechanism.

## 12. Mocking and Local Test Requirements

A local mock server is required so developers can test the extension without depending on the real backend.

The mock capability must support:

- receiving JSON POST requests from the extension
- inspecting the exact payload sent
- returning deterministic success and failure responses
- supporting rapid iteration during extension development
- validating that payload structure matches the agreed contract

## 12.1 Mocking Use Cases

- verify that clicking the icon sends the correct payload
- verify that using the keyboard shortcut sends the same payload structure
- verify optional HTML capture
- verify handling of 200, 400, 401, 500 and timeout scenarios
- inspect headers and request body during development

## 12.2 Contract Testing Recommendation

The delivery approach should consider contract testing between the extension and backend API.

This could be implemented using consumer-driven contract testing or schema-based contract validation. The objective is to ensure that the payload emitted by the extension adheres to the agreed API contract and that the backend honours the same contract.

Recommended principles:

- define the payload contract early
- validate example payloads in automated tests
- include both positive and negative cases
- fail CI when the consumer and provider drift apart

## 13. Non-Functional Requirements

### 13.1 Reliability

The extension should reliably submit payloads when invoked on supported pages and when the endpoint is available.

### 13.2 Performance

The extension should respond quickly to the user action and should not noticeably interrupt browsing.

### 13.3 Security

- API endpoints must be explicitly permitted.
- Secrets must not be hard-coded in source intended for wider sharing.
- The design should consider whether authentication is required, for example API keys or bearer tokens.
- Care must be taken if HTML content is transmitted, because page HTML may include sensitive information.

### 13.4 Privacy

The product must recognise that HTML capture is materially more sensitive than URL-only capture. The implementation should default to the minimal safe payload unless there is a clear requirement for richer capture.

### 13.5 Maintainability

The implementation should keep the capture flow simple, modular and testable, with shared logic across all trigger paths.

### 13.6 Observability

At minimum during development, the extension and mock environment should provide enough logging to diagnose:

- payload construction
- endpoint submission success or failure
- restricted page issues
- permission-related failures

## 14. UX Requirements

The UX should be intentionally lightweight.

### 14.1 Invocation

The user should be able to:

- click the extension icon to send the current page
- use a keyboard shortcut to send the current page

### 14.2 Feedback

The implementation should consider lightweight feedback to the user, for example success or failure indication, but this is a secondary concern for the first iteration.

### 14.3 Low Friction

The user should not need to manually copy URLs or navigate away from the current page in order to capture it.

## 15. Assumptions

- users are operating in Google Chrome
- the extension is developed initially for local installation as unpacked
- the backend exposes an HTTP endpoint that accepts JSON payloads
- backend processing is handled elsewhere
- the extension may need to evolve from URL-only capture to richer capture later
- contract alignment between frontend extension and backend service is important for delivery confidence

## 16. Constraints

- Chrome extension local installation currently relies on loading an unpacked extension through Chrome’s extension management UI
- some browser pages cannot be read or injected into due to Chrome restrictions
- the background service worker cannot access page DOM directly
- large HTML payloads may affect performance and increase privacy risk

## 17. Risks and Mitigations

### Risk 1. Payload Contract Drift

The extension and backend may diverge in their understanding of the payload.

Mitigation:

- define a formal schema
- adopt contract testing or schema validation in CI
- version the payload if needed

### Risk 2. Over-Capture of Sensitive Content

Capturing HTML may transmit more information than intended.

Mitigation:

- default to URL and title only in the initial release
- make HTML capture explicit and controlled
- document privacy and security expectations clearly

### Risk 3. Restricted Browser Contexts

Some pages may block access to URL details or script injection.

Mitigation:

- handle errors gracefully
- log failures for diagnosis
- document known unsupported contexts

### Risk 4. Local Testing Diverges from Real Backend Behaviour

Mock implementations can differ from the real provider.

Mitigation:

- keep the mock focused on the real payload contract
- supplement mocking with contract tests and integration tests

### Risk 5. Configuration Drift Across Environments

The wrong endpoint or configuration may be used during testing or release.

Mitigation:

- use clear environment-specific configuration
- minimise manual configuration steps
- document setup explicitly

## 18. Success Criteria

The first release will be considered successful when:

- a user can install the extension locally in Chrome
- clicking the extension icon sends the current page payload to a configured endpoint
- using the keyboard shortcut sends the same payload to the configured endpoint
- the local mock server can receive and display the payload for inspection
- the payload shape is documented and validated
- the project has a defined approach for contract testing or equivalent schema verification

## 19. Acceptance Criteria

### AC1

When the extension is installed and the user clicks the extension icon on a supported page, the extension sends a JSON POST request containing the current page URL to the configured endpoint.

### AC2

When the extension is installed and the user uses the keyboard shortcut on a supported page, the extension sends a JSON POST request using the same capture flow and schema.

### AC3

The payload includes at least the URL and should include title, trigger source and timestamp in the initial professional implementation.

### AC4

Where HTML capture is enabled, the extension can send page HTML in the payload for supported pages.

### AC5

The extension can be configured to target a local mock endpoint for development.

### AC6

The local mock endpoint can be used to inspect the request body and simulate success and failure responses.

### AC7

A documented contract exists for the payload, and the delivery approach includes contract testing or schema validation considerations.

## 20. Delivery Approach

A sensible phased delivery approach is:

### Phase 1. Minimal Capture

- create Chrome extension skeleton
- implement icon click trigger
- capture active tab URL
- POST to local mock endpoint

### Phase 2. Unified Trigger Support

- add keyboard shortcut
- route both triggers through shared capture logic
- include title, trigger source and timestamp

### Phase 3. Richer Capture

- add optional HTML capture
- validate payload size and privacy considerations
- improve feedback and error handling

### Phase 4. Contract Confidence

- formalise payload schema
- add automated payload validation
- implement or adopt contract testing approach between extension and backend

## 21. Open Questions

- Will the first production release send URL only, or URL plus title and metadata?
- Is HTML capture required in the first release, or only designed for later enablement?
- How will environment-specific endpoint configuration be managed?
- What authentication mechanism, if any, will be required by the backend?
- What contract-testing approach will the wider programme standardise on?
- Is any visible user feedback required in the first release beyond developer logging?

## 22. Appendix A: Suggested Initial Extension Structure

```text
link-capture-extension/
├── manifest.json
├── background.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
```

## 23. Appendix B: Suggested Initial Capability Summary

- Trigger by icon click
- Trigger by keyboard shortcut
- Capture active tab URL
- Capture title
- Optionally capture HTML
- POST JSON payload to REST API
- Support local mocking
- Consider contract testing

## 24. Appendix C: Summary Statement

This PRD defines a focused Chrome extension component within a wider professional link-capture service. The extension is responsible for user-triggered capture of page information and transmission of an agreed payload to a backend API. Backend processing is explicitly out of scope. Local mocking and contract testing are important delivery considerations to ensure payload quality, confidence in integration, and a stable boundary between this project and the downstream processing project.
