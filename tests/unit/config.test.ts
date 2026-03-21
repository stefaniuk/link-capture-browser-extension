import { describe, expect, it } from "vitest";
import { getDefaultConfig, isValidEndpoint } from "../../src/extension/config.js";

describe("getDefaultConfig", () => {
  it("returns the default API endpoint", () => {
    const config = getDefaultConfig();
    expect(config.apiEndpoint).toBe("http://localhost:3000/captures");
  });
});

describe("isValidEndpoint", () => {
  it("accepts http URLs", () => {
    expect(isValidEndpoint("http://localhost:3000/captures")).toBe(true);
  });

  it("accepts https URLs", () => {
    expect(isValidEndpoint("https://api.example.com/captures")).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(isValidEndpoint("")).toBe(false);
  });

  it("rejects non-URL strings", () => {
    expect(isValidEndpoint("not-a-url")).toBe(false);
  });

  it("rejects ftp protocol", () => {
    expect(isValidEndpoint("ftp://example.com")).toBe(false);
  });

  it("rejects file protocol", () => {
    expect(isValidEndpoint("file:///etc/passwd")).toBe(false);
  });
});
