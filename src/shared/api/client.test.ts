import { http, HttpResponse } from "msw";
import { z } from "zod";
import { server } from "@/mocks/server";
import { configureApi, request } from "./client";
import { ApiError, ContractError, NetworkError } from "./errors";

const schema = z.object({ ok: z.boolean() });

function setup(overrides: Partial<Parameters<typeof configureApi>[0]> = {}) {
  let token: string | null = "t1";
  const provider = {
    getAccessToken: () => token,
    refresh: vi.fn(async () => {
      token = "t2";
      return token;
    }),
    onSessionExpired: vi.fn(),
    ...overrides,
  };
  configureApi(provider);
  return provider;
}

describe("api client", () => {
  it("sends the bearer token and validates the response", async () => {
    setup();
    let auth: string | null = null;
    server.use(
      http.get("/api/ping", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(request("/ping", { schema })).resolves.toEqual({ ok: true });
    expect(auth).toBe("Bearer t1");
  });

  it("throws ContractError when the payload does not match the schema", async () => {
    setup();
    server.use(http.get("/api/ping", () => HttpResponse.json({ ok: "yes" })));
    await expect(request("/ping", { schema })).rejects.toBeInstanceOf(ContractError);
  });

  it("maps error responses to ApiError with status and code", async () => {
    setup();
    server.use(
      http.get("/api/ping", () =>
        HttpResponse.json({ message: "nope", code: "forbidden" }, { status: 403 }),
      ),
    );
    await expect(request("/ping", { schema })).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
      message: "nope",
    });
    await expect(request("/ping", { schema })).rejects.toBeInstanceOf(ApiError);
  });

  it("wraps network failures", async () => {
    setup();
    server.use(http.get("/api/ping", () => HttpResponse.error()));
    await expect(request("/ping", { schema })).rejects.toBeInstanceOf(NetworkError);
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    const provider = setup();
    server.use(
      http.get("/api/ping", ({ request }) =>
        request.headers.get("Authorization") === "Bearer t2"
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ message: "expired" }, { status: 401 }),
      ),
    );
    await expect(request("/ping", { schema })).resolves.toEqual({ ok: true });
    expect(provider.refresh).toHaveBeenCalledTimes(1);
  });

  it("shares a single refresh between concurrent 401s", async () => {
    const provider = setup();
    server.use(
      http.get("/api/ping", ({ request }) =>
        request.headers.get("Authorization") === "Bearer t2"
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ message: "expired" }, { status: 401 }),
      ),
    );
    await Promise.all([
      request("/ping", { schema }),
      request("/ping", { schema }),
      request("/ping", { schema }),
    ]);
    expect(provider.refresh).toHaveBeenCalledTimes(1);
  });

  it("expires the session when refresh fails, without looping", async () => {
    const provider = setup({ refresh: vi.fn(async () => null) });
    server.use(
      http.get("/api/ping", () => HttpResponse.json({ message: "expired" }, { status: 401 })),
    );
    await expect(request("/ping", { schema })).rejects.toMatchObject({ status: 401 });
    expect(provider.refresh).toHaveBeenCalledTimes(1);
    expect(provider.onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("does not attempt a refresh for auth endpoints themselves", async () => {
    const provider = setup();
    server.use(
      http.post("/api/auth/login", () => HttpResponse.json({ message: "bad" }, { status: 401 })),
    );
    await expect(
      request("/auth/login", { method: "POST", body: {}, schema }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(provider.refresh).not.toHaveBeenCalled();
  });
});
