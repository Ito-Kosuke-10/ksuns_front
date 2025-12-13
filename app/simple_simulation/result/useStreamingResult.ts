"use client";

import { useEffect, useState, useCallback } from "react";

type StreamingField = "title" | "detail" | "story" | "location" | "hr" | "menu" | "marketing" | "funds" | null;

type StreamingState = {
  conceptTitle: string;
  conceptDetail: string;
  storeStory: string;
  locationAdvice: string;
  hrAdvice: string;
  menuAdvice: string;
  marketingAdvice: string;
  fundsAdvice: string;
  isStreaming: boolean;
  streamingField: StreamingField;
  error: string | null;
  isLoadingLocation: boolean;
  isLoadingHR: boolean;
  isLoadingMenu: boolean;
  isLoadingMarketing: boolean;
  isLoadingFunds: boolean;
};

export function useStreamingResult(sessionId: number | null, apiEndpoint: string) {
  const [state, setState] = useState<StreamingState>({
    conceptTitle: "",
    conceptDetail: "",
    storeStory: "",
    locationAdvice: "",
    hrAdvice: "",
    menuAdvice: "",
    marketingAdvice: "",
    fundsAdvice: "",
    isStreaming: false,
    streamingField: null,
    error: null,
    isLoadingLocation: true,
    isLoadingHR: true,
    isLoadingMenu: true,
    isLoadingMarketing: true,
    isLoadingFunds: true,
  });

  useEffect(() => {
    if (!sessionId) {
      console.log("[Streaming] No session_id provided");
      return;
    }

    const streamUrl = `${apiEndpoint}/simulations/simple/result-stream?session_id=${sessionId}`;
    console.log("[Streaming] Starting stream from:", streamUrl);
    console.log("[Streaming] Session ID:", sessionId);
    console.log("[Streaming] API Endpoint:", apiEndpoint);

    const eventSource = new EventSource(streamUrl);

    setState((prev) => ({ ...prev, isStreaming: true, error: null }));

    // 接続成功時のログ
    eventSource.onopen = () => {
      console.log("[Streaming] Connection opened successfully");
    };

    eventSource.addEventListener("concept_title_delta", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[Streaming] Received title delta:", data.delta);
        setState((prev) => ({
          ...prev,
          conceptTitle: prev.conceptTitle + (data.delta || ""),
          streamingField: "title",
        }));
      } catch (err) {
        console.error("Failed to parse concept_title_delta:", err);
      }
    });

    eventSource.addEventListener("concept_detail_delta", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[Streaming] Received detail delta:", data.delta);
        setState((prev) => ({
          ...prev,
          conceptDetail: prev.conceptDetail + (data.delta || ""),
          streamingField: "detail",
        }));
      } catch (err) {
        console.error("Failed to parse concept_detail_delta:", err);
      }
    });

    eventSource.addEventListener("store_story_delta", (e) => {
      try {
        const data = JSON.parse(e.data);
        setState((prev) => ({
          ...prev,
          storeStory: prev.storeStory + (data.delta || ""),
          streamingField: "story",
        }));
      } catch (err) {
        console.error("Failed to parse store_story_delta:", err);
      }
    });

    // 立地アドバイス
    eventSource.addEventListener("advice_location_delta", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[Streaming] Received location advice delta:", data.delta);
        console.log("[Streaming] Event data:", e.data);
        setState((prev) => ({
          ...prev,
          locationAdvice: prev.locationAdvice + (data.delta || ""),
          streamingField: "location",
          isLoadingLocation: false,
        }));
      } catch (err) {
        console.error("[Streaming] Failed to parse advice_location_delta:", err);
        console.error("[Streaming] Raw event data:", e.data);
      }
    });

    // 人材採用・オペレーション面アドバイス
    eventSource.addEventListener("advice_hr_delta", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[Streaming] Received HR advice delta:", data.delta);
        setState((prev) => ({
          ...prev,
          hrAdvice: prev.hrAdvice + (data.delta || ""),
          streamingField: "hr",
          isLoadingHR: false,
        }));
      } catch (err) {
        console.error("Failed to parse advice_hr_delta:", err);
      }
    });

    // メニューアドバイス
    eventSource.addEventListener("advice_menu_delta", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[Streaming] Received menu advice delta:", data.delta);
        setState((prev) => ({
          ...prev,
          menuAdvice: prev.menuAdvice + (data.delta || ""),
          streamingField: "menu",
          isLoadingMenu: false,
        }));
      } catch (err) {
        console.error("Failed to parse advice_menu_delta:", err);
      }
    });

    // 広告戦略アドバイス
    eventSource.addEventListener("advice_marketing_delta", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[Streaming] Received marketing advice delta:", data.delta);
        setState((prev) => ({
          ...prev,
          marketingAdvice: prev.marketingAdvice + (data.delta || ""),
          streamingField: "marketing",
          isLoadingMarketing: false,
        }));
      } catch (err) {
        console.error("Failed to parse advice_marketing_delta:", err);
      }
    });

    // 資金計画アドバイス
    eventSource.addEventListener("advice_funds_delta", (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("[Streaming] Received funds advice delta:", data.delta);
        setState((prev) => ({
          ...prev,
          fundsAdvice: prev.fundsAdvice + (data.delta || ""),
          streamingField: "funds",
          isLoadingFunds: false,
        }));
      } catch (err) {
        console.error("Failed to parse advice_funds_delta:", err);
      }
    });

    eventSource.addEventListener("done", () => {
      console.log("[Streaming] Stream completed");
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        streamingField: null,
        isLoadingLocation: false,
        isLoadingHR: false,
        isLoadingMenu: false,
        isLoadingMarketing: false,
        isLoadingFunds: false,
      }));
      eventSource.close();
    });

    eventSource.onerror = (error) => {
      console.error("[Streaming] Error occurred:", error);
      console.error("[Streaming] EventSource readyState:", eventSource.readyState);
      console.error("[Streaming] EventSource URL:", eventSource.url);

      // readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      const stateNames = ["CONNECTING", "OPEN", "CLOSED"];
      console.error("[Streaming] State:", stateNames[eventSource.readyState] || "UNKNOWN");

      // エラーの詳細を確認
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error("[Streaming] Connection was closed by the server");
      }

      setState((prev) => ({
        ...prev,
        isStreaming: false,
        streamingField: null,
        error: "AI生成中にエラーが発生しました。バックエンドAPIを確認してください。",
        isLoadingLocation: false,
        isLoadingHR: false,
        isLoadingMenu: false,
        isLoadingMarketing: false,
        isLoadingFunds: false,
      }));
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, apiEndpoint]);

  return state;
}
