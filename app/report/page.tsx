"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, FileText, Loader2, Printer } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";
import { Header } from "@/app/components/Header";

type ReportResponse = {
  content: string;
};

export default function ReportPage() {
  const router = useRouter();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setContent(null);

    try {
      const { data, status } = await apiFetch<ReportResponse>("/api/report");
      
      if (status === 401) {
        clearAccessToken();
        router.replace("/login");
        return;
      }

      if (status >= 400) {
        setError(`計画書の取得に失敗しました。ステータス: ${status}`);
        return;
      }

      if (data?.content) {
        setContent(data.content);
      } else {
        setError("計画書の取得に失敗しました。時間をおいて再試行してください。");
      }
    } catch (err) {
      setError(`計画書の取得に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Report fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 print:bg-white">
      <div className="print:hidden">
        <Header />
      </div>
      <Container className="flex flex-col gap-6 py-6 sm:py-10 print:py-0">
        {/* ヘッダーエリア */}
        <div className="flex flex-col gap-4 print:hidden">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Report</p>
            <h1 className="text-2xl font-semibold text-gray-900">事業計画書プレビュー</h1>
            <p className="text-sm text-gray-600">
              AIが生成した開業計画書を確認できます。「計画書を生成する」ボタンを押して、計画書を表示してください。
            </p>
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                ダッシュボードに戻る
              </span>
            </Button>
            
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  AIが事業計画書を執筆中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  計画書を生成する
                </span>
              )}
            </Button>
            
            {content && (
              <Button
                onClick={handlePrint}
                variant="secondary"
                className="px-6 py-3"
              >
                <span className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  印刷 / PDF保存
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* 用紙エリア（A4用紙のような白いコンテナ） */}
        {content && (
          <div className="flex justify-center print:justify-start">
            <div className="w-full max-w-4xl rounded-lg bg-white p-12 shadow-xl print:shadow-none print:rounded-none print:p-8">
              {/* Markdownコンテンツ */}
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-8 border-b-2 border-gray-300 pb-4 text-center text-3xl font-bold text-gray-900">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-4 mt-8 border-l-4 border-blue-600 pl-3 text-xl font-semibold text-gray-800">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-3 mt-6 text-lg font-semibold text-gray-700">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-base leading-relaxed text-gray-700">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 ml-6 list-disc space-y-2 text-gray-700">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 ml-6 list-decimal space-y-2 text-gray-700">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-base leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-blue-700">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-700">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-gray-300 pl-4 italic text-gray-600">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-100 p-4 text-sm">
                        {children}
                      </pre>
                    ),
                    hr: () => (
                      <hr className="my-8 border-t-2 border-gray-200" />
                    ),
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left font-semibold text-gray-800">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-4 py-2 text-gray-700">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* 空状態 */}
        {!content && !loading && (
          <div className="flex justify-center">
            <div className="w-full max-w-4xl rounded-lg border-2 border-dashed border-gray-300 bg-white p-16 text-center shadow-sm">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">
                「計画書を生成する」ボタンを押して、開業計画書を表示してください。
              </p>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
