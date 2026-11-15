import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { SESSION } from "@/mocks/handlers";
import { useSessionStore } from "@/features/auth";
import { renderApp, signIn } from "@/test/render-app";

describe("authentication", () => {
  it("redirects anonymous users to login and returns them after signing in", async () => {
    const { user, router } = renderApp("/users");
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();

    await signIn(user, screen, "admin@example.com");
    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/users");
  });

  it("shows an accessible error for bad credentials", async () => {
    const { user } = renderApp("/login");
    await user.type(await screen.findByRole("textbox", { name: /email/i }), "admin@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInvalid();
  });

  it("signs out and clears the session", async () => {
    const { user } = renderApp("/login");
    await signIn(user, screen, "viewer@example.com");
    await user.click(await screen.findByRole("button", { name: "Sign out" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(useSessionStore.getState().user).toBeNull();
  });

  it("silently refreshes an expired access token and keeps the page working", async () => {
    const { user } = renderApp("/login");
    await signIn(user, screen, "manager@example.com");
    await screen.findByRole("heading", { name: "Projects" });

    SESSION.expiredAccessTokens.add(useSessionStore.getState().accessToken!);
    window.dispatchEvent(new Event("focus"));
    await user.click(screen.getByRole("link", { name: "Checkout redesign" }));
    expect(await screen.findByText("Address form fails on paste")).toBeInTheDocument();
  });
});

describe("role-based access control", () => {
  it("viewers can read but see no create controls", async () => {
    const { user } = renderApp("/login");
    await signIn(user, screen, "viewer@example.com");
    expect(await screen.findByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New project" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();

    await user.click(await screen.findByRole("link", { name: "Checkout redesign" }));
    await screen.findByText("Address form fails on paste");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("New issue")).not.toBeInTheDocument();
  });

  it("route guard sends a manager away from the admin-only users page", async () => {
    const { user, router } = renderApp("/login");
    await signIn(user, screen, "manager@example.com");
    await screen.findByRole("heading", { name: "Projects" });
    await router.navigate("/users");
    expect(await screen.findByRole("heading", { name: /don’t have access/ })).toBeInTheDocument();
  });

  it("admins can change a user's role", async () => {
    const { user } = renderApp("/login");
    await signIn(user, screen, "admin@example.com");
    await user.click(await screen.findByRole("link", { name: "Users" }));
    const select = await screen.findByRole("combobox", { name: "Role for Victor Viewer" });
    await user.selectOptions(select, "manager");
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Role for Victor Viewer" })).toHaveValue(
        "manager",
      ),
    );
  });
});

describe("projects and issues", () => {
  it("a manager creates a project and sees it in the list", async () => {
    const { user } = renderApp("/login");
    await signIn(user, screen, "manager@example.com");
    await user.click(await screen.findByRole("button", { name: "New project" }));
    const dialog = await screen.findByRole("dialog", { name: "New project" });
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByText("Name is required")).toBeInTheDocument();

    await user.type(within(dialog).getByRole("textbox", { name: /name/i }), "Billing revamp");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await screen.findByRole("link", { name: "Billing revamp" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates issue status optimistically and rolls back when the server rejects it", async () => {
    const { user } = renderApp("/login");
    await signIn(user, screen, "manager@example.com");
    await user.click(await screen.findByRole("link", { name: "Checkout redesign" }));
    const select = await screen.findByRole("combobox", {
      name: "Status for Address form fails on paste",
    });
    expect(select).toHaveValue("open");

    server.use(
      http.patch("/api/issues/:id", () => HttpResponse.json({ message: "boom" }, { status: 500 })),
    );
    await user.selectOptions(select, "done");

    expect(await screen.findByText("Could not update issue")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: "Status for Address form fails on paste" }),
      ).toHaveValue("open"),
    );
  });

  it("shows a retryable error state when the list request fails", async () => {
    server.use(
      http.get("/api/projects", () => HttpResponse.json({ message: "down" }, { status: 500 }), {
        once: true,
      }),
    );
    const { user } = renderApp("/login");
    await signIn(user, screen, "viewer@example.com");
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("link", { name: "Checkout redesign" })).toBeInTheDocument();
  });
});
