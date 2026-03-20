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

The extension must support sending the current page URL, page title, and page HTML to a backend REST endpoint for supported HTML pages. Where HTML capture is blocked by browser restrictions or page type, the extension must still send a partial payload containing the available metadata plus explicit capture status and failure reason fields.

A local mock service is required during development and testing so that payloads emitted by the extension can be validated safely before integration with a real backend service. Contract testing should be considered as part of the delivery approach to ensure that the payload schema is implemented consistently by both the extension and the backend service.

TODO: 1) Research contract testing, 2) Make contract testing mandatory

## 2. Purpose

The purpose of this product is to provide a simple, reliable and low-friction mechanism for capturing links from a user’s active browser session and forwarding them to a backend platform for later processing.

The product should:

- reduce friction in capturing links from the browser
- provide a consistent API payload to backend services
- support professional engineering practices, including local development, mocking, and contract verification
- offer an extensible foundation for additional metadata capture without forcing the first release to solve downstream processing concerns

## 3. Goals

### 3.1 Primary Goals

- Enable a user to send the active page URL, page title, and page HTML for supported pages to a backend REST API from Chrome.
- Support two user invocation methods:
  - extension toolbar icon click
  - keyboard shortcut

- Define a clear, versionable API payload contract between the extension and backend service for both full and partial capture outcomes.
- Provide a local mock/testing approach so the extension can be developed and verified independently of the real backend.
- Establish a design that can be extended later to include additional metadata without changing the core capture flow.

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

TODO: 1) Research how extension can authenticate against the API, 2) Make it a requirement

## 5. Background and Context

The product is part of a larger professional service. The browser extension acts as a focused capture client that transmits page-related data to a backend service. The backend service will process the payload further, but that processing belongs to a separate workstream.

The conversation to date established the following delivery assumptions:

- the browser target is Google Chrome
- the extension should use the Chrome Extensions Manifest V3 model
- the extension should support both toolbar action and keyboard command invocation
- a background service worker is the correct place to coordinate sending data to the API
- page HTML capture is required for supported pages, but requires page-context access through a content script or `chrome.scripting.executeScript()`
- a local mock endpoint is needed to inspect and test payloads during development
- contract testing should be considered to keep both extension and backend aligned on payload format

TODO: Extension code must be unit-testable

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
- retrieval of the active tab title where available
- retrieval of page HTML for supported pages
- POST submission of payload data to a configured REST API endpoint
- partial payload submission when HTML capture is blocked
- local development support using an unpacked extension
- local mock server support for payload inspection and testing
- documented payload schema
- consideration of contract testing between client and backend

TODO: Encode page content (HTML and JavaScript) to be safely included in JSON payload

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

The system shall capture the page title as part of the payload where it is available.

### FR6. Capture HTML

The system shall capture the page HTML content in addition to the URL and title for supported HTML pages.

Notes:

- HTML capture is expected to use page-context execution rather than direct access from the background service worker.
- When HTML capture is blocked, the system shall send a partial payload with the required fallback fields defined by the payload contract.

TODO: Post MVP - 1) capture open and close of the page, 2) background page processing without user interaction, e.g. classification of the page for later approval

### FR7. Submit Payload to REST API

The system shall send the capture payload to a configured backend REST endpoint using an HTTP POST request with a JSON body.

### FR8. Include Capture Metadata

The system shall include request metadata in the payload according to the payload contract.

Required on supported HTML pages:

- URL
- page title
- HTML content
- trigger source, for example `icon` or `shortcut`
- timestamp of capture
- schema version

Required when HTML capture is blocked:

- URL
- page title, if available
- trigger source
- timestamp of capture
- schema version
- capture status
- failure reason

Optional but recommended:

- canonical URL
- page language
- meta description
- site name
- author
- published date
- HTML byte length
- HTML hash
- extension version

### FR9. Handle Submission Errors

The system shall handle API failures gracefully and log or surface errors in a way that supports development and troubleshooting.

### FR10. Support Local Mock Endpoint

The system shall support configuration that allows the payload to be sent to a local mock server during development and test.

### FR11. Use Shared Capture Logic

The system shall implement a single internal capture-and-send flow used by both trigger mechanisms.

### FR12. Restricted Page Handling

The system shall handle cases where the active tab does not expose a readable URL or does not allow page script injection.

## 10. Proposed Payload Contract

The first-release payload for supported HTML pages is:

```json
{
  "url": "https://example.com/article",
  "title": "Example Article",
  "html": "<html>...</html>",
  "trigger": "icon",
  "capturedAt": "2026-03-20T10:15:00.000Z",
  "schemaVersion": "1.0.0"
}
```

The first-release payload when HTML capture is blocked is:

```json
{
  "url": "chrome://extensions/",
  "trigger": "shortcut",
  "capturedAt": "2026-03-20T10:15:00.000Z",
  "schemaVersion": "1.0.0",
  "captureStatus": "partial",
  "failureReason": "html_capture_blocked"
}
```

Optional but recommended metadata may be added to either payload shape when available and appropriate:

TODO: Make the `Optional but recommended metadata` part of the requirements, this is not optional, however only send all the fields below if the configuration option of extend fields is enabled, default is false

