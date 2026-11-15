import { Button } from "@smrafi/ui";
import { ApiError, ContractError, NetworkError } from "@/shared/api/errors";

function describe(error: unknown): string {
  if (error instanceof ApiError && error.isForbidden)
    return "You don't have permission to view this.";
  if (error instanceof NetworkError)
    return "Can't reach the server. Check your connection and try again.";
  if (error instanceof ContractError)
    return "The server sent an unexpected response. This has been reported.";
  return "Something went wrong.";
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="error-state">
      <p>{describe(error)}</p>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
