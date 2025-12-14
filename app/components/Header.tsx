"use client";

import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-20 lg:h-20 py-2">
          {/* Logo - リンク付き（左端に配置） */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="relative h-10 w-28 sm:h-12 sm:w-36 md:h-14 md:w-44">
              <Image
                alt="おみせ開業AIロゴ"
                src="/images/logo-v2.png"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* トップページに戻るボタン */}
          <Link
            href="/"
            className="flex items-center gap-2 text-[#234a96] text-sm md:text-base font-medium hover:text-[#436eae] transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">トップページ</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
