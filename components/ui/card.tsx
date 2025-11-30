import clsx from "clsx";
import type { PropsWithChildren } from "react";

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ className, children }: CardProps) {
  return (
    <section className={clsx("rounded-2xl bg-white p-5 shadow-sm", className)}>
      {children}
    </section>
  );
}
