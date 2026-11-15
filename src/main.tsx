import "@smrafi/tokens/tokens.css";
import "@smrafi/ui/styles.css";
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { configureApp } from "@/app/configure";
import { Providers } from "@/app/providers";
import { createQueryClient } from "@/app/query-client";
import { createRouter } from "@/app/routes";
import { reportError } from "@/shared/lib/observability";

async function bootstrap() {
  // This reference app has no real backend: MSW serves the API in the browser.
  if (import.meta.env.VITE_USE_MOCKS !== "false") {
    const { worker } = await import("@/mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass", quiet: true });
  }
  configureApp();
  window.addEventListener("unhandledrejection", (e) =>
    reportError(e.reason, { source: "unhandledrejection" }),
  );

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers client={createQueryClient()}>
        <RouterProvider router={createRouter()} />
      </Providers>
    </StrictMode>,
  );
}

void bootstrap();
