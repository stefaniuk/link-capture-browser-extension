import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";
import type { BadgeApi } from "../../src/extension/background.js";
import { buildCapturePayload, sendCapture, showBadge } from "../../src/extension/background.js";

describe("buildCapturePayload", () => {
  it("builds a payload with the given URL and date", () => {
    const date = new Date("2026-03-21T14:30:00.000Z");
    const payload = buildCapturePayload("https://example.com", date);
    expect(payload).toEqual({
      url: "https://example.com",
      timestamp: "2026-03-21T14:30:00.000Z",
    });
  });

  it("produces a deterministic ISO 8601 timestamp", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const payload = buildCapturePayload("https://test.com", date);
    expect(payload.timestamp).toBe("2026-01-01T00:00:00.000Z");
  });

  it("preserves the exact URL string", () => {
    const url = "https://example.com/path?query=1&foo=bar#hash";
    const payload = buildCapturePayload(url, new Date());
    expect(payload.url).toBe(url);
  });
});

describe("sendCapture", () => {
  it("sends a POST request with correct method, headers, and body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const payload = {
      url: "https://example.com",
      timestamp: "2026-03-21T14:30:00.000Z",
    };
    await sendCapture(payload, "http://localhost:3000/captures", mockFetch);

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000/captures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  it("returns true on 2xx response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    const payload = {
      url: "https://example.com",
      timestamp: "2026-03-21T14:30:00.000Z",
    };
    const result = await sendCapture(payload, "http://localhost:3000/captures", mockFetch);
    expect(result).toBe(true);
  });

  it("returns false on non-2xx response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false });
    const payload = {
      url: "https://example.com",
      timestamp: "2026-03-21T14:30:00.000Z",
    };
    const result = await sendCapture(payload, "http://localhost:3000/captures", mockFetch);
    expect(result).toBe(false);
  });

  it("returns false on network error", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const payload = {
      url: "https://example.com",
      timestamp: "2026-03-21T14:30:00.000Z",
    };
    const result = await sendCapture(payload, "http://localhost:3000/captures", mockFetch);
    expect(result).toBe(false);
  });
});

describe("showBadge", () => {
  let mockBadgeApi: BadgeApi & {
    setBadgeText: MockInstance;
    setBadgeBackgroundColor: MockInstance;
  };
  let mockSetTimeout: MockInstance;

  beforeEach(() => {
    vi.useFakeTimers();
    mockBadgeApi = {
      setBadgeText: vi.fn().mockResolvedValue(undefined),
      setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
    };
    mockSetTimeout = vi.fn().mockImplementation((fn: () => void, ms: number) => {
      return setTimeout(fn, ms);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets green tick badge on success", () => {
    showBadge(true, mockBadgeApi, mockSetTimeout);
    expect(mockBadgeApi.setBadgeText).toHaveBeenCalledWith({ text: "\u2713" });
    expect(mockBadgeApi.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#22c55e",
    });
  });

  it("sets red cross badge on failure", () => {
    showBadge(false, mockBadgeApi, mockSetTimeout);
    expect(mockBadgeApi.setBadgeText).toHaveBeenCalledWith({ text: "\u2717" });
    expect(mockBadgeApi.setBadgeBackgroundColor).toHaveBeenCalledWith({
      color: "#ef4444",
    });
  });

  it("clears the badge after 2 seconds", () => {
    showBadge(true, mockBadgeApi, mockSetTimeout);
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

    vi.advanceTimersByTime(2000);
    expect(mockBadgeApi.setBadgeText).toHaveBeenCalledWith({ text: "" });
  });
});
