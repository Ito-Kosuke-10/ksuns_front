"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { FileText, Loader2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api-client";
import { clearAccessToken } from "@/lib/auth-token";

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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Container className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Report</p>
          <h1 className="text-2xl font-semibold">事業計画書プレビュー</h1>
          <p className="text-sm text-slate-600">
            AIが生成した開業計画書を確認できます。「計画書を生成する」ボタンを押して、計画書を表示してください。
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex justify-start">
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                計画書を生成する
              </span>
            )}
          </Button>
        </div>

        {content && (
          <div className="flex justify-center">
            {/* A4用紙のような白いコンテナ（影付き） */}
            <div className="w-full max-w-4xl rounded-lg bg-white p-8 shadow-lg">
              {/* Markdownコンテンツ */}
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 text-3xl font-bold text-slate-900 border-b-2 border-slate-200 pb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-8 mb-4 text-2xl font-semibold text-slate-800 border-b border-slate-200 pb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-6 mb-3 text-xl font-semibold text-slate-700">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-base leading-7 text-slate-700">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 ml-6 list-disc space-y-2 text-slate-700">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 ml-6 list-decimal space-y-2 text-slate-700">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-base leading-7">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-slate-900">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-slate-700">{children}</em>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-slate-300 pl-4 italic text-slate-600">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-mono text-slate-800">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="mb-4 overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {!content && !loading && (
          <div className="flex justify-center">
            <div className="w-full max-w-4xl rounded-lg border-2 border-dashed border-slate-300 bg-white p-16 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <p className="text-slate-600">
                「計画書を生成する」ボタンを押して、開業計画書を表示してください。
              </p>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