- `canonicalUrl`
- `language`
- `metaDescription`
- `siteName`
- `author`
- `publishedDate`
- `htmlByteLength`
- `htmlHash`
- `extensionVersion`

## 10.1 Payload Design Principles

- JSON over HTTP POST
- stable and versionable
- explicit required fields for the first release
- one versioned contract for both full and partial capture outcomes
- explicitly extensible for additional metadata
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
- `scripting` for required page HTML capture
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

TODO: Mock authentication on the mock side

## 12.1 Mocking Use Cases

- verify that clicking the icon sends the correct payload
- verify that using the keyboard shortcut sends the same payload structure
- verify full HTML capture on supported pages
- verify partial payloads when HTML capture is blocked
- verify handling of 200, 400, 401, 500 and timeout scenarios
- inspect headers and request body during development

TODO: What are the cases `when HTML capture can be blocked`?

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

The product must recognise that HTML capture is materially more sensitive than URL-only capture. The implementation should capture only the agreed contract fields, handle blocked capture explicitly, and control payload size and downstream use of HTML content.

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

TODO: Research best practice here - e.g. a success or error could be communicated via a single blink or change of the colour of the extension icon to green-is or red-ish colour / shade

### 14.3 Low Friction

The user should not need to manually copy URLs or navigate away from the current page in order to capture it.

## 15. Assumptions

- users are operating in Google Chrome
- the extension is developed initially for local installation as unpacked
- the backend exposes an HTTP endpoint that accepts JSON payloads
- backend processing is handled elsewhere
- supported pages expose enough browser context to capture URL, title, and HTML
- restricted pages may require a partial payload because HTML capture can be blocked
- contract alignment between frontend extension and backend service is important for delivery confidence

## 16. Constraints

- Chrome extension local installation currently relies on loading an unpacked extension through Chrome’s extension management UI
- some browser pages cannot be read or injected into due to Chrome restrictions
- the background service worker cannot access page DOM directly
- large HTML payloads may affect performance and increase privacy risk

TODO: Consider trimming content, and extracting text only for large pages

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

- constrain the payload to the agreed fields and schema version
- define and validate partial payload behaviour for blocked capture
- validate payload size, hashing, and downstream handling expectations
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
- clicking the extension icon sends URL, title, HTML, trigger, captured timestamp, and schema version for supported HTML pages
- using the keyboard shortcut sends the same full payload on supported HTML pages
- when HTML capture is blocked, the extension sends a partial payload with capture status and failure reason
- the local mock server can receive and display both full and partial payloads for inspection
- the payload shape is documented and validated
- the project has a defined approach for contract testing or equivalent schema verification

## 19. Acceptance Criteria

### AC1

When the extension is installed and the user clicks the extension icon on a supported HTML page, the extension sends a JSON POST request containing `url`, `title`, `html`, `trigger`, `capturedAt`, and `schemaVersion` to the configured endpoint.

### AC2

When the extension is installed and the user uses the keyboard shortcut on a supported HTML page, the extension sends a JSON POST request using the same capture flow and schema.

### AC3

When HTML capture is blocked, the extension sends a partial JSON POST request containing `url`, `title` if available, `trigger`, `capturedAt`, `schemaVersion`, `captureStatus`, and `failureReason`.

### AC4

Where available and appropriate, the payload contract supports recommended metadata fields including canonical URL, language, meta description, site name, author, published date, HTML byte length, HTML hash, and extension version.

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
- capture active tab URL, title, and HTML on supported pages
- send a partial payload with capture status and failure reason when HTML capture is blocked
- POST to local mock endpoint

### Phase 2. Unified Trigger Support

- add keyboard shortcut
- route both triggers through shared capture logic
- include trigger source, timestamp, and schema version in all payloads

### Phase 3. Recommended Metadata and Hardening

- add recommended metadata such as canonical URL, language, meta description, site name, author, and published date where available
- add HTML byte length, HTML hash, and extension version
- validate payload size and privacy considerations
- improve feedback and error handling

### Phase 4. Contract Confidence

- formalise payload schema
- add automated payload validation
- implement or adopt contract testing approach between extension and backend

## 21. Open Questions

- What size limit or truncation strategy should apply to HTML payloads?
- Which page signals should be trusted for published date and author extraction?
- How will environment-specific endpoint configuration be managed?
- What authentication mechanism, if any, will be required by the backend?
- Which hashing algorithm should be used for `htmlHash`?
- What contract-testing approach will the wider programme standardise on?
- Is any visible user feedback required in the first release beyond developer logging?

TODO: Answer the questions

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
- Capture HTML for supported pages
- Send a partial payload when HTML capture is blocked
- POST JSON payload to REST API
- Support local mocking
- Consider contract testing

## 24. Appendix C: Summary Statement

This PRD defines a focused Chrome extension component within a wider professional link-capture service. The extension is responsible for user-triggered capture of page information and transmission of an agreed payload to a backend API. Backend processing is explicitly out of scope. Local mocking and contract testing are important delivery considerations to ensure payload quality, confidence in integration, and a stable boundary between this project and the downstream processing project.
