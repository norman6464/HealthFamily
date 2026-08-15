import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  accentColor?: "primary" | "accent" | "ink";
  size?: "sm" | "md" | "lg";
  className?: string;
  rightAction?: React.ReactNode;
}

const ACCENT_CLASS: Record<NonNullable<SectionTitleProps["accentColor"]>, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  ink: "bg-ink-700",
};

const SIZE_CLASS: Record<NonNullable<SectionTitleProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  accentColor = "primary",
  size = "md",
  className = "",
  rightAction,
}) => {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h2 className={`flex items-center font-bold text-ink-800 ${SIZE_CLASS[size]}`}>
        <span className={`inline-block w-1 h-4 rounded-sm mr-2 ${ACCENT_CLASS[accentColor]}`} />
        {children}
      </h2>
      {rightAction}
    </div>
  );
};
