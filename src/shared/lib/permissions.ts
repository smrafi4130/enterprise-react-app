export const ROLES = ["viewer", "manager", "admin"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Permissions are the unit of authorization in the UI; roles are just bundles.
 * Components ask "can the user do X?", never "is the user an admin?", so
 * changing what a role may do is a one-line change here.
 */
const PERMISSIONS = {
  "project:read": ["viewer", "manager", "admin"],
  "project:create": ["manager", "admin"],
  "issue:read": ["viewer", "manager", "admin"],
  "issue:create": ["manager", "admin"],
  "issue:update": ["manager", "admin"],
  "user:read": ["admin"],
  "user:update-role": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function permissionsFor(role: Role): Permission[] {
  return (Object.keys(PERMISSIONS) as Permission[]).filter((p) => can(role, p));
}
