"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
  }
>;

const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-700 px-5 py-3 shadow-sm focus-visible:ring-offset-1 focus-visible:ring-offset-white",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50 px-5 py-3 shadow-sm",
  ghost:
    "text-slate-700 hover:bg-slate-100 px-4 py-2",
};

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
