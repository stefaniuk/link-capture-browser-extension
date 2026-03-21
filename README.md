# Link Capture Browser Extension

A Chrome extension that captures the current tab URL and timestamp on demand, sending the data to a configurable REST API endpoint.

## Why this project exists

**Purpose**

Link Capture provides a lightweight, single-action mechanism for saving URLs encountered while browsing. It records the page URL and the exact time of capture, then forwards the data to any conforming REST API endpoint.

**Benefit to the user**

Users get a fast, distraction-free way to capture links without switching context. A single click or keyboard shortcut is all it takes — no forms, no local storage, no heavy UI. The captured data flows to whichever backend the user chooses, keeping the client minimal and the storage layer interchangeable.

**Problem it solves**

Existing bookmarking tools are either too feature-heavy or tightly coupled to a specific storage backend. Users who simply want to record "I was on this page at this time" and send that fact to their own system have no lightweight option in the Chrome extension ecosystem.

**How it solves it (high level)**

The extension runs as a Chrome Manifest V3 service worker. When triggered, it reads the active tab URL, pairs it with an ISO 8601 UTC timestamp, and POSTs the JSON payload to a configurable endpoint. Brief badge feedback (green tick or red cross) confirms success or failure. A companion mock API server is included for local development and testing.

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- [pnpm](https://pnpm.io/) package manager
- [GNU make](https://www.gnu.org/software/make/) 3.82 or later
- [Google Chrome](https://www.google.com/chrome/) for loading the unpacked extension

> [!NOTE]<br>
> The version of GNU make available by default on macOS is earlier than 3.82. Install a newer version with [Homebrew](https://brew.sh/):
>
> ```shell
> brew install make
> ```

### Set up

Clone the repository and install dependencies:

```shell
git clone https://github.com/stefaniuk/link-capture-browser-extension.git
cd link-capture-browser-extension
make deps
```

### First run

Build the extension and start the mock server:

```shell
make build
make mock-server
```

Then load the extension in Chrome:

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/extension/` directory.
4. Navigate to any web page, click the extension icon (or press `Ctrl+Shift+L` / `Cmd+Shift+L` on macOS).

Expected result: the icon badge briefly shows a green tick, and the mock server logs the captured URL and timestamp to the console.

## What it does

**Key features**

- Captures the current tab URL and ISO 8601 UTC timestamp with a single action.
- Supports two trigger methods: toolbar icon click and keyboard shortcut (`Ctrl+Shift+L` / `Cmd+Shift+L`).
- Sends each capture as a JSON POST request to a configurable REST endpoint.
- Displays brief badge feedback — green tick on success, red cross on failure — clearing after 2 seconds.
- Includes a mock API server for local development (`POST /captures`, `GET /captures`).

**Out of scope / non-goals**

- Backend API implementation (the mock server is for development only).
- Browser support beyond Chrome.
- Page content extraction (title, metadata, body text).
- User authentication or authorisation.
- Offline queuing or retry logic.

## How it solves the problem

1. The user triggers a capture via toolbar click or keyboard shortcut.
2. The service worker reads the active tab URL and generates an ISO 8601 timestamp.
3. A JSON payload `{ url, timestamp }` is POSTed to the configured endpoint.
4. The API responds with a status code; the extension shows badge feedback accordingly.
5. The badge clears automatically after 2 seconds.

## How to use

### Configuration

The extension sends captures to a configurable REST endpoint. The default endpoint is `http://localhost:3000/captures`, which works with the included mock server.

To change the endpoint, edit the default in [src/extension/config.ts](src/extension/config.ts).

### Common workflows

Build the extension:

```shell
make build
```

Start the mock API server (listens on port 3000):

```shell
make mock-server
```

Load the built extension in Chrome:

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `dist/extension/`.

Capture a link by clicking the toolbar icon or pressing `Ctrl+Shift+L` (`Cmd+Shift+L` on macOS).

Retrieve all captured links from the mock server:

```shell
curl http://localhost:3000/captures
```

### Mock server API

| Method | Path        | Description                            | Response |
| ------ | ----------- | -------------------------------------- | -------- |
| POST   | `/captures` | Accepts `{ url, timestamp }` JSON body | `201`    |
| GET    | `/captures` | Returns all stored captures as JSON    | `200`    |

## Contributing

See the contributing guide at [contributing.md](.github/contributing.md).

### Development setup

Install dependencies:

```shell
make deps
```

### Quality commands

| Command          | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `make format`    | Auto-format code with Biome                         |
| `make lint`      | Run all linters (file, markdown, shell, TypeScript) |
| `make typecheck` | Run TypeScript type checking                        |
| `make test`      | Run all tests (unit, integration, contract)         |
| `make build`     | Build the extension into `dist/`                    |
| `make clean`     | Remove the `dist/` directory                        |

### Proposing changes

Open an issue to discuss the change, then raise a pull request. Ensure `make lint` and `make test` pass before submitting.

## Repository layout

- [src/extension](src/extension) — Chrome extension source (service worker, types, config, manifest).
- [src/mock-server](src/mock-server) — Mock API server for local development.
- [tests/unit](tests/unit) — Unit tests.
- [tests/integration](tests/integration) — Integration tests.
- [tests/contract](tests/contract) — API contract tests.
- [docs/prd.md](docs/prd.md) — Product requirements document.
- [docs/plan.md](docs/plan.md) — Implementation plan.
- [docs/adr](docs/adr) — Architecture decision records.
- [docs/guides](docs/guides) — Developer guides (Git hooks, secrets scanning, etc.).
- [scripts](scripts) — Build tooling, quality checks, and configuration.
- [Makefile](Makefile) — Primary entry point for all build and quality tasks.

## Licence

Released under the [MIT Licence](LICENCE.md).
