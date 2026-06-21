import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:bg-primary-dark",
        variant === "ghost" && "bg-slate-100 text-slate-700 hover:bg-slate-200",
        variant === "danger" && "bg-red-50 text-red-600 hover:bg-red-100",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rounded-2xl border border-slate-100 bg-white p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-red-600">{children}</p>;
}
