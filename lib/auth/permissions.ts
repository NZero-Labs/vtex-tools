export type Role = "VISITOR" | "EMPLOYEE" | "ADMIN"

export type Capability =
  | "dashboard:view"
  | "budget:compare"
  | "active:update"
  | "users:manage"
  | "tools:manage"
  | "audit:view"

export type Principal = {
  active: boolean
  role: Role
}

const roleCapabilities: Record<Role, ReadonlySet<Capability>> = {
  VISITOR: new Set(),
  EMPLOYEE: new Set(["dashboard:view", "budget:compare", "active:update"]),
  ADMIN: new Set([
    "dashboard:view",
    "budget:compare",
    "active:update",
    "users:manage",
    "tools:manage",
    "audit:view",
  ]),
}

export function hasCapability(
  principal: Principal,
  capability: Capability
): boolean {
  return principal.active && roleCapabilities[principal.role].has(capability)
}

export function canAccessTool(
  principal: Principal,
  capability: Capability,
  override?: boolean
): boolean {
  return override !== false && hasCapability(principal, capability)
}

export function preservesActiveAdministrator(input: {
  currentRole: Role
  currentActive: boolean
  nextRole: Role
  nextActive: boolean
  activeAdminCount: number
}): boolean {
  const removesActiveAdmin =
    input.currentRole === "ADMIN" &&
    input.currentActive &&
    (input.nextRole !== "ADMIN" || !input.nextActive)

  return !removesActiveAdmin || input.activeAdminCount > 1
}
