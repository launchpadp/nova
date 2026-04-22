import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  organizationQuery, subscriptionQuery, toolRunsQuery, usageQuery,
  planEntitlementsQuery, generatedAssetsQuery,
} from "@/lib/queries";
import {
  Sparkles, Rocket, Inbox, FolderOpen, Plus, ArrowRight, Activity,
  CheckCircle2, XCircle, Loader2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function greetingFor(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { currentOrgId, profile } = useAuth();

  const orgQ = useQuery({ ...organizationQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const subQ = useQuery({ ...subscriptionQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const runsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 5), enabled: !!currentOrgId });
  const allRunsQ = useQuery({ ...toolRunsQuery(currentOrgId ?? "", 100), enabled: !!currentOrgId });
  const usageQ = useQuery({ ...usageQuery(currentOrgId ?? ""), enabled: !!currentOrgId });
  const plansQ = useQuery(planEntitlementsQuery());
  const assetsQ = useQuery({ ...generatedAssetsQuery(currentOrgId ?? ""), enabled: !!currentOrgId });

  if (!currentOrgId) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary glow-primary">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Finish onboarding to set up your workspace.</p>
        <Link to="/onboarding"><Button className="mt-5">Start onboarding</Button></Link>
      </div>
    );
  }

  const org = orgQ.data;
  const sub = subQ.data;
  const recentRuns = runsQ.data ?? [];
  const allRuns = allRunsQ.data ?? [];
  const usage = usageQ.data ?? [];
  const assets = assetsQ.data ?? [];

  const totalUsed = usage.reduce((s, r) => s + (r.count as number), 0);
  const limit = plansQ.data?.find((p) => p.plan === sub?.plan)?.monthly_generation_limit ?? null;
  const usagePct = limit ? Math.min(100, Math.round((totalUsed / limit) * 100)) : 0;

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const planLabel = sub?.plan ?? "starter";

  // KPIs — assets count, runs count, leads not yet implemented
  const kpis = [
    { label: "AI Generations", value: totalUsed, sub: limit ? `of ${limit}` : "this month", icon: Zap, accent: "from-primary to-primary-glow" },
    { label: "Tools Run", value: allRuns.length, sub: "all time", icon: Rocket, accent: "from-launchpad to-primary" },
    { label: "Leads Captured", value: 0, sub: "coming soon", icon: Inbox, accent: "from-nova to-primary" },
    { label: "Assets Created", value: assets.length, sub: "saved", icon: FolderOpen, accent: "from-primary-glow to-launchpad" },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome banner ── */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-soft md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="capitalize">{planLabel} plan</span>
              </span>
              {org?.stage && (
                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Stage · {org.stage}
                </span>
              )}
            </div>
            <h2 className="mt-4 font-display text-[1.7rem] font-semibold tracking-tight md:text-[2rem]">
              {greetingFor()}, {firstName}
            </h2>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {org?.name ? `${org.name} · ` : ""}Here's what's happening across your business today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/app/launchpad">
              <Button className="gap-2">
                <Sparkles className="h-4 w-4" /> Run a tool
              </Button>
            </Link>
            <Link to="/app/leads">
              <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add lead</Button>
            </Link>
            <Link to="/app/assets">
              <Button variant="ghost" className="gap-2"><FolderOpen className="h-4 w-4" /> View assets</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── KPI Row ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-card p-5 shadow-soft transition hover:border-foreground/15"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11.5px] font-medium text-muted-foreground">{k.label}</div>
                <div className="mt-2 font-display text-[1.8rem] font-semibold tracking-tight leading-none">{k.value}</div>
                <div className="mt-2 text-[11.5px] text-muted-foreground">{k.sub}</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <k.icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Usage + Activity ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Usage */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-[11.5px] font-medium text-muted-foreground">Monthly usage</div>
            <Link to="/app/billing" className="text-[11.5px] text-muted-foreground hover:text-foreground">Manage</Link>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-display text-[1.8rem] font-semibold leading-none">{totalUsed}</span>
            <span className="pb-1 text-sm text-muted-foreground">/ {limit ?? "∞"}</span>
          </div>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${limit ? usagePct : 8}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>{limit ? `${usagePct}% of plan` : "Unlimited"}</span>
            <span className="capitalize">{planLabel}</span>
          </div>
          {limit && usagePct >= 80 && (
            <Link to="/app/billing" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Upgrade plan <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="text-[11.5px] font-medium text-muted-foreground">Recent activity</div>
            </div>
            <Link to="/app/launchpad/history" className="text-[11.5px] text-muted-foreground hover:text-foreground">View all</Link>
          </div>

          {recentRuns.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="mt-3 text-sm font-medium">No activity yet</div>
              <div className="mt-1 text-xs text-muted-foreground">Run your first AI tool to see activity here.</div>
              <Link to="/app/launchpad"><Button size="sm" className="mt-4 gap-2"><Rocket className="h-3.5 w-3.5" /> Open Launchpad</Button></Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {recentRuns.map((r) => {
                const Icon = r.status === "succeeded" ? CheckCircle2 : r.status === "failed" ? XCircle : Loader2;
                const tone = r.status === "succeeded" ? "text-success" : r.status === "failed" ? "text-destructive" : "text-muted-foreground";
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted", tone)}>
                        <Icon className={cn("h-4 w-4", r.status === "running" && "animate-spin")} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium capitalize">{r.tool_key.replace(/-/g, " ")}</div>
                        <div className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                      r.status === "succeeded" && "bg-success/15 text-success",
                      r.status === "failed" && "bg-destructive/15 text-destructive",
                      r.status === "running" && "bg-muted text-muted-foreground",
                    )}>{r.status}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
