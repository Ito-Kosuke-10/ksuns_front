"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getStreamTicket } from "@/lib/sse-client";

const API_ENDPOINT =
  process.env.NEXT_PUBLIC_API_ENDPOINT ?? "http://localhost:8000";

type StreamingState = {
  summary: string;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
};

/**
 * マインドマップノードのサマリーをSSEでストリーミング取得するカスタムフック
 *
 * 処理フロー:
 * 1. POST /api/mindmap/node/{nodeId}/summary-ticket (Bearer認証)
 * 2. ticketを受け取る
 * 3. new EventSource(/summary-stream?ticket=xxx)
 * 4. summary_delta を連結
 * 5. done で終了
 */
export function useStreamingMindmapSummary(nodeId: string | null) {
  const [state, setState] = useState<StreamingState>({
    summary: "",
    isStreaming: false,
    isDone: false,
    error: null,
  });

  // EventSourceの参照を保持（クリーンアップ用）
  const eventSourceRef = useRef<EventSource | null>(null);

  // ストリーミング開始
  const startStreaming = useCallback(async () => {
    if (!nodeId) return;

    // 既存の接続があればクローズ
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState({
      summary: "",
      isStreaming: true,
      isDone: false,
      error: null,
    });

    try {
      // 1. ticket取得（Bearer認証でAPI呼び出し）
      console.log("[MindmapSSE] Getting ticket for nodeId:", nodeId);
      const ticket = await getStreamTicket(nodeId);
      console.log("[MindmapSSE] Ticket received:", ticket.substring(0, 20) + "...");

      // 2. EventSource接続（ticketをqueryで送付）
      const streamUrl = `${API_ENDPOINT}/api/mindmap/node/${encodeURIComponent(nodeId)}/summary-stream?ticket=${encodeURIComponent(ticket)}`;
      console.log("[MindmapSSE] Connecting to:", streamUrl);

      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      // 接続成功
      eventSource.onopen = () => {
        console.log("[MindmapSSE] Connection opened");
      };

      // 3. summary_delta イベントを連結
      eventSource.addEventListener("summary_delta", (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log("[MindmapSSE] Received delta:", data.delta?.substring(0, 50));
          setState((prev) => ({
            ...prev,
            summary: prev.summary + (data.delta || ""),
          }));
        } catch (err) {
          console.error("[MindmapSSE] Failed to parse summary_delta:", err);
        }
      });

      // 4. done イベントで終了
      eventSource.addEventListener("done", () => {
        console.log("[MindmapSSE] Stream completed");
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isDone: true,
        }));
        eventSource.close();
        eventSourceRef.current = null;
      });

      // エラーイベント（バックエンドからのエラー）
      eventSource.addEventListener("error", (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data || "{}");
          console.error("[MindmapSSE] Server error:", data);
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: data.message || "サーバーエラーが発生しました",
          }));
        } catch {
          // パースできない場合は接続エラー
          console.error("[MindmapSSE] Connection error");
        }
        eventSource.close();
        eventSourceRef.current = null;
      });

      // 接続エラー
      eventSource.onerror = (error) => {
        console.error("[MindmapSSE] EventSource error:", error);
        // readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        if (eventSource.readyState === EventSource.CLOSED) {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: prev.isDone ? null : "接続が切断されました",
          }));
          eventSourceRef.current = null;
        }
      };
    } catch (err) {
      console.error("[MindmapSSE] Failed to start streaming:", err);
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: err instanceof Error ? err.message : "接続に失敗しました",
      }));
    }
  }, [nodeId]);

  // リセット関数
  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState({
      summary: "",
      isStreaming: false,
      isDone: false,
      error: null,
    });
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startStreaming,
    reset,
  };
}
