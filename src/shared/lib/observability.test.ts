import { reportError, setErrorReporter } from "./observability";

describe("observability", () => {
  it("forwards errors and context to the configured reporter", () => {
    const spy = vi.fn();
    setErrorReporter(spy);
    const error = new Error("boom");
    reportError(error, { route: "/x" });
    expect(spy).toHaveBeenCalledWith(error, { route: "/x" });
  });
});
