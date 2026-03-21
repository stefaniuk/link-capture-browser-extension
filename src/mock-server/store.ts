import type { CapturePayload } from "../extension/types.js";

export interface CaptureStore {
  add(payload: CapturePayload): void;
  getAll(): CapturePayload[];
  clear(): void;
}

export function createCaptureStore(): CaptureStore {
  const captures: CapturePayload[] = [];
  return {
    add(payload: CapturePayload): void {
      captures.push(payload);
    },
    getAll(): CapturePayload[] {
      return [...captures];
    },
    clear(): void {
      captures.length = 0;
    },
  };
}
