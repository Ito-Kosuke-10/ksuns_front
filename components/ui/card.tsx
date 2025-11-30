import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLElement>>;

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <section
      {...rest}
      className={clsx("rounded-2xl bg-white p-5 shadow-sm", className)}
    >
      {children}
    </section>
  );
}
