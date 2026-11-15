type Context = Record<string, string>;
type Reporter = (error: unknown, context: Context) => void;

let reporter: Reporter = (error, context) => console.error("[unhandled]", error, context);

/** Swap in Sentry/Datadog at startup: `setErrorReporter((e, c) => Sentry.captureException(e, { extra: c }))`. */
export function setErrorReporter(next: Reporter) {
  reporter = next;
}

export const reportError: Reporter = (error, context) => reporter(error, context);
