"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "../components/Header";
import { apiFetch } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthUrl = async () => {
      try {
        setLoading(true);
        const { data } = await apiFetch<{ auth_url: string }>("/auth/google/url?allow_create=false");
        if (data?.auth_url) {
          setAuthUrl(data.auth_url);
          // Google認証URLに自動リダイレクト
          window.location.href = data.auth_url;
        } else {
          setError("認証URLの取得に失敗しました");
          setLoading(false);
        }
      } catch (err) {
        setError("認証URLの取得に失敗しました");
        setLoading(false);
      }
    };
    loadAuthUrl();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] flex flex-col">
      <Header />

      <main className="container mx-auto px-4 lg:px-8 py-12 flex-1">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
          {loading ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#234a96] mb-4"></div>
              <h2 className="text-xl font-semibold text-[#234a96] mb-2">
                Google認証に移動中...
              </h2>
              <p className="text-sm text-gray-600">
                しばらくお待ちください
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                エラーが発生しました
              </h2>
              <p className="text-sm text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="bg-[#234a96] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#436eae] transition-colors"
              >
                トップページに戻る
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-[#234a96] mb-4">
                ログイン
              </h2>
              {authUrl && (
                <a
                  href={authUrl}
                  className="inline-block bg-[#234a96] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#436eae] transition-colors"
                >
                  Googleでログイン
                </a>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#dee7ff] py-6 md:py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-12 w-full">
              {/* 開業AI Logo */}
              <div className="relative h-14 w-36 md:h-16 md:w-40">
                <Image
                  alt="おみせ開業AIロゴ"
                  src="/images/logo-v2.png"
                  fill
                  className="object-contain"
                />
              </div>
              {/* 経済産業省 Logo */}
              <div className="relative h-20 w-40 md:h-24 md:w-48">
                <Image
                  alt="経済産業省ロゴ"
                  src="/images/経済産業省.png"
                  fill
                  className="object-contain"
                />
              </div>
              {/* 中小企業庁 Logo */}
              <div className="relative h-20 w-36 md:h-24 md:w-40">
                <Image
                  alt="中小企業庁ロゴ"
                  src="/images/中小企業庁.png"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <p className="text-[#6c82a7] text-sm md:text-base font-bold">
              powerd by K&apos;suns
            </p>
            <p className="text-black text-xs">
              2025 © K&apos;suns
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
