include scripts/init.mk

# ==============================================================================
# Project targets

env: # Set up project environment @Configuration
	# TODO: Implement environment setup steps

deps: # Install dependencies needed to build and test the project @Build
	pnpm install --frozen-lockfile

format: # Auto-format code @Quality
	pnpm run format

lint-file-format: # Check file formats @Quality
	$(MAKE) check-file-format check=branch

lint-markdown-format: # Check markdown formatting @Quality
	$(MAKE) check-markdown-format check=branch

lint-markdown-links: # Check markdown links @Quality
	$(MAKE) check-markdown-links check=branch

lint-shell: # Check shell scripts @Quality
	$(MAKE) check-shell-lint

lint-ts: # Check TypeScript code style and errors @Quality
	pnpm run lint

lint: # Run linter to check code style and errors @Quality
	$(MAKE) lint-file-format
	$(MAKE) lint-markdown-format
	$(MAKE) lint-markdown-links
	$(MAKE) lint-shell
	$(MAKE) lint-ts

typecheck: # Run type checker @Quality
	pnpm run typecheck

test: # Run all tests @Quality
	pnpm run test

build: # Build the project artefact @Build
	pnpm run build
	cp src/extension/manifest.json dist/extension/

mock-server: # Start the mock API server @Operations
	pnpm run mock-server

publish: # Publish the project artefact @Release
	# TODO: Implement the artefact publishing step

deploy: # Deploy the project artefact to the target environment @Release
	# TODO: Implement the artefact deployment step

clean:: # Clean-up project resources (main) @Operations
	rm -rf dist

config:: # Configure development environment (main) @Configuration
	$(MAKE) _install-dependencies

# ==============================================================================

${VERBOSE}.SILENT: \
	build \
	clean \
	config \
	deploy \
	deps \
	env \
	format \
	lint \
	lint-file-format \
	lint-markdown-format \
	lint-markdown-links \
	lint-shell \
	lint-ts \
	mock-server \
	publish \
	test \
	typecheck \
