import type http from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildCapturePayload, sendCapture } from "../../src/extension/background.js";
import { createServer } from "../../src/mock-server/server.js";
import { createCaptureStore } from "../../src/mock-server/store.js";

describe("Capture flow integration", () => {
  let server: http.Server;
  let store: ReturnType<typeof createCaptureStore>;
  let baseUrl: string;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        store = createCaptureStore();
        server = createServer(store);
        server.listen(0, () => {
          const addr = server.address();
          if (addr && typeof addr !== "string") {
            baseUrl = `http://127.0.0.1:${addr.port}`;
          }
          resolve();
        });
      }),
  );

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  );

  beforeEach(() => {
    store.clear();
  });

  it("sends a capture to the mock server and retrieves it", async () => {
    const payload = buildCapturePayload(
      "https://example.com/integration",
      new Date("2026-03-21T14:30:00.000Z"),
    );

    const success = await sendCapture(payload, `${baseUrl}/captures`);
    expect(success).toBe(true);

    const response = await fetch(`${baseUrl}/captures`);
    const captures = await response.json();
    expect(captures).toEqual([payload]);
  });

  it("handles multiple captures in sequence", async () => {
    const payload1 = buildCapturePayload(
      "https://example.com/1",
      new Date("2026-03-21T14:30:00.000Z"),
    );
    const payload2 = buildCapturePayload(
      "https://example.com/2",
      new Date("2026-03-21T14:31:00.000Z"),
    );

    await sendCapture(payload1, `${baseUrl}/captures`);
    await sendCapture(payload2, `${baseUrl}/captures`);

    const response = await fetch(`${baseUrl}/captures`);
    const captures = await response.json();
    expect(captures).toEqual([payload1, payload2]);
  });

  it("returns false when server is unreachable", async () => {
    const payload = buildCapturePayload("https://example.com", new Date());
    const success = await sendCapture(payload, "http://127.0.0.1:1/captures");
    expect(success).toBe(false);
  });
});
