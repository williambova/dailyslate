import { cn } from "@/lib/cn";

/** The Daily Slate mark: a stacked "slate" glyph in lime. */
export function SlateMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[7px] bg-lime text-ink-950",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="none">
        <path
          d="M4 7h16M4 12h16M4 17h10"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const text = {
    sm: "text-[15px]",
    md: "text-lg",
    lg: "text-2xl",
  }[size];
  const mark = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }[size];
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <SlateMark className={mark} />
      <span
        className={cn(
          "font-extrabold uppercase tracking-[-0.02em] leading-none",
          text
        )}
      >
        Daily<span className="text-lime">Slate</span>
      </span>
    </span>
  );
}
