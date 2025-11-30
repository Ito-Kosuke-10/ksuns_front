
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";

const TERMS_URL = "#";
const PRIVACY_URL = "#";

export default function LoginPage() {
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, status } = await apiFetch<{ auth_url: string }>("/auth/google/url");
      if (data?.auth_url) {
        setAuthUrl(data.auth_url);
      } else {
        setError(
          status === 401
            ? "ログインには Google 認証が必要です。しばらく時間をおいて再試行してください。"
            : "ログインURLの取得に失敗しました。しばらく時間をおいて、もう一度お試しください。",
        );
      }
    };
    load().catch(() =>
      setError(
        "ログインURLの取得に失敗しました。しばらく時間をおいて、もう一度お試しください。",
      ),
    );
  }, []);

  const handleLogin = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="px-6 py-4 sm:px-8">
        <Container className="flex items-center justify-between">
          <span className="text-lg font-bold tracking-wide text-slate-900">KSUNS</span>
          <Link href="/" className="text-sm text-sky-700 hover:underline">
            トップへ戻る
          </Link>
        </Container>
      </header>
      <Container className="flex justify-center pb-12">
        <Card className="mt-4 flex w-full max-w-md flex-col gap-4 p-6">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-slate-900">ログインして開業計画を保存</h1>
            <p className="text-sm text-slate-700">
              ログイン後、マイページでさらに詳細な開業イメージを検討できます。
            </p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="button" className="w-full justify-center" disabled={!authUrl} onClick={handleLogin}>
            Googleでログインして続きへ
          </Button>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-600">
            <a href={TERMS_URL} className="hover:text-slate-900">
              利用規約
            </a>
            <span className="text-slate-300">|</span>
            <a href={PRIVACY_URL} className="hover:text-slate-900">
              プライバシーポリシー
            </a>
          </div>
        </Card>
      </Container>
    </main>
  );
}
