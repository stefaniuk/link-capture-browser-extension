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

The extension must authenticate to the backend API using OAuth 2.0 Authorization Code Flow with PKCE, with the extension acting as a public client and sending bearer access tokens over HTTPS.

A local mock service is required during development and testing so that payloads emitted by the extension can be validated safely before integration with a real backend service. Contract testing is mandatory and shall use a shared, versioned JSON Schema so that the payload contract is validated consistently by both the extension and the backend service.

## 2. Purpose

The purpose of this product is to provide a simple, reliable and low-friction mechanism for capturing links from a user’s active browser session and forwarding them to a backend platform for later processing.

The product should:

- reduce friction in capturing links from the browser
- provide a consistent API payload to backend services
- support professional engineering practices, including local development, mocking, and mandatory contract verification
- offer an extensible foundation for additional metadata capture without forcing the first release to solve downstream processing concerns

## 3. Goals

### 3.1 Primary Goals

- Enable a user to send the active page URL, page title, and page HTML for supported pages to a backend REST API from Chrome.
- Support two user invocation methods:
  - extension toolbar icon click
  - keyboard shortcut

- Define a clear, versionable API payload contract between the extension and backend service for both full and partial capture outcomes.
- Authenticate securely to the backend API without embedding user credentials, client secrets, or long-lived shared API keys in the extension package.
- Provide a local mock/testing approach so the extension can be developed and verified independently of the real backend while enforcing mandatory contract verification against a shared machine-readable schema.
- Ensure the extension codebase is modular and unit-testable so core behaviour can be verified without a live browser session.
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

## 5. Background and Context

The product is part of a larger professional service. The browser extension acts as a focused capture client that transmits page-related data to a backend service. The backend service will process the payload further, but that processing belongs to a separate workstream.

The conversation to date established the following delivery assumptions:

- the browser target is Google Chrome
- the extension should use the Chrome Extensions Manifest V3 model
- the extension should support both toolbar action and keyboard command invocation
- a background service worker is the correct place to coordinate sending data to the API
- page HTML capture is required for supported pages, but requires page-context access through a content script or `chrome.scripting.executeScript()`
- backend API authentication should use a browser-mediated OAuth 2.0 or OpenID Connect flow based on Authorization Code with PKCE
- a local mock endpoint is needed to inspect and test payloads during development
- contract testing should be mandatory to keep both extension and backend aligned on payload format
- extension code should separate core logic from Chrome API integration so that unit tests can verify behaviour deterministically

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
- authenticated POST submission of payload data to a configured REST API endpoint
- partial payload submission when HTML capture is blocked
- user authentication and token acquisition for backend API access
- JSON-safe serialisation of captured page content, including embedded script markup contained within captured HTML
- local development support using an unpacked extension
- a minimal Chrome extension options page for runtime configuration of payload and environment settings
- lightweight per-tab user feedback for capture outcomes using the extension action badge and tooltip
- local mock server support for payload inspection and testing
- unit-testable core extension logic with automated test coverage for critical behaviour
- documented payload schema
- mandatory schema-based contract testing between client and backend

## 8.2 Out of Scope

The product will not include:

- backend-side business logic after payload receipt
- UI for browsing previously captured links
- rich user settings UI beyond a minimal options page for required extension configuration
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
- Any JavaScript present within the captured page source shall be treated as plain text inside the HTML string and shall not be executed, evaluated, or transformed as part of payload construction.

### FR7. Submit Payload to REST API

The system shall send the capture payload to a configured backend REST endpoint using an HTTP POST request with a JSON body.

Notes:

- Captured page content shall be serialised using a standards-compliant JSON encoder rather than manual string concatenation.
- The payload shall preserve page content as UTF-8 compatible text data so that HTML markup and embedded script tags are represented safely as JSON string values.
- The implementation shall reject or fail explicitly if captured content cannot be serialised into valid JSON.
- The implementation shall not silently trim captured HTML or replace it with extracted text in order to fit a size limit.
- If captured HTML exceeds the configured maximum payload size for the first-release contract, the system shall fail explicitly with a documented failure reason rather than mutating the payload content.

### FR8. Authenticate API Requests

The system shall authenticate requests to the backend REST API using OAuth 2.0 Authorization Code Flow with PKCE, with the extension registered as a public client.

Notes:

