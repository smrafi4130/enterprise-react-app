import { can, permissionsFor, ROLES, type Permission } from "./permissions";

describe("permissions", () => {
  it("denies everything when there is no role", () => {
    expect(can(undefined, "project:read")).toBe(false);
  });

  it.each<[Parameters<typeof can>[0], Permission, boolean]>([
    ["viewer", "project:read", true],
    ["viewer", "issue:create", false],
    ["manager", "issue:create", true],
    ["manager", "user:read", false],
    ["admin", "user:update-role", true],
  ])("role %s / %s -> %s", (role, permission, expected) => {
    expect(can(role, permission)).toBe(expected);
  });

  it("roles are strictly nested: each role has a superset of the one below", () => {
    const [viewer, manager, admin] = ROLES.map((r) => new Set(permissionsFor(r)));
    expect([...viewer!].every((p) => manager!.has(p))).toBe(true);
    expect([...manager!].every((p) => admin!.has(p))).toBe(true);
  });
});
