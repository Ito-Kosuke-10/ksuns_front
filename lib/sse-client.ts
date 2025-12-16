import { apiFetch } from "./api-client";

/**
 * SSEストリーム接続用のticketを取得する
 * EventSourceはカスタムヘッダーを送れないため、
 * 先にBearer認証でticketを取得し、queryパラメータで渡す
 */
export async function getStreamTicket(nodeId: string): Promise<string> {
  const { data, status } = await apiFetch<{ ticket: string }>(
    `/api/mindmap/node/${encodeURIComponent(nodeId)}/summary-ticket`,
    { method: "POST" }
  );

  if (status === 401) {
    throw new Error("認証が必要です。再度ログインしてください。");
  }

  if (!data?.ticket) {
    throw new Error("ストリーム接続用のticket取得に失敗しました");
  }

  return data.ticket;
}
