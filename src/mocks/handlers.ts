import { http, HttpResponse } from "msw";
import { db, type DbUser } from "./db";

/**
 * In-memory API used in dev, unit/integration tests and E2E, so all three
 * exercise the same contract. Tokens are opaque strings, not real JWTs: this
 * models the *client-visible* behaviour (expiry, refresh, 401/403), not
 * server-side crypto.
 */
const ACCESS_PREFIX = "access:";

export const SESSION = { expiredAccessTokens: new Set<string>() };

function userFromRequest(request: Request): DbUser | "expired" | null {
  const header = request.headers.get("Authorization");
  if (!header?.startsWith(`Bearer ${ACCESS_PREFIX}`)) return null;
  const token = header.slice("Bearer ".length);
  if (SESSION.expiredAccessTokens.has(token)) return "expired";
  const id = token.slice(ACCESS_PREFIX.length).split(":")[0];
  return db.users.find((u) => u.id === id) ?? null;
}

const problem = (status: number, message: string, code?: string) =>
  HttpResponse.json({ message, code }, { status });

function issueAccessToken(user: DbUser) {
  return `${ACCESS_PREFIX}${user.id}:${db.nextId++}`;
}

const publicUser = ({ password: _p, ...rest }: DbUser) => rest;

type Guard = { user: DbUser } | { error: Response };
function authorize(request: Request, roles?: DbUser["role"][]): Guard {
  const user = userFromRequest(request);
  if (user === null || user === "expired")
    return { error: problem(401, "Unauthenticated", "unauthenticated") };
  if (roles && !roles.includes(user.role)) return { error: problem(403, "Forbidden", "forbidden") };
  return { user };
}

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) return problem(401, "Invalid email or password", "invalid_credentials");
    const refreshToken = `refresh:${user.id}:${db.nextId++}`;
    return HttpResponse.json({
      accessToken: issueAccessToken(user),
      refreshToken,
      user: publicUser(user),
    });
  }),

  http.post("/api/auth/refresh", async ({ request }) => {
    const { refreshToken } = (await request.json()) as { refreshToken: string };
    // Refresh tokens are self-describing ("refresh:<userId>:<n>") so they stay valid
    // across a full page reload, which resets this in-memory mock. Rotation is still
    // enforced within a page lifetime via the `used` set.
    const userId = /^refresh:([^:]+):\d+$/.exec(refreshToken ?? "")?.[1];
    const user = db.users.find((u) => u.id === userId);
    if (!user || db.usedRefreshTokens.has(refreshToken))
      return problem(401, "Session expired", "refresh_invalid");
    db.usedRefreshTokens.add(refreshToken);
    const next = `refresh:${user.id}:${db.nextId++}`;
    return HttpResponse.json({
      accessToken: issueAccessToken(user),
      refreshToken: next,
      user: publicUser(user),
    });
  }),

  http.get("/api/projects", ({ request }) => {
    const g = authorize(request);
    if ("error" in g) return g.error;
    const projects = db.projects.map((p) => ({
      ...p,
      openIssues: db.issues.filter((i) => i.projectId === p.id && i.status !== "done").length,
    }));
    return HttpResponse.json(projects);
  }),

  http.post("/api/projects", async ({ request }) => {
    const g = authorize(request, ["manager", "admin"]);
    if ("error" in g) return g.error;
    const { name, description } = (await request.json()) as { name: string; description: string };
    if (!name?.trim()) return problem(422, "Name is required", "validation");
    const project = {
      id: `p${db.nextId++}`,
      name: name.trim(),
      description: description ?? "",
      createdAt: new Date().toISOString(),
    };
    db.projects.push(project);
    return HttpResponse.json({ ...project, openIssues: 0 }, { status: 201 });
  }),

  http.get("/api/projects/:id/issues", ({ request, params }) => {
    const g = authorize(request);
    if ("error" in g) return g.error;
    if (!db.projects.some((p) => p.id === params.id)) return problem(404, "Project not found");
    return HttpResponse.json(db.issues.filter((i) => i.projectId === params.id));
  }),

  http.post("/api/projects/:id/issues", async ({ request, params }) => {
    const g = authorize(request, ["manager", "admin"]);
    if ("error" in g) return g.error;
    const { title } = (await request.json()) as { title: string };
    if (!title?.trim()) return problem(422, "Title is required", "validation");
    const issue = {
      id: `i${db.nextId++}`,
      projectId: String(params.id),
      title: title.trim(),
      status: "open" as const,
      assigneeId: null,
      createdAt: new Date().toISOString(),
    };
    db.issues.push(issue);
    return HttpResponse.json(issue, { status: 201 });
  }),

  http.patch("/api/issues/:id", async ({ request, params }) => {
    const g = authorize(request, ["manager", "admin"]);
    if ("error" in g) return g.error;
    const issue = db.issues.find((i) => i.id === params.id);
    if (!issue) return problem(404, "Issue not found");
    Object.assign(issue, (await request.json()) as object);
    return HttpResponse.json(issue);
  }),

  http.get("/api/users", ({ request }) => {
    const g = authorize(request, ["admin"]);
    if ("error" in g) return g.error;
    return HttpResponse.json(db.users.map(publicUser));
  }),

  http.patch("/api/users/:id", async ({ request, params }) => {
    const g = authorize(request, ["admin"]);
    if ("error" in g) return g.error;
    const user = db.users.find((u) => u.id === params.id);
    if (!user) return problem(404, "User not found");
    Object.assign(user, (await request.json()) as object);
    return HttpResponse.json(publicUser(user));
  }),
];
