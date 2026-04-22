import { createFileRoute, Link } from "@tanstack/react-router";
import { MissionHeader, StatusBadge, DifficultyBadge } from "@/components/app/MissionHeader";
import { launchpadCatalog } from "@/lib/mock";
import {
  Lock, Rocket, Zap, Target, Megaphone, Settings2, Mail, Globe, Swords, Tags, LineChart,
  ArrowUpRight,
} from "lucide-react";
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
        label="Launchpad"
        title="AI tools for founders"
        description="Each tool generates a polished, ready-to-use asset for your business."
        actions={
          <Link
            to="/app/launchpad/history"
            className="text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            View history →
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
                "tactical-card relative h-full overflow-hidden rounded-xl border border-border bg-card p-5 shadow-soft",
                locked && "opacity-95",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    locked
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <StatusBadge variant={locked ? "soon" : "active"} live={!locked} />
              </div>

              <div className="mt-4">
                <div className="font-display text-[15px] font-semibold tracking-tight">
                  {tool.name}
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{tool.desc}</p>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <DifficultyBadge level={tool.difficulty} />
                {!locked && (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                    Open <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                )}
                {locked && (
                  <span className="text-[11.5px] text-muted-foreground">Scale plan</span>
                )}
              </div>
            </div>
          );

          return locked ? (
            <div
              key={tool.key}
              title="Available on the Scale plan"
              className="cursor-not-allowed"
            >
              {card}
            </div>
          ) : (
            <Link
              key={tool.key}
              to="/app/launchpad/$tool"
              params={{ tool: tool.key }}
              className="block"
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
