"use client";

import Link from "next/link";
// 作成したコンポーネントをインポート
// export default function ChatAdvisor... で定義されているので、名前は何でもOKですが
// ここでは ChatComponent として読み込みます
import ChatComponent from "@/components/ui/free_chat";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
        
        {/* ヘッダーエリア（既存のデザインを流用） */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chat</p>
            <h1 className="text-2xl font-semibold">AI開業コーチ（何でも質問）</h1>
            <p className="text-sm text-slate-600 mt-1">
              現在の事業計画データを踏まえて、AIがアドバイスします。
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-sky-600 hover:underline hover:text-sky-700"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        {/* チャットエリア（ここをハリボテから実物に差し替え） */}
        <div className="w-full">
          <ChatComponent />
        </div>

      </div>
    </main>
  );
}