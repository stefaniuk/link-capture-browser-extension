import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { isCapturePayload, isValidIso8601, isValidUrl } from "../../src/extension/types.js";

describe("CapturePayload type validation", () => {
  it("accepts a valid payload", () => {
    const payload = {
      url: "https://example.com",
      timestamp: new Date().toISOString(),
    };
    expect(isCapturePayload(payload)).toBe(true);
  });

  it("rejects null", () => {
    expect(isCapturePayload(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isCapturePayload(undefined)).toBe(false);
  });

  it("rejects a number", () => {
    expect(isCapturePayload(42)).toBe(false);
  });

  it("rejects an object missing url", () => {
    expect(isCapturePayload({ timestamp: "2026-01-01T00:00:00.000Z" })).toBe(false);
  });

  it("rejects an object missing timestamp", () => {
    expect(isCapturePayload({ url: "https://example.com" })).toBe(false);
  });

  it("rejects an object with non-string url", () => {
    expect(isCapturePayload({ url: 123, timestamp: "2026-01-01T00:00:00.000Z" })).toBe(false);
  });

  it("rejects an object with non-string timestamp", () => {
    expect(isCapturePayload({ url: "https://example.com", timestamp: 123 })).toBe(false);
  });

  it("accepts any object with string url and string timestamp (PBT)", () => {
    fc.assert(
      fc.property(fc.webUrl(), fc.date(), (url, date) => {
        const payload = { url, timestamp: date.toISOString() };
        expect(isCapturePayload(payload)).toBe(true);
      }),
    );
  });
});

describe("isValidUrl", () => {
  it("accepts valid URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000/captures")).toBe(true);
    expect(isValidUrl("https://example.com/path?query=1#hash")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("accepts arbitrary valid URLs (PBT)", () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        expect(isValidUrl(url)).toBe(true);
      }),
    );
  });
});

describe("isValidIso8601", () => {
  it("accepts valid ISO 8601 timestamps", () => {
    expect(isValidIso8601("2026-03-21T14:30:00.000Z")).toBe(true);
  });

  it("rejects invalid timestamps", () => {
    expect(isValidIso8601("")).toBe(false);
    expect(isValidIso8601("not-a-date")).toBe(false);
    expect(isValidIso8601("2026-03-21")).toBe(false);
  });

  it("round-trips through Date.toISOString (PBT)", () => {
    fc.assert(
      fc.property(fc.date({ noInvalidDate: true }), (date) => {
        const iso = date.toISOString();
        expect(isValidIso8601(iso)).toBe(true);
      }),
    );
  });
});