- The authorization flow shall be initiated in a browser-mediated context using `chrome.identity.launchWebAuthFlow()` or equivalent Chrome Identity API support for an external identity provider.
- The extension shall not collect user credentials directly in extension UI or embedded web views.
- The extension shall send a valid bearer access token in the `Authorization` header for authenticated API requests.
- The extension shall not embed a client secret or long-lived shared API key in the extension package.
- If refresh tokens are issued, they shall be rotating, short-lived, revocable, and handled with the least persistent storage practical for the implementation.

### FR9. Include Capture Metadata

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

Conditionally required when the `extendedFields` configuration option is enabled:

- canonical URL
- page language
- meta description
- site name
- author
- published date
- HTML byte length
- HTML hash
- extension version

Notes:

- The `extendedFields` configuration option shall default to `false`.
- When `extendedFields` is `true`, the system shall include all extended metadata fields in the payload.
- If an extended metadata value cannot be derived reliably, the field shall still be present with a `null` value rather than being omitted.
- The `extendedFields` setting shall be user-configurable through a minimal Chrome extension options page.
- The `publishedDate` field shall use a fixed precedence order of machine-readable signals only: JSON-LD or schema.org `datePublished`; then `article:published_time`; then other well-known machine-readable publication-date meta tags; then a `<time datetime>` value only when it is unambiguous.
- The `author` field shall use a fixed precedence order of machine-readable signals only: JSON-LD or schema.org author name; then `<meta name="author">`; then other well-known article-author meta tags only when they contain a plain-text human-readable name.
- The first release shall not infer `publishedDate` or `author` from arbitrary DOM text, CSS class names, or layout-specific scraping heuristics.
- When `extendedFields` is `true`, `htmlHash` shall use SHA-256 over the UTF-8 bytes of the captured HTML and be formatted as `sha256:<lowercase-hex-digest>`.

### FR10. Handle Submission Errors

The system shall handle API failures gracefully and log or surface errors in a way that supports development and troubleshooting.

### FR11. Support Local Mock Endpoint

The system shall support configuration that allows the payload to be sent to a local mock server during development and test.

### FR12. Use Shared Capture Logic

The system shall implement a single internal capture-and-send flow used by both trigger mechanisms.

### FR13. Restricted Page Handling

The system shall handle cases where the active tab does not expose a readable URL or does not allow page script injection.

Notes:

- HTML capture can be blocked on browser-internal or otherwise protected pages, for example `chrome://` pages and other browser-owned surfaces that do not allow content script injection.
- HTML capture can be blocked when the page uses a URL scheme that is not directly injectable through standard match patterns, for example top-level `about:`, `data:`, `blob:`, or `filesystem:` pages.
- HTML capture can be blocked on `file://` pages when the user has not granted file URL access to the extension.
- HTML capture can be blocked when the extension does not currently hold the necessary host access, for example if the required host permission is missing or an `activeTab` grant is not available.
- HTML capture can be blocked when the active tab is showing a non-HTML browser viewer or document surface, for example a PDF viewer, rather than a standard HTML document.
- HTML capture can fail if the tab navigates, closes, or otherwise becomes unavailable before script injection completes.

### FR14. Provide Lightweight User Feedback

The system shall provide lightweight, per-tab user feedback after each capture attempt.

Notes:

- The first-release feedback mechanism shall use the Chrome action badge and action tooltip.
- Badge text shall use four or fewer characters, for example `OK` for successful full capture, `PART` for successful partial capture, and `ERR` for submission or capture failure.
- The action tooltip shall be updated with a short plain-language status message that mirrors the badge meaning.
- Badge and tooltip feedback shall clear automatically after a short interval so stale status is not left on the action.
- Colour may be used as a supplementary cue on the badge background, but colour shall not be the only indicator of outcome.
- Animated icon changes or blinking shall not be the primary feedback mechanism.
- System notifications shall not be used for routine success feedback in the first release.

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

Extended metadata fields are part of the payload contract when the `extendedFields` configuration option is enabled. This option shall default to `false`. When enabled, both full and partial payload shapes shall include the complete extended metadata block below. If a value cannot be derived reliably, the field shall be sent with a `null` value.

- `canonicalUrl`
- `language`
- `metaDescription`
- `siteName`
- `author`
- `publishedDate`
- `htmlByteLength`
- `htmlHash`
- `extensionVersion`

Example extended metadata block when `extendedFields` is enabled:

```json
{
  "canonicalUrl": "https://example.com/article",
  "language": "en",
  "metaDescription": "Example summary",
  "siteName": "Example Site",
  "author": null,
  "publishedDate": null,
  "htmlByteLength": 18234,
  "htmlHash": "sha256:abc123",
  "extensionVersion": "1.0.0"
}
```

