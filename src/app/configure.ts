import { refreshSession, useSessionStore } from "@/features/auth";
import { configureApi } from "@/shared/api/client";

/** Composition root: the only place where the API layer is wired to the auth feature. */
export function configureApp() {
  configureApi({
    getAccessToken: () => useSessionStore.getState().accessToken,
    refresh: refreshSession,
    onSessionExpired: () => useSessionStore.getState().clear(),
  });
}
