import { create } from "zustand";
import type { Session, User } from "./schemas";

const REFRESH_KEY = "ea.refresh";

/**
 * Token storage policy (see docs/adr/0003-token-storage.md):
 *  - access token: memory only, so XSS can't exfiltrate a long-lived credential from storage
 *  - refresh token: sessionStorage so a reload doesn't log the user out
 * A production deployment should move the refresh token to an httpOnly,
 * SameSite cookie set by the backend; this app has no real backend.
 */
interface SessionState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: Session) => void;
  clear: () => void;
}

function readRefresh(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: readRefresh(),
  setSession: ({ user, accessToken, refreshToken }) => {
    try {
      sessionStorage.setItem(REFRESH_KEY, refreshToken);
    } catch {
      /* storage unavailable: session lasts until reload */
    }
    set({ user, accessToken, refreshToken });
  },
  clear: () => {
    try {
      sessionStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
