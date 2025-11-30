import { apiFetch } from "../api-client";

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch!;
  });

  it("returns data when response is ok and JSON is valid", async () => {
    const mockJson = { message: "ok" };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockJson),
    } as any);

    const result = await apiFetch<{ message: string }>("/test");

    expect(result.status).toBe(200);
    expect(result.data).toEqual(mockJson);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/test",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns null data when response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as any);

    const result = await apiFetch("/unauthorized");

    expect(result.status).toBe(401);
    expect(result.data).toBeNull();
  });

  it("handles JSON parse errors gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error("bad json")),
    } as any);

    const result = await apiFetch("/bad-json");

    expect(result.status).toBe(200);
    expect(result.data).toBeNull();
  });
});
