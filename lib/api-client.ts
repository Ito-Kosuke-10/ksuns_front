import { getAccessToken } from "./auth-token";

const API_ENDPOINT =
  process.env.NEXT_PUBLIC_API_ENDPOINT ?? "http://localhost:8000";

type HttpMethod = "GET" | "POST" | "PUT";

export async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    token?: string | null;
  } = {},
): Promise<{ data: T | null; status: number }> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const bearer = token ?? getAccessToken();
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  const response = await fetch(`${API_ENDPOINT}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    return { data: null, status: response.status };
  }

  try {
    const json = (await response.json()) as T;
    console.log("★AIからの返却データ:", json);
    return { data: json, status: response.status };
  } catch {
    return { data: null, status: response.status };
  }
}
