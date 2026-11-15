import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Permission } from "@/shared/lib/permissions";
import { refreshSession } from "./api";
import { useSessionStore } from "./session-store";
import { useCan } from "./use-session";

/** Restores a session from the stored refresh token on first load, then gates on the user. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useSessionStore((s) => s.user);
  const hasRefresh = useSessionStore((s) => Boolean(s.refreshToken));
  const [restoring, setRestoring] = useState(!user && hasRefresh);
  const location = useLocation();

  useEffect(() => {
    if (!restoring) return;
    void refreshSession().finally(() => setRestoring(false));
  }, [restoring]);

  if (restoring) return <p role="status">Restoring session…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const allowed = useCan(permission);
  if (!allowed) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}
