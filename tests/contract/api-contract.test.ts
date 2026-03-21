import http from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../../src/mock-server/server.js";
import { createCaptureStore } from "../../src/mock-server/store.js";

function request(
  baseUrl: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload === undefined ? {} : { "Content-Length": Buffer.byteLength(payload) }),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            parsed = text;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      },
    );
    req.on("error", reject);
    if (payload !== undefined) {
      req.write(payload);
    }
    req.end();
  });
}

describe("API contract: POST /captures", () => {
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

  it("returns 201 for valid { url, timestamp } payload", async () => {
    const result = await request(baseUrl, "POST", "/captures", {
      url: "https://example.com",
      timestamp: "2026-03-21T14:30:00.000Z",
    });
    expect(result.status).toBe(201);
  });

  it("returns 400 when url is missing", async () => {
    const result = await request(baseUrl, "POST", "/captures", {
      timestamp: "2026-03-21T14:30:00.000Z",
    });
    expect(result.status).toBe(400);
  });

  it("returns 400 when timestamp is missing", async () => {
    const result = await request(baseUrl, "POST", "/captures", {
      url: "https://example.com",
    });
    expect(result.status).toBe(400);
  });

  it("returns 400 for empty body", async () => {
    const result = await request(baseUrl, "POST", "/captures", {});
    expect(result.status).toBe(400);
  });

  it("returns 400 for non-URL string in url field", async () => {
    const result = await request(baseUrl, "POST", "/captures", {
      url: "not a url",
      timestamp: "2026-03-21T14:30:00.000Z",
    });
    expect(result.status).toBe(400);
  });

  it("returns 400 for non-ISO 8601 string in timestamp field", async () => {
    const result = await request(baseUrl, "POST", "/captures", {
      url: "https://example.com",
      timestamp: "21 March 2026",
    });
    expect(result.status).toBe(400);
  });

  it("GET /captures returns JSON array", async () => {
    await request(baseUrl, "POST", "/captures", {
      url: "https://example.com",
      timestamp: "2026-03-21T14:30:00.000Z",
    });
    const result = await request(baseUrl, "GET", "/captures");
    expect(result.status).toBe(200);
    expect(Array.isArray(result.body)).toBe(true);
  });
});
