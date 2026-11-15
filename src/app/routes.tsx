import { lazy, Suspense } from "react";
import { createBrowserRouter, createMemoryRouter, type RouteObject } from "react-router-dom";
import { LoginPage, RequireAuth, RequirePermission } from "@/features/auth";
import { ProjectsPage } from "@/features/projects";
import { Layout } from "./layout";

// Role-gated and rarely visited screens are split out of the main bundle.
const IssuesPage = lazy(() => import("@/features/issues").then((m) => ({ default: m.IssuesPage })));
const UsersPage = lazy(() => import("@/features/users").then((m) => ({ default: m.UsersPage })));

const lazyPage = (node: React.ReactNode) => (
  <Suspense fallback={<p role="status">Loading…</p>}>{node}</Suspense>
);

export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ProjectsPage /> },
      { path: "projects/:projectId", element: lazyPage(<IssuesPage />) },
      {
        path: "users",
        element: (
          <RequirePermission permission="user:read">{lazyPage(<UsersPage />)}</RequirePermission>
        ),
      },
      { path: "forbidden", element: <h1>You don’t have access to that page</h1> },
      { path: "*", element: <h1>Page not found</h1> },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
export const createTestRouter = (initialEntries: string[]) =>
  createMemoryRouter(routes, { initialEntries });
