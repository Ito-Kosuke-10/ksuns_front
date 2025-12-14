"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronRight, ChevronLeft } from 'lucide-react';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const steps = [
    {
      number: 1,
      title: 'お店のイメージや方向性を明確にする',
      description: '誰に喜んでもらいたいか、あるいは誰が求めているかを明確にすることで、お店の方向性が定まります。想定顧客との対話コンセプトをもとに、お店づくりのスタートが切れるようになります。',
      illustration: 'search-target'
    },
    {
      number: 2,
      title: 'ターゲット層のニーズや市場を把握する',
      description: 'ターゲット顧客が求めているものを深く理解し、市場調査を通じて競合分析を行います。',
      illustration: 'market-research'
    },
    {
      number: 3,
      title: 'お店の魅力・こだわりを言語化・可視化する',
      description: 'あなたのお店ならではの強みや特徴を明確にし、顧客に伝わる形で表現します。',
      illustration: 'branding'
    },
    {
      number: 4,
      title: '魅力的な立地・環境で収支・売上を試算する',
      description: '最適な立地を選定し、実際の収支計画を立てることで、事業の実現可能性を確認します。',
      illustration: 'financial'
    },
    {
      number: 5,
      title: '開業後も定期的に経営課題を発見する',
      description: '継続的な改善を行い、お店を成長させていくためのサポートを提供します。',
      illustration: 'improvement'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-white to-[#dae4ff]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <nav className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-20 gap-2">
            {/* Logo - 左端に配置 */}
            <div className="flex items-center -my-4 -ml-2 sm:-ml-4 lg:-ml-8 flex-shrink min-w-0">
              <div className="relative h-20 w-52 sm:h-24 sm:w-60 md:h-28 md:w-72 lg:h-32 lg:w-80">
                <Image
                  alt="おみせ開業AIロゴ"
                  src="/images/logo-v2.png"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-4 bg-white rounded-full shadow-[7px_7px_5px_0px_rgba(78,118,207,0.3)] px-6 py-3">
                <button className="text-[#234a96] text-sm font-medium hover:text-[#436eae] transition-colors whitespace-nowrap">
                  5つのSTEP
                </button>
                <button className="text-[#234a96] text-sm font-medium hover:text-[#436eae] transition-colors whitespace-nowrap">
                  選ばれる理由
                </button>
                <button className="text-[#234a96] text-sm font-medium hover:text-[#436eae] transition-colors whitespace-nowrap">
                  サービス
                </button>
                <button className="text-[#234a96] text-sm font-medium hover:text-[#436eae] transition-colors whitespace-nowrap">
                  よくある質問
                </button>
                <Link
                  href="/simple_simulation/questions/1"
                  className="bg-gradient-to-r from-[#f5a623] to-[#e89b1d] text-white px-6 py-2 rounded-full hover:shadow-lg transition-all hover:scale-105 whitespace-nowrap inline-flex items-center gap-1 text-sm"
                >
                  診断はこちらから
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="text-[#234a96] text-sm font-medium hover:text-[#436eae] transition-colors whitespace-nowrap border-2 border-[#234a96] px-5 py-1.5 rounded-full hover:bg-[#234a96] hover:text-white"
                >
                  ログイン
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button & Login */}
            <div className="lg:hidden flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link
                href="/login"
                className="bg-[#d5e5f5] text-[#234a96] text-xs sm:text-sm font-medium px-3 sm:px-5 py-2 rounded-full hover:bg-[#c0d8f0] transition-colors whitespace-nowrap inline-flex items-center justify-center"
              >
                ログイン
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#234a96] flex-shrink-0"
                aria-label="メニューを開く"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-t border-gray-200 py-4 space-y-3">
              <button className="block w-full text-left px-4 py-2 text-[#234a96] text-base font-medium hover:bg-gray-50">
                5つのSTEP
              </button>
              <button className="block w-full text-left px-4 py-2 text-[#234a96] text-base font-medium hover:bg-gray-50">
                選ばれる理由
              </button>
              <button className="block w-full text-left px-4 py-2 text-[#234a96] text-base font-medium hover:bg-gray-50">
                サービス
              </button>
              <button className="block w-full text-left px-4 py-2 text-[#234a96] text-base font-medium hover:bg-gray-50">
                よくある質問
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Mobile CTA Button - Sticky below header */}
      <div className="lg:hidden sticky top-20 z-40 bg-white/95 backdrop-blur-sm shadow-md py-3 px-4">
        <Link
          href="/simple_simulation/questions/1"
          className="w-full bg-gradient-to-r from-[#f5a623] to-[#e89b1d] text-white px-6 py-3 rounded-full inline-flex items-center justify-center gap-2 hover:shadow-lg transition-all"
        >
          診断はこちらから
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="relative py-12 md:py-16 lg:py-20 overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8">
            {/* Title */}
            <div className="text-center mb-12 md:mb-16 lg:mb-20">
              <h1 className="text-[#234a96] text-2xl md:text-3xl lg:text-[32px] font-bold tracking-wide">
                理想のお店づくりを実現！
              </h1>
            </div>

            {/* Two Circles with Text */}
            <div className="relative max-w-6xl mx-auto mb-16 md:mb-20">
              <div className="flex flex-col md:flex-row items-center justify-center gap-0 md:gap-0">
                {/* Blue Circle - Left */}
                <div className="relative w-full md:w-1/2 flex justify-center md:justify-end md:pr-8 lg:pr-12">
                  <div className="relative w-[300px] h-[300px] md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px]">
                    {/* Outer gradient circle */}
                    <div className="absolute inset-0">
                      <svg className="w-full h-full" viewBox="0 0 401 396" fill="none">
                        <ellipse cx="200.5" cy="197.997" rx="200.5" ry="197.997" fill="url(#gradient-blue)" />
                        <defs>
                          <linearGradient id="gradient-blue" x1="401" y1="198.607" x2="20.5792" y2="198.607" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#FAFEFF" />
                            <stop offset="1" stopColor="#8FBAEB" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    {/* Inner white circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[74%] h-[74%]">
                      <svg className="w-full h-full" viewBox="0 0 298 294" fill="none">
                        <ellipse cx="149" cy="147" rx="149" ry="147" fill="#F4F8FE" />
                      </svg>
                    </div>
                    {/* Text content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                      <h3 className="text-[#234a96] text-lg md:text-xl lg:text-2xl font-bold mb-3 tracking-wide">
                        開業への想いを形に
                      </h3>
                      <p className="text-[#234a96] text-xs md:text-sm lg:text-[15px] leading-relaxed tracking-wide">
                        自分のアイディア･経験･こだわりを整理
                        <br />
                        お店づくりの方向性を明確化
                      </p>
                    </div>
                  </div>
                </div>

                {/* Orange Circle - Right */}
                <div className="relative w-full md:w-1/2 flex justify-center md:justify-start md:pl-8 lg:pl-12 -mt-24 md:mt-0 md:-ml-32 lg:-ml-40">
                  <div className="relative w-[300px] h-[300px] md:w-[350px] md:h-[350px] lg:w-[400px] lg:h-[400px]">
                    {/* Outer gradient circle */}
                    <div className="absolute inset-0">
                      <svg className="w-full h-full" viewBox="0 0 401 396" fill="none">
                        <ellipse cx="200.5" cy="197.997" rx="200.5" ry="197.997" fill="url(#gradient-orange)" />
                        <defs>
                          <linearGradient id="gradient-orange" x1="19" y1="198" x2="376" y2="198" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#FEFDFA" />
                            <stop offset="1" stopColor="#FFD995" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    {/* Inner white circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[74%] h-[74%]">
                      <svg className="w-full h-full" viewBox="0 0 298 294" fill="none">
                        <ellipse cx="149" cy="147" rx="149" ry="147" fill="#F4F8FE" />
                      </svg>
                    </div>
                    {/* Text content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                      <h3 className="text-[#b57f00] text-lg md:text-xl lg:text-2xl font-bold mb-3 tracking-wide">
                        AIがプロ視点でサポート
                      </h3>
                      <p className="text-[#b57f00] text-xs md:text-sm lg:text-[15px] leading-relaxed tracking-wide">
                        蓄積されたデータから
                        <br />
                        コンセプト・収支・改善案を自動提案
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Title */}
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-[#234a96] text-xl md:text-2xl lg:text-[28px] font-bold mb-4 leading-relaxed tracking-wide">
                理想のお店が形になる開業サポートツールをご紹介
              </h2>
              <p className="text-[#234a96] text-sm md:text-base lg:text-[16px] leading-relaxed tracking-wide">
                理想の店舗をつくるためには「AIがこう言っている」だけでなく、「あなたの想いを深めること」が一番大事です。お店の強みや魅力を一緒にトータルサポートします。
              </p>
            </div>
          </div>
        </section>

        {/* Problems Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-12 max-w-5xl mx-auto">
              <h2 className="text-[#234a96] text-2xl md:text-3xl lg:text-[36px] font-bold mb-10 tracking-wide">
                こんなお悩みありませんか？
              </h2>

              {/* Person with Speech Bubbles - Mobile: Vertical Stack, Desktop: Around Person */}
              <div className="block md:hidden space-y-6 mb-8">
                {/* Mobile Layout - Vertical */}
                <div className="bg-[#ffecc7] rounded-[30px] px-6 py-4 shadow-lg mx-auto max-w-sm">
                  <p className="text-[#1d3d72] text-sm font-bold text-center">
                    何から開業準備を始めればいいか分からない
                  </p>
                </div>

                <div className="bg-[#ffecc7] rounded-[30px] px-6 py-4 shadow-lg mx-auto max-w-sm">
                  <p className="text-[#1d3d72] text-sm font-bold text-center">
                    お店のコンセプトがうまくまとまらない
                  </p>
                </div>

                <div className="relative z-10 flex justify-center my-8">
                  <Image
                    src="/images/困る画像.png"
                    alt="困っているビジネスマン"
                    width={200}
                    height={200}
                    className="w-40 h-40 object-contain"
                    priority
                  />
                </div>

                <div className="bg-[#d5e5f5] rounded-[30px] px-6 py-4 shadow-lg mx-auto max-w-sm">
                  <p className="text-[#1d3d72] text-sm font-bold text-center">
                    集客できるお店づくりのポイントが分からない…
                  </p>
                </div>

                <div className="bg-[#d5e5f5] rounded-[30px] px-6 py-4 shadow-lg mx-auto max-w-sm">
                  <p className="text-[#1d3d72] text-sm font-bold text-center">
                    ライバル店との差別化ができない…
                  </p>
                </div>

                <div className="bg-[#d5e5f5] rounded-[30px] px-6 py-4 shadow-lg mx-auto max-w-sm">
                  <p className="text-[#1d3d72] text-sm font-bold text-center">
                    開業資金の準備や融資について不安…
                  </p>
                </div>
              </div>

              {/* Desktop Layout - Around Person */}
              <div className="hidden md:block">
                <div className="relative flex justify-center items-center h-[600px] lg:h-[650px] mb-8 max-w-5xl mx-auto">
                  {/* Center Person Illustration */}
                  <div className="relative z-10">
                    <Image
                      src="/images/困る画像.png"
                      alt="困っているビジネスマン"
                      width={280}
                      height={280}
                      className="w-56 h-56 lg:w-64 lg:h-64 object-contain"
                      priority
                    />
                  </div>

                  {/* Speech Bubble 1 - Top */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 lg:w-72 z-0">
                    <div className="relative bg-[#ffecc7] rounded-[30px_30px_30px_10px] px-5 py-3 shadow-lg">
                      <p className="text-[#1d3d72] text-xs lg:text-sm font-bold text-center">
                        何から開業準備を始めればいいか分からない
                      </p>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-[#ffecc7]"></div>
                    </div>
                  </div>

                  {/* Speech Bubble 2 - Top Right */}
                  <div className="absolute top-20 right-8 lg:right-12 w-56 lg:w-64 z-0">
                    <div className="relative bg-[#d5e5f5] rounded-[30px_30px_10px_30px] px-5 py-3 shadow-lg">
                      <p className="text-[#1d3d72] text-xs lg:text-sm font-bold text-center">
                        集客できるお店づくりのポイントが分からない…
                      </p>
                      <div className="absolute -bottom-3 left-6 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-[#d5e5f5]"></div>
                    </div>
                  </div>

                  {/* Speech Bubble 3 - Top Left */}
                  <div className="absolute top-20 left-8 lg:left-12 w-52 lg:w-60 z-0">
                    <div className="relative bg-[#ffecc7] rounded-[30px_30px_30px_10px] px-5 py-3 shadow-lg">
                      <p className="text-[#1d3d72] text-xs lg:text-sm font-bold text-center">
                        お店のコンセプトがうまくまとまらない
                      </p>
                      <div className="absolute -bottom-3 right-6 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[15px] border-t-[#ffecc7]"></div>
                    </div>
                  </div>

                  {/* Speech Bubble 4 - Bottom Left */}
                  <div className="absolute bottom-16 left-8 lg:left-16 w-52 lg:w-60 z-0">
                    <div className="relative bg-[#d5e5f5] rounded-[30px_10px_30px_30px] px-5 py-3 shadow-lg">
                      <p className="text-[#1d3d72] text-xs lg:text-sm font-bold text-center">
                        ライバル店との差別化ができない…
                      </p>
                      <div className="absolute -top-3 right-6 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[15px] border-b-[#d5e5f5]"></div>
                    </div>
                  </div>

                  {/* Speech Bubble 5 - Bottom Right */}
                  <div className="absolute bottom-16 right-8 lg:right-16 w-52 lg:w-60 z-0">
                    <div className="relative bg-[#d5e5f5] rounded-[10px_30px_30px_30px] px-5 py-3 shadow-lg">
                      <p className="text-[#1d3d72] text-xs lg:text-sm font-bold text-center">
                        開業資金の準備や融資について不安…
                      </p>
                      <div className="absolute -top-3 left-6 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[15px] border-b-[#d5e5f5]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-[#f7f1eb]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-[#234a96] text-xl md:text-2xl lg:text-[28px] font-bold mb-2">
                  開業準備を成功に導く
                </h2>
                <div className="text-[#436eae] text-3xl md:text-4xl lg:text-[48px] font-bold">
                  5つのStep
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Steps List */}
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.number} className="relative">
                      {/* Connector Line */}
                      {index > 0 && (
                        <div className="absolute left-[18px] top-[-12px] w-[3px] h-[12px]">
                          <svg width="3" height="12" viewBox="0 0 3 12" fill="none">
                            <circle cx="1.5" cy="1.5" r="1.5" fill="#1D3D72" />
                            <line x1="1.5" y1="3" x2="1.5" y2="12" stroke="#1D3D72" strokeWidth="3" />
                          </svg>
                        </div>
                      )}

                      <button
                        onClick={() => setCurrentStep(step.number)}
                        className={`w-full ${
                          step.number === 1 ? 'bg-[#e0eaff]' : 'bg-white'
                        } rounded-[40px] p-5 md:p-6 shadow-md hover:shadow-lg transition-all flex items-center group`}
                      >
                        {/* Step Number */}
                        <div
                          className={`${
                            step.number === 1
                              ? 'bg-[#1d3d72] text-white'
                              : 'bg-[#e0eaff] text-[#1d3d72]'
                          } w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0`}
                        >
                          {step.number}
                        </div>

                        {/* Step Title */}
                        <div className="flex-1 text-left text-[#1d3d72] text-base md:text-lg font-medium pr-4">
                          {step.title}
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-5 h-5 text-[#1d3d72] flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Step Detail Card */}
                <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-10 sticky top-24 h-fit">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-[#1d3d72] text-white px-5 py-2 rounded-full font-bold">
                      Step{currentStep}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                        disabled={currentStep === 1}
                        className="w-10 h-10 rounded-full bg-[#e0eaff] flex items-center justify-center hover:bg-[#d0daef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5 text-[#1d3d72]" />
                      </button>
                      <button
                        onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                        disabled={currentStep === 5}
                        className="w-10 h-10 rounded-full bg-[#e0eaff] flex items-center justify-center hover:bg-[#d0daef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5 text-[#1d3d72]" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-[#234a96] text-xl md:text-2xl font-bold mb-6 text-center leading-relaxed">
                    {steps[currentStep - 1].title}
                  </h3>

                  {/* Illustration Area */}
                  <div className="bg-[#f4f8fe] rounded-2xl p-8 mb-6 min-h-[200px] flex items-center justify-center">
                    <div className="w-full max-w-md mx-auto">
                      {currentStep === 1 && (
                        <Image
                          src="/images/Step1目標.jpeg"
                          alt="目標設定のイメージ"
                          width={500}
                          height={333}
                          className="w-full h-auto rounded-lg object-cover"
                        />
                      )}
                      {currentStep === 2 && (
                        <Image
                          src="/images/Step2調査.jpeg"
                          alt="市場調査のイメージ"
                          width={500}
                          height={333}
                          className="w-full h-auto rounded-lg object-cover"
                        />
                      )}
                      {currentStep === 3 && (
                        <Image
                          src="/images/Step3可視化.jpeg"
                          alt="データ可視化のイメージ"
                          width={500}
                          height={333}
                          className="w-full h-auto rounded-lg object-cover"
                        />
                      )}
                      {currentStep === 4 && (
                        <Image
                          src="/images/Step4計画.png"
                          alt="事業計画のイメージ"
                          width={500}
                          height={281}
                          className="w-full h-auto rounded-lg object-cover"
                        />
                      )}
                      {currentStep === 5 && (
                        <Image
                          src="/images/Step5課題.png"
                          alt="課題発見のイメージ"
                          width={500}
                          height={333}
                          className="w-full h-auto rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </div>

                  <p className="text-[#234a96] text-sm md:text-base leading-relaxed tracking-wide">
                    {steps[currentStep - 1].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 md:py-20 lg:py-24 bg-[#1d3d72] overflow-hidden">
          {/* Background decorative circles */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#ffcb8a] rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#96c0ea] rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-white text-2xl md:text-3xl lg:text-[40px] font-bold mb-6 md:mb-8 tracking-wide">
                まずは30秒で初期診断を！
              </h2>
              <p className="text-white/90 text-base md:text-lg mb-10 md:mb-12 tracking-wide">
                AIの知見と創業のこだわりが融合し、あなただけのお店が見つかります
              </p>
              <Link
                href="/simple_simulation/questions/1"
                className="bg-gradient-to-r from-[#f5a623] to-[#e89b1d] text-white px-12 py-4 md:px-16 md:py-5 rounded-full text-lg md:text-xl font-bold hover:shadow-2xl transition-all hover:scale-105 inline-flex items-center gap-3"
              >
                診断はこちらから
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#dee7ff] py-8 md:py-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logos Row - Text sizes normalized */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-12 w-full">
              {/* 開業AI Logo */}
              <div className="relative h-16 w-40 md:h-20 md:w-52">
                <Image
                  alt="おみせ開業AIロゴ"
                  src="/images/logo-v2.png"
                  fill
                  className="object-contain"
                />
              </div>

              {/* 経済産業省 Logo */}
              <div className="relative h-24 w-48 md:h-28 md:w-56">
                <Image
                  alt="経済産業省ロゴ"
                  src="/images/経済産業省.png"
                  fill
                  className="object-contain"
                />
              </div>

              {/* 中小企業庁 Logo */}
              <div className="relative h-24 w-40 md:h-28 md:w-44">
                <Image
                  alt="中小企業庁ロゴ"
                  src="/images/中小企業庁.png"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Powered by */}
            <p className="text-[#6c82a7] text-base md:text-lg font-bold">
              powerd by K&apos;suns
            </p>

            {/* Copyright */}
            <p className="text-black text-sm">
              2025 © K&apos;suns
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
