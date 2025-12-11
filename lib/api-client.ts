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

  let response: Response;
  try {
    response = await fetch(`${API_ENDPOINT}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch (err) {
    // ネットワークエラー（接続拒否など）の場合
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ ネットワークエラー (${API_ENDPOINT}${path}):`, errorMessage);
    console.error("💡 バックエンドが起動しているか確認してください: http://localhost:8000");
    throw new Error(`バックエンドに接続できません: ${errorMessage}`);
  }

  if (!response.ok) {
    let errorDetail = null;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || null;
      console.error("APIエラーレスポンス:", { status: response.status, detail: errorDetail });
    } catch {
      // JSONパースに失敗した場合はテキストを取得
      try {
        const errorText = await response.text();
        console.error("APIエラーレスポンス (テキスト):", { status: response.status, text: errorText });
      } catch {
        console.error("APIエラーレスポンス (詳細不明):", { status: response.status });
      }
    }
    return { data: null, status: response.status };
  }

  try {
    const json = (await response.json()) as T;
    console.log("★AIからの返却データ:", json);
    return { data: json, status: response.status };
  } catch (err) {
    console.error("JSONパースエラー:", err);
    return { data: null, status: response.status };
  }
}