## 10.1 Payload Design Principles

- JSON over HTTP POST
- stable and versionable
- explicit required fields for the first release
- one versioned contract for both full and partial capture outcomes
- explicitly extensible for additional metadata
- safe serialisation of captured content as JSON string data without executing embedded markup or scripts
- suitable for schema validation and contract testing

## 10.2 Contract Considerations

The payload contract shall be documented formally and expressed in a machine-readable format. For this project, the authoritative executable contract shall be a shared, versioned JSON Schema. If OpenAPI documentation is added later, it should reference the same schema rather than duplicate the contract rules.

The contract should define:

- required fields
- conditionally required fields, including the `extendedFields` metadata block
- allowed value types
- `null` handling rules for metadata values that cannot be derived reliably
- field naming conventions
- payload size expectations where relevant
- versioning approach if the schema evolves

Contract testing is mandatory so that:

- the extension can verify that it emits valid payloads
- the backend can verify that it accepts the agreed contract
- schema drift is detected early in CI

The mandatory contract-testing approach shall use the shared JSON Schema as the executable contract for both consumer-side and provider-side validation.

## 11. Technical Requirements

### 11.1 Browser Platform

- Google Chrome
- Chrome Extensions Manifest V3

### 11.2 Extension Architecture

The expected architecture is:

- `manifest.json` for extension declaration, commands, permissions and host permissions
- background service worker for orchestration and API submission
- use of Chrome Identity API support for browser-mediated OAuth redirects and token acquisition
- use of Chrome action click event for icon-triggered capture
- use of Chrome commands API for keyboard shortcut capture
- use of `chrome.tabs.query()` to resolve the active tab
- use of `chrome.scripting.executeScript()` or content script injection where page HTML is required

### 11.3 Permissions

Initial permissions are expected to include only what is necessary, likely including:

- `activeTab`
- `tabs`
- `scripting` for required page HTML capture
- `identity` for the browser-mediated authentication flow
- `host_permissions` for the backend API domain

The implementation should prefer least privilege and avoid unnecessary broad permissions.

### 11.4 Authentication

The backend API authentication model shall use standards-based OAuth 2.0 or OpenID Connect with Authorization Code Flow and PKCE.

The implementation shall:

- register the extension as a public client
- use a redirect URI generated by Chrome Identity API support, such as `chrome.identity.getRedirectURL()`, and register the exact redirect URI with the authorization server
- send access tokens to the API using the `Authorization: Bearer` header over HTTPS
- avoid embedded client secrets, static shared API keys, and extension-managed password collection
- use Keycloak as the default first-release OpenID Connect provider, with separate realms and public client registrations for `local`, `non-production`, and `production`
- use short-lived access tokens, with rotating refresh tokens enabled for `non-production` and `production` and full re-authentication required whenever refresh is unavailable, revoked, expired, or otherwise fails

### 11.5 Local Installation and Development

The extension should be installable locally in Chrome as an unpacked extension during development.

### 11.6 Configuration

The implementation should support environment-specific API targets, at minimum:

- local mock endpoint
- non-production backend endpoint
- production backend endpoint

The implementation should also support environment-specific authentication configuration, including:

- authorization server issuer or base URL
- client identifier
- scopes or audience
- registered redirect URI

The implementation should also support the following payload configuration:

- `extendedFields`, default `false`, which controls whether the full extended metadata block is included in the payload contract

Configuration handling requirements:

- Environment integration settings shall be defined in a versioned configuration map bundled with the extension for `local`, `non-production`, and `production`.
- The extension shall persist only the selected environment key in `chrome.storage.local` and derive API and authentication settings from that selected profile through a configuration boundary.
- Manual endpoint or issuer overrides shall be limited to the `local` profile for developer use.
- The `extendedFields` setting shall be persisted in `chrome.storage.local`.
- The setting shall be managed through a minimal Chrome extension options page rather than a rich settings UI.
- If the setting is missing from storage, the implementation shall default it to `false`.
- The background service worker shall read the effective setting through a configuration boundary rather than embedding the value directly in capture logic.

This shall be achieved through the bundled configuration map and a minimal extension options mechanism for selecting the active environment.

### 11.7 Testability

The implementation shall keep Chrome-specific APIs behind thin integration boundaries so that the core extension behaviour can be unit tested without requiring a live Chrome browser session.

Unit-testable behaviour shall include at minimum:

