import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ToastProvider } from "@smrafi/ui";
import type { ReactNode } from "react";

export function Providers({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
