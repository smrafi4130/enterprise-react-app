import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button, Field, Input } from "@smrafi/ui";
import { ApiError } from "@/shared/api/errors";
import { login } from "./api";
import { useSessionStore } from "./session-store";

export function LoginPage() {
  const user = useSessionStore((s) => s.user);
  const setSession = useSessionStore((s) => s.setSession);
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      setSession(await login(String(form.get("email")), String(form.get("password"))));
      navigate(from, { replace: true });
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? "Invalid email or password."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth">
      <h1>Sign in</h1>
      <form onSubmit={onSubmit} noValidate className="stack">
        <Field required error={error}>
          <Field.Label>Email</Field.Label>
          <Field.Control>
            <Input name="email" type="email" autoComplete="username" />
          </Field.Control>
        </Field>
        <Field required>
          <Field.Label>Password</Field.Label>
          <Field.Control>
            <Input name="password" type="password" autoComplete="current-password" />
          </Field.Control>
        </Field>
        <Button type="submit" loading={pending}>
          Sign in
        </Button>
      </form>
      <p className="muted">
        Demo accounts (password <code>password</code>): admin@, manager@, viewer@example.com
      </p>
    </main>
  );
}
