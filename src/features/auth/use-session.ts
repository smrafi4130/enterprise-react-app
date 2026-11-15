import { can, type Permission } from "@/shared/lib/permissions";
import { useSessionStore } from "./session-store";

export const useUser = () => useSessionStore((s) => s.user);

export function useCan(permission: Permission): boolean {
  return can(
    useSessionStore((s) => s.user?.role),
    permission,
  );
}