- capture flow orchestration
- payload construction for full and partial capture outcomes
- authentication decision logic, including missing-token and expired-token handling
- submission error handling and retry decisions where implemented

### 11.8 Payload Encoding

The implementation shall encode captured page content so that it can be transmitted safely in a JSON request body without changing the semantic content of the captured page source.

Encoding requirements:

- HTML shall be represented as a JSON string value produced by a standards-compliant serializer.
- JavaScript that appears inside captured HTML, for example within `<script>` elements, shall remain part of the captured HTML string and shall not be executed or separately interpreted by the extension during serialisation.
- Special characters, quotation marks, backslashes, newlines, and Unicode characters shall be escaped by the JSON serializer as required for valid JSON.
- The request body shall be encoded for transport as UTF-8.
- Serialisation failures shall be treated as explicit errors and handled through the normal submission error path.
- Transport-level compression may be used to reduce payload size, but it shall not change the logical payload contract or replace full HTML with a derived text representation.

### 11.10 Oversized Payload Handling

The implementation shall define a maximum allowed HTML payload size for supported-page capture.

Oversized payload handling requirements:

- The implementation shall measure the captured HTML size before submission using a deterministic rule, for example UTF-8 byte length.
- The default first-release maximum HTML payload size shall be `1 MiB` (`1,048,576` bytes), measured as the UTF-8 byte length of the captured `html` string before submission.
- If the captured HTML exceeds the configured maximum size, the extension shall not silently trim the HTML string.
- If the captured HTML exceeds the configured maximum size, the extension shall not replace the `html` field with extracted text, reader-mode output, or other derived content while still treating the result as a normal full capture.
- Oversized capture shall be handled through an explicit failure or partial-capture path with a documented failure reason, for example `payload_too_large`.
- Any maximum-size threshold shall be reflected consistently in the PRD, schema, mock behaviour, and automated tests.

### 11.9 Contract Testing

Contract testing shall be mandatory for the integration between the extension and the backend API.

The implementation shall:

- maintain a shared, versioned JSON Schema for the payload contract
- validate extension-emitted payloads against that schema in automated tests
- validate backend request handling against the same schema in automated tests
- fail CI when the schema, the extension payload implementation, or the backend request handling drift apart
- keep schema examples for both full and partial payload outcomes under automated validation

## 12. Mocking and Local Test Requirements

A local mock server is required so developers can test the extension without depending on the real backend.

The mock capability must support:

- receiving JSON POST requests from the extension
- inspecting the exact payload sent
- validating authenticated and unauthenticated request handling
- returning deterministic success and failure responses
- supporting rapid iteration during extension development
- validating that payload structure matches the agreed contract and shared JSON Schema
- simulating authentication success, token expiry, missing token, and insufficient-scope responses

## 12.1 Mocking Use Cases

- verify that clicking the icon sends the correct payload
- verify that using the keyboard shortcut sends the same payload structure
- verify full HTML capture on supported pages
- verify partial payloads when HTML capture is blocked
- verify that the extension can complete browser-mediated sign-in and send authenticated requests
- verify handling of 200, 400, 401, 500 and timeout scenarios
- verify handling of 403 responses caused by missing or insufficient scope
- inspect headers and request body during development

HTML capture should be treated as blocked, and therefore should trigger partial-payload behaviour, in at least the following cases:

- the active tab is a browser-internal or protected page where script injection is disallowed
- the active tab uses an unsupported or non-matchable top-level URL scheme for standard injection
- the active tab is a local `file://` page and the extension has not been granted file URL access
- the extension lacks the required host permission or does not currently hold a valid `activeTab` grant for the page
- the active tab is displaying a non-HTML viewer or document surface rather than a normal HTML document
- the tab becomes unavailable during capture because it navigates, reloads, closes, or crashes before injection completes

## 12.2 Contract Testing Requirement

Contract testing is mandatory between the extension and backend API.

The required first-release approach is schema-based contract testing using a shared, versioned JSON Schema that is validated by both the extension and the backend in automated test suites and CI.

Required principles:

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
- API requests must use OAuth 2.0 bearer access tokens obtained through Authorization Code Flow with PKCE.
- The extension must be treated as a public client and must not rely on embedded client secrets or long-lived shared API keys.
- The authentication flow must use a browser-mediated experience rather than collecting credentials directly inside the extension.
- Captured page content must be treated as untrusted input and serialised as data, not executed or interpreted during payload construction.
- Care must be taken if HTML content is transmitted, because page HTML may include sensitive information.

