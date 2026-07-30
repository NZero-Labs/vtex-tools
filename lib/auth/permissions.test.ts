import { describe, expect, it } from "vitest"

import {
  canAccessTool,
  hasCapability,
  preservesActiveAdministrator,
} from "@/lib/auth/permissions"

describe("authorization", () => {
  it("allows employees to compare budgets but not administer users", () => {
    const employee = { active: true, role: "EMPLOYEE" as const }

    expect(hasCapability(employee, "budget:compare")).toBe(true)
    expect(hasCapability(employee, "active:update")).toBe(true)
    expect(hasCapability(employee, "users:manage")).toBe(false)
  })

  it("allows administrators to manage the platform", () => {
    const admin = { active: true, role: "ADMIN" as const }

    expect(hasCapability(admin, "users:manage")).toBe(true)
    expect(hasCapability(admin, "tools:manage")).toBe(true)
    expect(hasCapability(admin, "audit:view")).toBe(true)
  })

  it("denies every capability to inactive users", () => {
    expect(
      hasCapability({ active: false, role: "ADMIN" }, "users:manage")
    ).toBe(false)
  })

  it("applies an explicit per-tool override", () => {
    const employee = { active: true, role: "EMPLOYEE" as const }

    expect(canAccessTool(employee, "budget:compare", false)).toBe(false)
    expect(canAccessTool(employee, "budget:compare", true)).toBe(true)
  })

  it("preserves at least one active administrator", () => {
    expect(
      preservesActiveAdministrator({
        currentRole: "ADMIN",
        currentActive: true,
        nextRole: "EMPLOYEE",
        nextActive: true,
        activeAdminCount: 1,
      })
    ).toBe(false)
    expect(
      preservesActiveAdministrator({
        currentRole: "ADMIN",
        currentActive: true,
        nextRole: "ADMIN",
        nextActive: false,
        activeAdminCount: 2,
      })
    ).toBe(true)
  })
})
