# Contributing

Thank you for considering a contribution to the Link Capture Browser Extension. This guide explains how to set up a development environment, run quality checks, and propose changes.

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or later
- [pnpm](https://pnpm.io/) package manager
- [GNU make](https://www.gnu.org/software/make/) 3.82 or later
- [Google Chrome](https://www.google.com/chrome/) for manual testing

## Getting started

Clone the repository and install dependencies:

```shell
git clone https://github.com/stefaniuk/link-capture-browser-extension.git
cd link-capture-browser-extension
make deps
```

## Development workflow

### Build the extension

```shell
make build
```

The compiled extension is output to `dist/extension/`. Load it in Chrome via `chrome://extensions/` → **Load unpacked**.

### Start the mock server

```shell
make mock-server
```

The server listens on `http://localhost:3000` and exposes `POST /captures` and `GET /captures`.

### Run quality checks

Before submitting any change, ensure all quality gates pass:

```shell
make lint
make test
```

The full set of available commands:

| Command          | Purpose                                             |
| ---------------- | --------------------------------------------------- |
| `make format`    | Auto-format code with Biome                         |
| `make lint`      | Run all linters (file, markdown, shell, TypeScript) |
| `make typecheck` | Run TypeScript type checking                        |
| `make test`      | Run all tests (unit, integration, contract)         |
| `make build`     | Build the extension into `dist/`                    |
| `make clean`     | Remove the `dist/` directory                        |

### Test-driven development

This project follows strict TDD. For any behavioural change:

1. Write a failing test first (Red).
2. Implement the minimal code to make it pass (Green).
3. Refactor while keeping tests green (Refactor).

Tests use [Vitest](https://vitest.dev/) with [fast-check](https://github.com/dubzzz/fast-check) for property-based testing.

## Proposing changes

1. Open an issue describing the change and its motivation.
2. Create a branch from `main` (or the current feature branch).
3. Make your changes, ensuring `make lint` and `make test` pass with zero errors and zero warnings.
4. Raise a pull request against the default branch.
5. Await review — at least one approval is expected before merging.

## Code style

- TypeScript with `strict: true`.
- Formatting and linting handled by [Biome](https://biomejs.dev/).
- British English in documentation and comments.

## Architecture decisions

Significant technical decisions are documented as Architecture Decision Records (ADRs) in [docs/adr](../docs/adr). Consult the [Tech Radar](../docs/adr/Tech_Radar.md) for mandated tooling choices.