### 13.4 Privacy

The product must recognise that HTML capture is materially more sensitive than URL-only capture. The implementation should capture only the agreed contract fields, handle blocked capture explicitly, and control payload size and downstream use of HTML content.

### 13.5 Maintainability

The implementation should keep the capture flow simple, modular and testable, with shared logic across all trigger paths. Core logic should be unit-testable in isolation from Chrome APIs and network calls.

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

The first release should provide lightweight feedback through the Chrome action rather than through a rich popup or routine system notifications.

Recommended first-release behaviour:

- show a transient per-tab action badge after each capture attempt
- use short badge text such as `OK`, `PART`, or `ERR`
- update the action tooltip with a plain-language status message
- clear the temporary status automatically after a short interval
- use badge background colour only as a supplementary cue, not as the sole indicator of meaning

The implementation should avoid blinking or animated icon changes as the main status signal.

### 14.3 Low Friction

The user should not need to manually copy URLs or navigate away from the current page in order to capture it.

### 14.4 Configuration UX

The extension may expose a minimal Chrome options page for required configuration, including the `extendedFields` toggle and environment-specific integration settings.

The configuration UX should:

- remain lightweight and focused on required settings only
- clearly show that `extendedFields` is disabled by default
- explain that enabling `extendedFields` increases the amount of metadata sent to the backend API

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
- the first release should treat oversized HTML as an explicit contract or submission constraint rather than silently trimming content or substituting extracted text

## 17. Risks and Mitigations

### Risk 1. Payload Contract Drift

The extension and backend may diverge in their understanding of the payload.

Mitigation:

- define a formal schema
- enforce contract testing and schema validation in CI
- version the payload if needed

### Risk 2. Over-Capture of Sensitive Content

Capturing HTML may transmit more information than intended.

Mitigation:

- constrain the payload to the agreed fields and schema version
- define and validate partial payload behaviour for blocked capture
- define and validate explicit oversized-payload behaviour rather than silently mutating captured HTML
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
- clicking the extension icon sends an authenticated request containing URL, title, HTML, trigger, captured timestamp, and schema version for supported HTML pages
- using the keyboard shortcut sends the same authenticated full payload on supported HTML pages
- when HTML capture is blocked, the extension sends an authenticated partial payload with capture status and failure reason
- the extension can obtain a valid access token through a browser-mediated OAuth flow without asking the user to enter credentials into extension UI
- the local mock server can receive and display both full and partial payloads and inspect the authentication header for inspection
- the core extension logic can be verified through automated unit tests without depending on a live Chrome browser session
- captured HTML can be transmitted in a valid JSON request body without executing or corrupting embedded markup or script content
- the user can enable or disable `extendedFields` through a minimal Chrome options page, with the setting persisted locally and defaulting to `false`
- the user receives lightweight capture feedback through a transient action badge and tooltip, without relying on colour alone
- the payload shape is documented and validated
- mandatory schema-based contract testing runs in CI and prevents consumer/provider schema drift
- oversized HTML capture is handled explicitly, without silently trimming source HTML or replacing it with extracted text

## 19. Acceptance Criteria

### AC1

When the extension is installed and the user clicks the extension icon on a supported HTML page, the extension sends an authenticated JSON POST request containing `url`, `title`, `html`, `trigger`, `capturedAt`, and `schemaVersion` to the configured endpoint.

### AC2

When the extension is installed and the user uses the keyboard shortcut on a supported HTML page, the extension sends an authenticated JSON POST request using the same capture flow and schema.

### AC3

When HTML capture is blocked, the extension sends an authenticated partial JSON POST request containing `url`, `title` if available, `trigger`, `capturedAt`, `schemaVersion`, `captureStatus`, and `failureReason`.

### AC4

When no valid access token is available, the extension initiates a browser-mediated OAuth 2.0 Authorization Code Flow with PKCE, obtains a bearer access token, and does not ask the user to enter credentials directly into extension UI.

### AC5

The extension uses the `Authorization: Bearer` header for API requests and does not include an embedded client secret or long-lived shared API key in the distributed extension package.

### AC6

When the `extendedFields` configuration option is `false`, the payload omits the extended metadata block. When `extendedFields` is `true`, the payload includes canonical URL, language, meta description, site name, author, published date, HTML byte length, HTML hash, and extension version, using `null` for any field that cannot be derived reliably.

### AC7

