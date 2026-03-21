const DEFAULT_ENDPOINT = "http://localhost:3000/captures";

export interface ExtensionConfig {
  apiEndpoint: string;
}

export function getDefaultConfig(): ExtensionConfig {
  return {
    apiEndpoint: DEFAULT_ENDPOINT,
  };
}

export function isValidEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
