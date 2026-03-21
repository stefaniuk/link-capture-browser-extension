export interface CapturePayload {
  url: string;
  timestamp: string;
}

export function isCapturePayload(value: unknown): value is CapturePayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj.url === "string" && typeof obj.timestamp === "string";
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidIso8601(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !Number.isNaN(date.getTime()) && timestamp === date.toISOString();
}
