import type { ReactNode } from "react";
import type { Permission } from "@/shared/lib/permissions";
import { useCan } from "./use-session";

/** Renders children only if the current user holds `permission`. UI affordance only: the server enforces. */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{useCan(permission) ? children : fallback}</>;
}
