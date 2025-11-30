import clsx from "clsx";
import type { PropsWithChildren } from "react";

type AlertProps = PropsWithChildren<{
  variant?: "info" | "error";
  className?: string;
}>;

export function Alert({ variant = "info", className, children }: AlertProps) {
  const styles =
    variant === "error"
      ? "bg-rose-50 text-rose-700 border border-rose-100"
      : "bg-sky-50 text-sky-800 border border-sky-100";
  return <div className={clsx("rounded-2xl p-4 text-sm", styles, className)}>{children}</div>;
}
