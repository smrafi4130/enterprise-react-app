import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider } from "react-router-dom";
import { configureApp } from "@/app/configure";
import { Providers } from "@/app/providers";
import { createQueryClient } from "@/app/query-client";
import { createTestRouter } from "@/app/routes";
import { useSessionStore } from "@/features/auth";

/** Renders the real app (providers + routes) against the MSW handlers. */
export function renderApp(path = "/") {
  configureApp();
  useSessionStore.getState().clear();
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  const router = createTestRouter([path]);
  const user = userEvent.setup();
  const utils = render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  );
  return { user, router, client, ...utils };
}

export async function signIn(
  user: ReturnType<typeof userEvent.setup>,
  screen: typeof import("@testing-library/react").screen,
  email: string,
) {
  await user.type(await screen.findByRole("textbox", { name: /email/i }), email);
  await user.type(screen.getByLabelText(/password/i), "password");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}
