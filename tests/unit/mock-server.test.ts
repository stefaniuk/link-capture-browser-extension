import http from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../../src/mock-server/server.js";
import { createCaptureStore } from "../../src/mock-server/store.js";

function request(
  server: http.Server,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    if (!addr || typeof addr === "string") {
      reject(new Error("Server not listening"));
      return;
    }
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: addr.port,
        path,
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

describe("Mock server", () => {
  let server: http.Server;
  let store: ReturnType<typeof createCaptureStore>;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        store = createCaptureStore();
        server = createServer(store);
        server.listen(0, () => resolve());
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

  describe("POST /captures", () => {
    it("returns 201 for a valid payload", async () => {
      const result = await request(server, "POST", "/captures", {
        url: "https://example.com",
        timestamp: "2026-03-21T14:30:00.000Z",
      });
      expect(result.status).toBe(201);
      expect(result.body).toEqual({ status: "created" });
    });

    it("stores the capture", async () => {
      const payload = {
        url: "https://example.com/page",
        timestamp: "2026-03-21T14:30:00.000Z",
      };
      await request(server, "POST", "/captures", payload);
      expect(store.getAll()).toEqual([payload]);
    });

    it("returns 400 for invalid JSON", async () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("Server not listening");
      const result = await new Promise<{ status: number; body: unknown }>((resolve, reject) => {
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port: addr.port,
            path: "/captures",
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
              resolve({
                status: res.statusCode ?? 0,
                body: JSON.parse(Buffer.concat(chunks).toString()),
              });
            });
          },
        );
        req.on("error", reject);
        req.write("not json");
        req.end();
      });
      expect(result.status).toBe(400);
    });

    it("returns 400 for missing url field", async () => {
      const result = await request(server, "POST", "/captures", {
        timestamp: "2026-03-21T14:30:00.000Z",
      });
      expect(result.status).toBe(400);
    });

    it("returns 400 for missing timestamp field", async () => {
      const result = await request(server, "POST", "/captures", {
        url: "https://example.com",
      });
      expect(result.status).toBe(400);
    });

    it("returns 400 for invalid url", async () => {
      const result = await request(server, "POST", "/captures", {
        url: "not-a-url",
        timestamp: "2026-03-21T14:30:00.000Z",
      });
      expect(result.status).toBe(400);
    });

    it("returns 400 for invalid timestamp", async () => {
      const result = await request(server, "POST", "/captures", {
        url: "https://example.com",
        timestamp: "not-a-date",
      });
      expect(result.status).toBe(400);
    });
  });

  describe("GET /captures", () => {
    it("returns empty array initially", async () => {
      const result = await request(server, "GET", "/captures");
      expect(result.status).toBe(200);
      expect(result.body).toEqual([]);
    });

    it("returns all stored captures", async () => {
      const payload1 = {
        url: "https://example.com/1",
        timestamp: "2026-03-21T14:30:00.000Z",
      };
      const payload2 = {
        url: "https://example.com/2",
        timestamp: "2026-03-21T14:31:00.000Z",
      };
      await request(server, "POST", "/captures", payload1);
      await request(server, "POST", "/captures", payload2);
      const result = await request(server, "GET", "/captures");
      expect(result.status).toBe(200);
      expect(result.body).toEqual([payload1, payload2]);
    });
  });

  describe("Unknown routes", () => {
    it("returns 404 for unknown paths", async () => {
      const result = await request(server, "GET", "/unknown");
      expect(result.status).toBe(404);
    });
  });
});
