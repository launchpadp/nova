import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Variant = "dashboard" | "launchpad" | "nova" | "assets" | "billing" | "settings" | "neutral";

const VARIANT_STYLES: Record<Variant, { ring: string; iconBg: string; iconText: string; mesh: string; eyebrow: string }> = {
  dashboard: {
    ring: "ring-primary/15",
    iconBg: "bg-gradient-to-br from-primary to-accent",
    iconText: "text-white",
    mesh: "bg-gradient-mesh-animated",
    eyebrow: "text-primary",
  },
  launchpad: {
    ring: "ring-primary/20",
    iconBg: "bg-gradient-to-br from-primary to-[#60a5fa]",
    iconText: "text-white",
    mesh: "bg-[radial-gradient(40rem_24rem_at_0%_0%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_60%)]",
    eyebrow: "text-primary",
  },
  nova: {
    ring: "ring-accent/20",
    iconBg: "bg-gradient-to-br from-accent to-[#a78bfa]",
    iconText: "text-white",
    mesh: "bg-[radial-gradient(40rem_24rem_at_100%_0%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_60%)]",
    eyebrow: "text-accent",
  },
  assets: {
    ring: "ring-orange/20",
    iconBg: "bg-gradient-to-br from-[var(--orange)] to-accent",
    iconText: "text-white",
    mesh: "bg-[radial-gradient(40rem_24rem_at_50%_0%,color-mix(in_oklab,var(--orange)_18%,transparent),transparent_60%)]",
    eyebrow: "text-orange",
  },
  billing: {
    ring: "ring-primary/15",
    iconBg: "bg-gradient-to-br from-foreground to-primary",
    iconText: "text-white",
    mesh: "bg-[radial-gradient(40rem_24rem_at_0%_100%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_60%)]",
    eyebrow: "text-primary",
  },
  settings: {
    ring: "ring-border",
    iconBg: "bg-surface-2",
    iconText: "text-muted-foreground",
    mesh: "",
    eyebrow: "text-muted-foreground",
  },
  neutral: {
    ring: "ring-border",
    iconBg: "bg-surface-2",
    iconText: "text-foreground",
    mesh: "",
    eyebrow: "text-muted-foreground",
  },
};

export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  variant = "neutral",
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: Variant;
  actions?: React.ReactNode;
  className?: string;
}) {
  const v = VARIANT_STYLES[variant];
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-surface ring-1 shadow-card",
        v.ring,
        className,
      )}
    >
      {v.mesh && <div className={cn("pointer-events-none absolute inset-0 opacity-90", v.mesh)} />}
      <div className="relative flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-card", v.iconBg, v.iconText)}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <div className={cn("text-[10.5px] font-semibold uppercase tracking-[0.14em]", v.eyebrow)}>
                {eyebrow}
              </div>
            )}
            <h1 className="mt-1 font-display text-[1.6rem] font-semibold tracking-tight md:text-[1.85rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-[13.5px] text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
