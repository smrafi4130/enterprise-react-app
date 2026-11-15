import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@smrafi/ui";
import { Can, useSessionStore, useUser } from "@/features/auth";
import { ErrorBoundary } from "@/shared/ui/error-boundary";

export function Layout() {
  const user = useUser();
  const clear = useSessionStore((s) => s.clear);
  const navigate = useNavigate();

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <nav aria-label="Main">
          <NavLink to="/">Projects</NavLink>
          <Can permission="user:read">
            <NavLink to="/users">Users</NavLink>
          </Can>
        </nav>
        <div className="topbar__user">
          <span>
            {user?.name} <span className="badge">{user?.role}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clear();
              navigate("/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </>
  );
}
