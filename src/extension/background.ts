import { getDefaultConfig } from "./config.js";
import type { CapturePayload } from "./types.js";

export function buildCapturePayload(url: string, now: Date): CapturePayload {
  return {
    url,
    timestamp: now.toISOString(),
  };
}

export async function sendCapture(
  payload: CapturePayload,
  endpoint: string,
  fetchFn: typeof globalThis.fetch = globalThis.fetch,
): Promise<boolean> {
  try {
    const response = await fetchFn(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export interface BadgeApi {
  setBadgeText(details: { text: string }): Promise<void>;
  setBadgeBackgroundColor(details: { color: string }): Promise<void>;
}

export type SetTimeoutFn = (callback: () => void, ms: number) => unknown;

export function showBadge(
  success: boolean,
  badgeApi: BadgeApi,
  setTimeoutFn: SetTimeoutFn = globalThis.setTimeout,
): void {
  const text = success ? "\u2713" : "\u2717";
  const colour = success ? "#22c55e" : "#ef4444";

  badgeApi.setBadgeText({ text });
  badgeApi.setBadgeBackgroundColor({ color: colour });

  setTimeoutFn(() => {
    badgeApi.setBadgeText({ text: "" });
  }, 2000);
}

// Wire event listeners when running as a Chrome extension service worker
if (typeof chrome !== "undefined" && chrome.action) {
  const captureUrl = async (url: string): Promise<void> => {
    const config = getDefaultConfig();
    const payload = buildCapturePayload(url, new Date());
    const success = await sendCapture(payload, config.apiEndpoint);
    showBadge(success, chrome.action);
  };

  chrome.action.onClicked.addListener((tab) => {
    const url = tab.url;
    if (!url) {
      showBadge(false, chrome.action);
      return;
    }
    captureUrl(url);
  });

  chrome.commands.onCommand.addListener(async (command: string) => {
    if (command === "capture-link") {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = tab?.url;
      if (!url) {
        showBadge(false, chrome.action);
        return;
      }
      captureUrl(url);
    }
  });
}
