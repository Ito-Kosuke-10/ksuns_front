import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

const baseButton =
  "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60";
const primaryButton =
  baseButton +
  " bg-sky-600 text-white hover:bg-sky-700 px-5 py-3 shadow-sm focus-visible:ring-offset-1 focus-visible:ring-offset-white";
const secondaryButton =
  baseButton +
  " border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 px-5 py-3 shadow-sm";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
      <Container className="flex justify-center">
        <Card className="flex w-full max-w-md flex-col gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">飲食店開業シミュレーター</h1>
          <p className="text-sm text-slate-700">
            まずは12問の簡単な質問に答えて、開業イメージを形にしましょう。
          </p>
          <Link href="/simple_simulation/questions/1" className={`${primaryButton} w-full`}>
            簡易シミュレーションを始める
          </Link>
          <Link href="/login" className={`${secondaryButton} w-full`}>
            ログインする
          </Link>
        </Card>
      </Container>
    </main>
  );
}
