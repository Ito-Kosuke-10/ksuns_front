"use client";

import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";

type HeaderProps = {
  showBackButton?: boolean;
  backButtonHref?: string;
  backButtonLabel?: string;
};

export function Header({
  showBackButton = true,
  backButtonHref = "/dashboard",
  backButtonLabel = "マイページへ戻る",
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 py-2">
          {/* Logo - ダッシュボードへリンク */}
          <Link href="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="relative h-8 w-20 sm:h-9 sm:w-24 md:h-10 md:w-28">
              <Image
                alt="おみせ開業AIロゴ"
                src="/images/logo-v2.png"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* 戻るボタン */}
          {showBackButton && (
            <Link
              href={backButtonHref}
              className="flex items-center gap-2 text-[#234a96] text-sm md:text-base font-medium hover:text-[#436eae] transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">{backButtonLabel}</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
