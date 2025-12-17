import type { Metadata } from "next";
import { Geist, Geist_Mono, Yomogi } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const yomogi = Yomogi({
  variable: "--font-yomogi",
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Simple Simulation",
  description: "Answer 12 questions to run a quick restaurant simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${yomogi.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
