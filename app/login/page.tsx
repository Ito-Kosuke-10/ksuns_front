"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-token";

const TERMS_URL = "#";
const PRIVACY_URL = "#";

export default function LoginPage() {
  const router = useRouter();
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const { status } = await apiFetch("/dashboard");
          if (status === 200) {
            router.replace("/dashboard");
            return;
          }
        }

        const params = new URLSearchParams(window.location.search);
        if (params.get("error") === "signup_not_allowed") {
          setError("既存ユーザー専用のログインです。簡易シミュレーションからマイページを作成してください。");
          router.replace("/simple_simulation/questions/1");
          return;
        }

        const { data, status } = await apiFetch<{ auth_url: string }>(
          "/auth/google/url?allow_create=false",
        );
        if (data?.auth_url) {
          setAuthUrl(data.auth_url);
        } else {
          setError(
            status === 401
              ? "ログインには Google 認証が必要です。しばらく時間をおいて再試行してください。"
              : "ログイン URL の取得に失敗しました。しばらく時間をおいて、もう一度お試しください。",
          );
        }
      } catch {
        setError(
          "ログイン URL の取得に失敗しました。しばらく時間をおいて、もう一度お試しください。",
        );
      }
    };

    bootstrap().catch(() => undefined);
  }, [router]);

  const handleLogin = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  return (
    <main id="login-root" className="min-h-screen bg-slate-50 text-slate-900">
      <header id="login-header" className="px-6 py-4 sm:px-8">
        <Container id="login-header-container" className="flex items-center justify-between">
          <span id="login-logo" className="text-lg font-bold tracking-wide text-slate-900">
            KSUNS
          </span>
          <Link
            id="login-back-to-top-link"
            href="/"
            className="text-sm text-sky-700 hover:underline"
          >
            トップへ戻る
          </Link>
        </Container>
      </header>
      <Container id="login-container" className="flex justify-center pb-12">
        <Card
          id="login-main-card"
          className="mt-4 flex w-full max-w-md flex-col gap-4 p-6"
        >
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-slate-900">
              ログインして開業計画を保存
            </h1>
            <p className="text-sm text-slate-700">
              既存ユーザー専用です。新規作成は簡易シミュレーションの結果ページから行ってください。
            </p>
          </div>

          {error && (
            <Alert id="login-error-alert" variant="error">
              {error}
            </Alert>
          )}

          <Button
            id="login-google-button"
            type="button"
            className="w-full justify-center"
            disabled={!authUrl}
            onClick={handleLogin}
          >
            Google でログインして続きへ
          </Button>

          <div
            id="login-footer-links"
            className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-600"
          >
            <a id="login-terms-link" href={TERMS_URL} className="hover:text-slate-900">
              利用規約
            </a>
            <span className="text-slate-300">|</span>
            <a id="login-privacy-link" href={PRIVACY_URL} className="hover:text-slate-900">
              プライバシーポリシー
            </a>
          </div>
        </Card>
      </Container>
    </main>
  );
}
