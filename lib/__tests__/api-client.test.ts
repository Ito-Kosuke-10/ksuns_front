import { apiFetch } from "../api-client";

describe("apiFetch", () => {
  const originalEndpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch!;
    process.env.NEXT_PUBLIC_API_ENDPOINT = originalEndpoint;
  });

  it("returns data when response is ok and JSON is valid", async () => {
    process.env.NEXT_PUBLIC_API_ENDPOINT = "http://localhost:8000";
    const mockJson = { message: "ok" };
    const response: Partial<Response> = {
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockJson),
    };
    global.fetch = jest.fn().mockResolvedValue(response as Response);

    const result = await apiFetch<{ message: string }>("/test");

    expect(result.status).toBe(200);
    expect(result.data).toEqual(mockJson);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/test",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns null data when response is not ok", async () => {
    const response: Partial<Response> = {
      ok: false,
      status: 401,
    };
    global.fetch = jest.fn().mockResolvedValue(response as Response);

    const result = await apiFetch("/unauthorized");

    expect(result.status).toBe(401);
    expect(result.data).toBeNull();
  });

  it("handles JSON parse errors gracefully", async () => {
    const response: Partial<Response> = {
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error("bad json")),
    };
    global.fetch = jest.fn().mockResolvedValue(response as Response);

    const result = await apiFetch("/bad-json");

    expect(result.status).toBe(200);
    expect(result.data).toBeNull();
  });
});
