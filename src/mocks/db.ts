import type { Role } from "@/shared/lib/permissions";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}
export interface DbProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}
export type IssueStatus = "open" | "in_progress" | "done";
export interface DbIssue {
  id: string;
  projectId: string;
  title: string;
  status: IssueStatus;
  assigneeId: string | null;
  createdAt: string;
}

function seed() {
  const users: DbUser[] = [
    {
      id: "u1",
      name: "Ada Admin",
      email: "admin@example.com",
      password: "password",
      role: "admin",
    },
    {
      id: "u2",
      name: "Maya Manager",
      email: "manager@example.com",
      password: "password",
      role: "manager",
    },
    {
      id: "u3",
      name: "Victor Viewer",
      email: "viewer@example.com",
      password: "password",
      role: "viewer",
    },
  ];
  const projects: DbProject[] = [
    {
      id: "p1",
      name: "Checkout redesign",
      description: "Reduce drop-off in the payment step.",
      createdAt: "2026-01-12T09:00:00Z",
    },
    {
      id: "p2",
      name: "Design system adoption",
      description: "Migrate product surfaces to shared primitives.",
      createdAt: "2026-02-03T09:00:00Z",
    },
  ];
  const issues: DbIssue[] = [
    {
      id: "i1",
      projectId: "p1",
      title: "Address form fails on paste",
      status: "open",
      assigneeId: "u2",
      createdAt: "2026-01-14T10:00:00Z",
    },
    {
      id: "i2",
      projectId: "p1",
      title: "Add Apple Pay",
      status: "in_progress",
      assigneeId: null,
      createdAt: "2026-01-20T10:00:00Z",
    },
    {
      id: "i3",
      projectId: "p2",
      title: "Replace legacy modal",
      status: "done",
      assigneeId: "u3",
      createdAt: "2026-02-10T10:00:00Z",
    },
  ];
  return { users, projects, issues, usedRefreshTokens: new Set<string>(), nextId: 100 };
}

export const db = seed();

/** Tests call this between cases so state never leaks. */
export function resetDb() {
  Object.assign(db, seed());
}