The extension provides a minimal Chrome options page where the user can view and change the `extendedFields` setting, with the value persisted in `chrome.storage.local` and defaulting to `false` when unset.

### AC8

The extension can be configured to target a local mock endpoint for development.

### AC9

The local mock endpoint can be used to inspect the request body and authentication header and simulate success and failure responses.

### AC10

A documented, versioned JSON Schema exists for the payload, and automated contract tests validate both extension-emitted payloads and backend request handling against the same schema in CI.

### AC11

The extension code is structured so that automated unit tests can verify core capture orchestration, payload construction, authentication decision logic, and submission error handling without requiring a live Chrome browser session.

### AC12

When the extension captures HTML containing quotation marks, line breaks, Unicode characters, or embedded `<script>` content, it serialises that content into a valid JSON request body using standard JSON encoding without executing or mutating the captured page source.

### AC13

After each capture attempt, the extension shows a transient per-tab action badge with brief status text and updates the action tooltip with a matching plain-language message. Any colour used in the badge is supplementary and not the sole indicator of outcome.

### AC14

When the captured HTML exceeds the configured maximum payload size, the extension does not silently trim the HTML or replace it with extracted text. It produces an explicit failure or partial-capture outcome with a documented failure reason such as `payload_too_large`.

## 20. Delivery Approach

A sensible phased delivery approach is:

### Phase 1. Minimal Capture

- create Chrome extension skeleton
- structure Chrome API integration behind thin adapters so core capture logic is unit-testable
- add a minimal Chrome options page for required extension configuration
- implement icon click trigger
- capture active tab URL, title, and HTML on supported pages
- send a partial payload with capture status and failure reason when HTML capture is blocked
- POST to local mock endpoint

### Phase 2. Authenticated Submission

- implement browser-mediated OAuth 2.0 Authorization Code Flow with PKCE
- obtain bearer access tokens and attach them to API requests
- simulate authentication success, 401, and 403 responses in the mock environment

### Phase 3. Unified Trigger Support

- add keyboard shortcut
- route both triggers through shared capture logic
- include trigger source, timestamp, and schema version in all payloads

### Phase 4. Extended Metadata and Hardening

- add the `extendedFields` configuration option, defaulting to `false`, stored in `chrome.storage.local`
- populate the full extended metadata block when `extendedFields` is enabled
- include `null` for extended metadata fields that cannot be derived reliably
- validate JSON serialisation of captured HTML, including embedded script markup and special characters
- implement transient action badge and tooltip feedback for `OK`, `PART`, and `ERR` outcomes
- define and validate maximum HTML payload size handling, including explicit oversized-payload failure behaviour
- improve feedback and error handling

### Phase 5. Contract Confidence

- formalise payload schema
- add automated unit tests for core extension behaviour and failure paths
- add automated payload validation against the shared JSON Schema
- implement mandatory schema-based contract testing between extension and backend

## 21. Resolved First-Release Defaults

- The default maximum HTML payload size is `1 MiB` (`1,048,576` bytes), measured as the UTF-8 byte length of the captured `html` string before submission. Oversized captures shall return an explicit outcome such as `payload_too_large`.
- `publishedDate` and `author` shall be derived only from fixed machine-readable signals in a documented precedence order. The first release shall prefer returning `null` over scraping arbitrary page text or layout-specific selectors.
- Environment-specific endpoint configuration shall be managed through a versioned configuration map bundled with the extension for `local`, `non-production`, and `production`, with only the selected environment key stored in `chrome.storage.local`.
- The default identity provider is Keycloak, with separate realms and public client registrations for `local`, `non-production`, and `production`.
- The authorization server shall issue rotating refresh tokens for `non-production` and `production`. The extension shall require full re-authentication when refresh is unavailable or fails. Local mock flows may omit refresh tokens.
- `htmlHash` shall use SHA-256 over the UTF-8 bytes of the captured HTML and be formatted as `sha256:<lowercase-hex-digest>`.
- Visible user feedback is required in the first release. The extension shall provide transient per-tab action badge and tooltip feedback, with no richer routine UI than that required by the existing UX requirements.

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
- Run mandatory contract testing

## 24. Appendix C: Summary Statement

This PRD defines a focused Chrome extension component within a wider professional link-capture service. The extension is responsible for user-triggered capture of page information and transmission of an agreed payload to a backend API. Backend processing is explicitly out of scope. Local mocking and contract testing are important delivery considerations to ensure payload quality, confidence in integration, and a stable boundary between this project and the downstream processing project.
