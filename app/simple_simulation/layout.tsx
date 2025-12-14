'use client';

import Image from "next/image";
import { AnswerProvider } from "./state/answer-context";
import { Header } from "../components/Header";

export default function SimulationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnswerProvider>
      <div className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff] text-slate-900 flex flex-col">
        <Header />
        <div className="mx-auto flex flex-1 max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
        {/* Footer */}
        <footer className="bg-[#dee7ff] py-6 md:py-8">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-12 w-full">
                {/* 開業AI Logo */}
                <div className="relative h-7 w-20 md:h-8 md:w-24">
                  <Image
                    alt="おみせ開業AIロゴ"
                    src="/images/logo-v2.png"
                    fill
                    className="object-contain"
                  />
                </div>
                {/* 経済産業省 Logo */}
                <div className="relative h-6 w-16 md:h-7 md:w-20">
                  <Image
                    alt="経済産業省ロゴ"
                    src="/images/経済産業省.png"
                    fill
                    className="object-contain"
                  />
                </div>
                {/* 中小企業庁 Logo */}
                <div className="relative h-6 w-12 md:h-7 md:w-16">
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
    </AnswerProvider>
  );
}
