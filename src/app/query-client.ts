import { QueryClient } from "@tanstack/react-query";
import { ApiError, isRetryable } from "@/shared/api/errors";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retry only failures that can succeed on retry; a 403 or 404 never will.
        retry: (count, error) => count < 2 && isRetryable(error),
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}

export const isAuthError = (e: unknown) =>
  e instanceof ApiError && (e.isUnauthorized || e.isForbidden);
