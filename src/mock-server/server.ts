import http from "node:http";
import { isCapturePayload, isValidIso8601, isValidUrl } from "../extension/types.js";
import type { CaptureStore } from "./store.js";
import { createCaptureStore } from "./store.js";

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function setCorsHeaders(res: http.ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res: http.ServerResponse, statusCode: number, body: unknown): void {
  setCorsHeaders(res);
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(json),
  });
  res.end(json);
}

export function createRequestHandler(store: CaptureStore) {
  return async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    const { method, url } = req;

    if (method === "OPTIONS") {
      setCorsHeaders(res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (url === "/captures" && method === "POST") {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        sendJson(res, 400, { error: "Invalid JSON" });
        return;
      }

      if (!isCapturePayload(parsed)) {
        sendJson(res, 400, {
          error: "Invalid payload: expected { url: string, timestamp: string }",
        });
        return;
      }

      if (!isValidUrl(parsed.url)) {
        sendJson(res, 400, { error: "Invalid URL" });
        return;
      }

      if (!isValidIso8601(parsed.timestamp)) {
        sendJson(res, 400, { error: "Invalid ISO 8601 timestamp" });
        return;
      }

      store.add(parsed);
      console.error(`[POST /captures] ${parsed.url} @ ${parsed.timestamp}`);
      sendJson(res, 201, { status: "created" });
      return;
    }

    if (url === "/captures" && method === "GET") {
      sendJson(res, 200, store.getAll());
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  };
}

export function createServer(store?: CaptureStore): http.Server {
  const captureStore = store ?? createCaptureStore();
  const handler = createRequestHandler(captureStore);

  const server = http.createServer((req, res) => {
    handler(req, res).catch(() => {
      sendJson(res, 500, { error: "Internal server error" });
    });
  });

  return server;
}

// Start server when run directly
const isMainModule = process.argv[1]?.endsWith("server.js");
if (isMainModule) {
  const PORT = 3000;
  const server = createServer();
  server.listen(PORT, () => {
    console.error(`Mock server listening on http://localhost:${PORT}`);
  });
}
