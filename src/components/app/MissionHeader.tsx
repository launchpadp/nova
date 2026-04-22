import { cn } from "@/lib/utils";

export function MissionHeader({
  label,
  title,
  description,
  actions,
  className,
}: {
  label: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 border-b border-border/60 pb-5", className)}>
      <div className="mission-title">MISSION: {label}</div>
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({
  variant,
  label,
  live = false,
}: {
  variant: "active" | "online" | "standby" | "locked" | "soon";
  label?: string;
  live?: boolean;
}) {
  const cls =
    variant === "active" || variant === "online"
      ? "status-active"
      : variant === "standby"
      ? "status-standby"
      : variant === "soon"
      ? "status-soon"
      : "status-locked";
  const text =
    label ??
    (variant === "active"
      ? "ACTIVE"
      : variant === "online"
      ? "ONLINE"
      : variant === "standby"
      ? "STANDBY"
      : variant === "soon"
      ? "COMING SOON"
      : "LOCKED");
  return (
    <span className={cn("status-badge", cls)}>
      <span className={cn("dot", live && "live")} />
      {text}
    </span>
  );
}

export function XpBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("xp-bar", className)}>
      <div className="xp-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function DifficultyBadge({ level }: { level: "Beginner" | "Intermediate" | "Advanced" }) {
  const tone =
    level === "Beginner"
      ? "border-success/40 text-success bg-success/10"
      : level === "Intermediate"
      ? "border-warning/40 text-warning bg-warning/10"
      : "border-launchpad/40 text-launchpad bg-launchpad/10";
  return (
    <span className={cn("inline-flex items-center rounded border px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.14em]", tone)}>
      {level}
    </span>
  );
}
