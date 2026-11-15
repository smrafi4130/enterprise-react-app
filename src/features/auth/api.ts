import { request } from "@/shared/api/client";
import { sessionSchema, type Session } from "./schemas";
import { useSessionStore } from "./session-store";

export const login = (email: string, password: string): Promise<Session> =>
  request("/auth/login", { method: "POST", body: { email, password }, schema: sessionSchema });

export async function refreshSession(): Promise<string | null> {
  const { refreshToken, setSession, clear } = useSessionStore.getState();
  if (!refreshToken) return null;
  try {
    const session = await request("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      schema: sessionSchema,
    });
    setSession(session);
    return session.accessToken;
  } catch {
    clear();
    return null;
  }
}
