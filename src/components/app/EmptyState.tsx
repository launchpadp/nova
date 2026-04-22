import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "card",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "card" | "inline";
}) {
  return (
    <div
      className={cn(
        variant === "card" &&
          "rounded-xl border border-dashed border-border bg-surface/40 p-10",
        "flex flex-col items-center text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-[15px] font-semibold tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
