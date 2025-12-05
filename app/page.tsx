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
    <main
      id="home-root"
      className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900"
    >
      <Container id="home-container" className="flex justify-center">
        <Card
          id="home-main-card"
          className="flex w-full max-w-md flex-col gap-4 p-6 text-center"
        >
          <h1 className="text-xl font-semibold text-slate-900">おみせ開業AI</h1>
          <p className="text-sm text-slate-700">
            まず 12 問の簡単な質問に答えて、開業イメージを形にしていきましょう。
          </p>
          <Link
            id="home-start-simulation-link"
            href="/simple_simulation/questions/1"
            className={`${primaryButton} w-full`}
          >
            簡易シミュレーション
          </Link>
          <Link
            id="home-login-link"
            href="/login"
            className={`${secondaryButton} w-full`}
          >
            ログインする
          </Link>
        </Card>
      </Container>
    </main>
  );
}

