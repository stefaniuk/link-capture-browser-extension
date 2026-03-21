import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("manifest.json", () => {
  const manifestPath = resolve(import.meta.dirname, "../../src/extension/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  it("has manifest_version 3", () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it("has a name", () => {
    expect(manifest.name).toBe("Link Capture");
  });

  it("has a version", () => {
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("has activeTab and tabs permissions", () => {
    expect(manifest.permissions).toContain("activeTab");
    expect(manifest.permissions).toContain("tabs");
  });

  it("has a service worker background", () => {
    expect(manifest.background).toEqual({
      service_worker: "background.js",
      type: "module",
    });
  });

  it("has an action with default title", () => {
    expect(manifest.action.default_title).toBe("Capture Link");
  });

  it("has capture-link command with keyboard shortcuts", () => {
    expect(manifest.commands["capture-link"]).toEqual({
      suggested_key: {
        default: "Ctrl+Shift+L",
        mac: "Command+Shift+L",
      },
      description: "Capture current page link",
    });
  });
});
