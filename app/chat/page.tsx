"use client";

// 作成したコンポーネントをインポート
// export default function ChatAdvisor... で定義されているので、名前は何でもOKですが
// ここでは ChatComponent として読み込みます
import ChatComponent from "@/components/ui/free_chat";
import { Header } from "@/app/components/Header";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] text-slate-900">
      <Header />
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:py-10">

        {/* ヘッダーエリア */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chat</p>
          <h1 className="text-2xl font-semibold">AI開業コーチ（何でも質問）</h1>
          <p className="text-sm text-slate-600 mt-1">
            現在の事業計画データを踏まえて、AIがアドバイスします。
          </p>
        </div>

        {/* チャットエリア */}
        <div className="w-full">
          <ChatComponent />
        </div>

      </div>
    </main>
  );
}