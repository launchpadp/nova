import { createFileRoute, Link } from "@tanstack/react-router";
import { MissionHeader, StatusBadge, DifficultyBadge } from "@/components/app/MissionHeader";
import { launchpadCatalog } from "@/lib/mock";
import { Lock, Rocket, Zap, Target, Megaphone, Settings2, Mail, Globe, Swords, Tags, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/launchpad/")({ component: LaunchpadOverview });

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "idea-validator": Zap,
  "pitch-generator": Megaphone,
  "gtm-strategy": Target,
  "offer": Rocket,
  "ops-plan": Settings2,
  "followup": Mail,
  "website-audit": Globe,
  "competitor": Swords,
  "pricing": Tags,
  "revenue-projector": LineChart,
};

function LaunchpadOverview() {
  return (
    <div className="space-y-7">
      <MissionHeader
        label="LAUNCHPAD"
        title="AI Tools Arsenal"
        description="Deploy AI specialists. Each mission generates a battle-ready asset for your operation."
        actions={
          <Link to="/app/launchpad/history" className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
            View History →
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {launchpadCatalog.map((tool) => {
          const Icon = ICONS[tool.key] ?? Rocket;
          const locked = !tool.wired;
          const card = (
            <div
              className={cn(
                "tactical-card scanlines relative h-full overflow-hidden rounded-xl border border-border bg-card p-5",
                locked && "opacity-90"
              )}
            >
              <div className="relative z-[2] flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg border",
                    locked
                      ? "border-muted-foreground/20 bg-muted/40 text-muted-foreground"
                      : "border-primary/30 bg-primary/10 text-primary"
                  )}
                >
                  {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <StatusBadge variant={locked ? "soon" : "active"} live={!locked} />
              </div>

              <div className="relative z-[2] mt-4">
                <div className="font-display text-base font-semibold tracking-tight">{tool.name}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{tool.desc}</p>
              </div>

              <div className="relative z-[2] mt-5 flex items-center justify-between">
                <DifficultyBadge level={tool.difficulty} />
                <span className="font-display text-[11px] font-bold tracking-[0.18em] text-primary-glow">
                  +{tool.xp} XP
                </span>
              </div>
            </div>
          );

          return locked ? (
            <div
              key={tool.key}
              title="Unlocks on the Scale plan"
              className="cursor-not-allowed"
            >
              {card}
            </div>
          ) : (
            <Link key={tool.key} to="/app/launchpad/$tool" params={{ tool: tool.key }} className="block">
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
