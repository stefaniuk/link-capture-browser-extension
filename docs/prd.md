# Product Requirements Document — Link Capture Browser Extension

## 1. Overview

A Chrome browser extension that captures the URL of the current web page on demand. The user triggers a capture either by clicking the extension toolbar button or pressing a keyboard shortcut. Each capture records the page URL (as displayed in the address bar) and the timestamp of the event, then sends this data to an external RESTful API endpoint.

## 2. Problem Statement

Users need a lightweight, on-demand way to save URLs they encounter while browsing. Existing bookmarking tools are either too heavy or tightly coupled to a specific storage backend. This extension provides a minimal capture mechanism that forwards data to any conforming API, keeping the client simple and the backend interchangeable.

## 3. Goals

- Provide a single-action capture of the current page URL and timestamp.
- Support two trigger methods: toolbar button click and configurable keyboard shortcut.
- Deliver captured data to a RESTful API endpoint.
- Keep the extension minimal — no local storage, no UI beyond the toolbar icon and brief visual feedback.

## 4. Non-Goals

- The backend API implementation is **out of scope**. A mock server is provided for development and testing only.
- Browser support beyond Chrome (e.g. Firefox, Safari) is out of scope for the initial release.
- Page content extraction (title, metadata, body text) is not included.
- User authentication or authorisation within the extension is not included.
- Offline queuing or retry logic is not included in the initial release.

## 5. User Stories

| ID   | Story                                                                                                          | Acceptance Criteria                                                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-1 | As a user, I want to click the extension icon so that the current page URL and timestamp are sent to the API.  | Clicking the toolbar icon sends a POST request containing `{ url, timestamp }` to the configured endpoint and displays brief visual confirmation. |
| US-2 | As a user, I want to press a keyboard shortcut so that the current page URL and timestamp are sent to the API. | Pressing the configured shortcut (default `Ctrl+Shift+L` / `Cmd+Shift+L`) triggers the same capture behaviour as US-1.                            |
| US-3 | As a user, I want visual feedback after a capture so that I know whether it succeeded or failed.               | The extension icon badge briefly shows a green tick on success or a red cross on failure, clearing after 2 seconds.                               |

## 6. Functional Requirements

### 6.1 Capture Trigger

- **Toolbar button**: Clicking the extension icon in the Chrome toolbar initiates a capture.
- **Keyboard shortcut**: A configurable Chrome command (default `Ctrl+Shift+L` / `Cmd+Shift+L` on macOS) initiates a capture.

### 6.2 Data Captured

Each capture event produces a payload with exactly two fields:

| Field       | Type     | Description                                                                    |
| ----------- | -------- | ------------------------------------------------------------------------------ |
| `url`       | `string` | The full URL from the active tab's address bar.                                |
| `timestamp` | `string` | ISO 8601 UTC timestamp of the capture event (e.g. `2026-03-21T14:30:00.000Z`). |

### 6.3 API Integration

- The extension sends each capture as an HTTP `POST` request to a configurable endpoint URL.
- Request content type: `application/json`.
- Request body example:

  ```json
  {
    "url": "https://example.com/page",
    "timestamp": "2026-03-21T14:30:00.000Z"
  }
  ```

- The endpoint URL defaults to `http://localhost:3000/captures` for local development with the mock server.

### 6.4 Visual Feedback

- On successful `2xx` response: the extension icon badge displays a green tick for 2 seconds.
- On failure (network error or non-`2xx` response): the extension icon badge displays a red cross for 2 seconds.

## 7. Mock API Server

A simple mock server is included in the repository for development and testing purposes. It:

- Listens on `http://localhost:3000`.
- Exposes `POST /captures` — accepts the JSON payload described in §6.3, logs it to the console, and returns `201 Created`.
- Exposes `GET /captures` — returns all previously received captures as a JSON array.
- Stores captures in memory only (no persistence).

## 8. Technical Constraints

- Chrome Extension Manifest V3.
- TypeScript for all extension and mock server source code.
- Tooling as defined in the project Tech Radar for the TypeScript stack (Node.js LTS, `pnpm`, `biome`, `vitest`, `fast-check`).

## 9. Success Metrics

- Capture-to-API latency under 500 ms on a standard broadband connection.
- Zero data loss when the API endpoint is reachable and returns `2xx`.

---

> **Version**: 1.0.0
> **Last Amended**: 2026-03-21
