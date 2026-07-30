import { describe, expect, it } from "vitest";

import { assertNeonBranch } from "./env";

describe("Neon environment isolation", () => {
  it("rejects a production connection in the test environment", () => {
    expect(() => assertNeonBranch("test", "production")).toThrow(
      "test exige NEON_BRANCH=test",
    );
    expect(() => assertNeonBranch("production", "production")).not.toThrow();
  });
});
