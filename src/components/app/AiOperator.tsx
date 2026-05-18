import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, ArrowRight, Rocket, Zap, KanbanSquare, Inbox, Workflow,
  UserCheck, BarChart3, Settings as SettingsIcon, CreditCard, FileText,
  History, Lightbulb, Target, Mail, Megaphone, ScrollText, Globe,
  CornerDownLeft, Skull, Trophy, GitCompare, Layout, TrendingUp,
  DollarSign, Users, Search, Bot, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toolRunsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { parseOperatorIntent } from "@/lib/operatorIntent";

// ─── Types ────────────────────────────────────────────────────────────────────

type Group = "Action" | "Recent" | "Tool" | "Page";

type Item = {
  id: string;
  group: Group;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  toolSlug?: string;
  search?: { context?: string; title?: string };
  match: RegExp;
  badge?: string;
};

type AssetResult = {
  id: string;
  title: string | null;
  category: string | null;
  created_at: string;
};

// ─── Tool → slug map (all 17) ─────────────────────────────────────────────────

const TOOL_KEY_TO_SLUG: Record<string, string> = {
  "validate-idea":              "idea-validator",
  "generate-pitch":             "pitch-generator",
  "generate-gtm-strategy":      "gtm-strategy",
  "generate-offer":             "offer",
  "generate-ops-plan":          "ops-plan",
  "generate-followup-sequence": "followup",
  "analyze-website":            "website-audit",
  "kill-my-idea":               "kill-my-idea",
  "funding-score":              "funding-score",
  "first-10-customers":         "first-10-customers",
  "business-plan":              "business-plan",
  "investor-emails":            "investor-emails",
  "idea-vs-idea":               "idea-vs-idea",
  "landing-page":               "landing-page",
  "competitor-analysis":        "competitor",
  "pricing-strategy":           "pricing",
  "revenue-projector":          "revenue-projector",
};

function prettyToolName(toolKey: string): string {
  const slug = TOOL_KEY_TO_SLUG[toolKey] ?? toolKey;
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Static data ─────────────────────────────────────────────────────────────

const STATIC_TOOLS: Item[] = [
  { id: "t-validate",   group: "Tool", label: "Idea Validator",       hint: "Pressure-test any startup idea",        icon: Lightbulb,   to: "/app/launchpad/$tool", toolSlug: "idea-validator",      match: /validat|idea|test/i },
  { id: "t-pitch",      group: "Tool", label: "Pitch Generator",      hint: "Investor-ready pitch deck",             icon: ScrollText,  to: "/app/launchpad/$tool", toolSlug: "pitch-generator",     match: /pitch|deck|investor/i },
  { id: "t-gtm",        group: "Tool", label: "GTM Strategy",         hint: "Channels, ICP, messaging playbook",     icon: Target,      to: "/app/launchpad/$tool", toolSlug: "gtm-strategy",        match: /gtm|go-?to-?market|strategy|channel/i },
  { id: "t-offer",      group: "Tool", label: "Offer Builder",        hint: "Craft an irresistible offer",           icon: Megaphone,   to: "/app/launchpad/$tool", toolSlug: "offer",               match: /offer|package/i },
  { id: "t-ops",        group: "Tool", label: "Ops Plan",             hint: "Workflows, automations, KPIs",          icon: Workflow,    to: "/app/launchpad/$tool", toolSlug: "ops-plan",            match: /ops|operat|automat/i },
  { id: "t-followup",   group: "Tool", label: "Follow-Up Sequence",   hint: "Multi-touch email sequences",           icon: Mail,        to: "/app/launchpad/$tool", toolSlug: "followup",            match: /follow|sequence|email/i },
  { id: "t-audit",      group: "Tool", label: "Website Auditor",      hint: "Live site SEO & conversion audit",      icon: Globe,       to: "/app/launchpad/$tool", toolSlug: "website-audit",       match: /website|audit|seo|site/i },
  { id: "t-kill",       group: "Tool", label: "Kill My Idea",         hint: "Devil's advocate — stress test hard",   icon: Skull,       to: "/app/launchpad/$tool", toolSlug: "kill-my-idea",        match: /kill|devil|destroy|weak/i },
  { id: "t-funding",    group: "Tool", label: "Funding Score",        hint: "Rate your fundraising readiness",       icon: Trophy,      to: "/app/launchpad/$tool", toolSlug: "funding-score",       match: /fund|raise|investor score|vc/i },
  { id: "t-first10",    group: "Tool", label: "First 10 Customers",   hint: "Acquisition roadmap for launch",        icon: Users,       to: "/app/launchpad/$tool", toolSlug: "first-10-customers",  match: /first|10|customers|acquisition/i },
  { id: "t-bizplan",    group: "Tool", label: "Business Plan",        hint: "Full structured business plan",         icon: FileText,    to: "/app/launchpad/$tool", toolSlug: "business-plan",       match: /business plan|biz plan/i },
  { id: "t-inv-email",  group: "Tool", label: "Investor Emails",      hint: "Cold outreach sequences for VCs",       icon: Mail,        to: "/app/launchpad/$tool", toolSlug: "investor-emails",     match: /investor email|cold email|outreach/i },
  { id: "t-ideavsidea", group: "Tool", label: "Idea vs Idea",         hint: "Compare two startup concepts head-on",  icon: GitCompare,  to: "/app/launchpad/$tool", toolSlug: "idea-vs-idea",        match: /vs|compare|versus/i },
  { id: "t-landing",    group: "Tool", label: "Landing Page",         hint: "Copy & structure for your landing page",icon: Layout,      to: "/app/launchpad/$tool", toolSlug: "landing-page",        match: /landing|homepage|copy/i },
  { id: "t-competitor", group: "Tool", label: "Competitor Analysis",  hint: "Map your competitive landscape",        icon: Search,      to: "/app/launchpad/$tool", toolSlug: "competitor",          match: /compet|rival|market map/i },
  { id: "t-pricing",    group: "Tool", label: "Pricing Strategy",     hint: "Tiers, positioning, anchoring",         icon: DollarSign,  to: "/app/launchpad/$tool", toolSlug: "pricing",             match: /pric|monetiz|tier/i },
  { id: "t-revenue",    group: "Tool", label: "Revenue Projector",    hint: "MRR/ARR forecast model",                icon: TrendingUp,  to: "/app/launchpad/$tool", toolSlug: "revenue-projector",   match: /revenue|projec|mrr|arr|forecast/i },
];

const QUICK_ACTIONS: Item[] = [
  { id: "qa-dashboard", group: "Action", label: "Dashboard",          hint: "Go to home",              icon: Rocket,         to: "/app/dashboard",        match: /dashboard|home/i },
  { id: "qa-launchpad", group: "Action", label: "Launchpad",          hint: "All AI tools",            icon: Zap,            to: "/app/launchpad",        match: /launchpad|tools/i },
  { id: "qa-history",   group: "Action", label: "Run History",        hint: "Past tool outputs",       icon: History,        to: "/app/launchpad/history",match: /history|past|runs/i },
  { id: "qa-assets",    group: "Action", label: "Assets Library",     hint: "Saved outputs",           icon: FileText,       to: "/app/assets",           match: /asset|library|outputs/i },
  { id: "qa-crm",       group: "Action", label: "CRM Pipeline",       hint: "Deal kanban",             icon: KanbanSquare,   to: "/app/nova/crm",         match: /crm|pipeline|deals/i },
  { id: "qa-leads",     group: "Action", label: "Lead Capture",       hint: "Inbound leads",           icon: Inbox,          to: "/app/nova/leads",       match: /lead|inbound/i },
  { id: "qa-billing",   group: "Action", label: "Billing & Plans",    hint: "Upgrade or manage plan",  icon: CreditCard,     to: "/app/billing",          badge: "Upgrade", match: /billing|plan|upgrade|invoice/i },
  { id: "qa-settings",  group: "Action", label: "Settings",           hint: "Account & integrations",  icon: SettingsIcon,   to: "/app/settings",         match: /settings|account|integrat/i },
  { id: "qa-reports",   group: "Action", label: "Reporting",          hint: "Metrics & KPIs",          icon: BarChart3,      to: "/app/nova/reports",     match: /report|analytic|metric/i },
  { id: "qa-workflows", group: "Action", label: "Automations",        hint: "Workflow triggers",       icon: Workflow,       to: "/app/nova/workflows",   match: /automat|workflow/i },
  { id: "qa-clients",   group: "Action", label: "Client Onboarding",  hint: "Onboard clients",         icon: UserCheck,      to: "/app/nova/clients",     match: /client|onboard/i },
];

// ─── AI helpers ───────────────────────────────────────────────────────────────

const QUESTION_RE = /^(what|how|why|when|where|is|are|can|should|will|does|do|which|who|help|tell|explain|give|show|what's|whats)/i;

function looksLikeQuestion(q: string): boolean {
  const t = q.trim();
  return t.length >= 14 && QUESTION_RE.test(t) && !parseOperatorIntent(t);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiOperator({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ]               = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [aiAnswer, setAiAnswer]  = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [assetResults, setAssetResults] = useState<AssetResult[]>([]);

  const navigate   = useNavigate();
  const inputRef   = useRef<HTMLInputElement>(null);
  const listRef    = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  const { currentOrgId } = useAuth();

  const recentQ = useQuery({
    ...toolRunsQuery(currentOrgId ?? "", 8),
    enabled: !!currentOrgId && open,
  });

  // ── Keyword search against generated_assets ────────────────────────────────
  useEffect(() => {
    const term = q.trim();
    if (!term || term.length < 3 || !currentOrgId) { setAssetResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("generated_assets")
        .select("id, title, category, created_at")
        .eq("organization_id", currentOrgId)
        .ilike("title", `%${term}%`)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!cancelled && data) setAssetResults(data as AssetResult[]);
    }, 240);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, currentOrgId]);

  // ── Inline AI answer (streaming via Anthropic) ─────────────────────────────
  const streamAnswer = useCallback(async (question: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setAiAnswer("");
    setAiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
      if (!apiKey) return;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: ac.signal,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 220,
          stream: true,
          system:
            "You are Nova OS, a sharp AI advisor for startup founders. " +
            "Answer in 2–3 sentences. Be specific, actionable, no markdown or bullet points.",
          messages: [{ role: "user", content: question }],
        }),
      });
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw) as { type: string; delta?: { type: string; text?: string } };
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" && evt.delta.text) {
              setAiAnswer((prev) => prev + evt.delta!.text);
            }
          } catch { /* ignore malformed chunks */ }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!looksLikeQuestion(q)) {
      setAiAnswer("");
      setAiLoading(false);
      abortRef.current?.abort();
      return;
    }
    const t = setTimeout(() => void streamAnswer(q), 700);
    return () => clearTimeout(t);
  }, [q, streamAnswer]);

  // ── Result lists ───────────────────────────────────────────────────────────
  const term = q.trim();

  const dynamicAction = useMemo<Item | null>(() => {
    const intent = parseOperatorIntent(q);
    if (!intent) return null;
    return {
      id: "intent-" + intent.toolSlug,
      group: "Action",
      label: intent.label,
      hint: intent.hint,
      icon: Sparkles,
      to: "/app/launchpad/$tool",
      toolSlug: intent.toolSlug,
      search: intent.search,
      match: /.*/,
    };
  }, [q]);

  const recentItems = useMemo<Item[]>(() => {
    if (term) return [];
    const runs = recentQ.data ?? [];
    const seen = new Set<string>();
    const out: Item[] = [];
    for (const r of runs) {
      const slug = TOOL_KEY_TO_SLUG[r.tool_key];
      if (!slug) continue;
      const inp = (r.input as Record<string, unknown> | null) ?? {};
      const ctx =
        (typeof inp.context === "string" && inp.context) ||
        (typeof inp.idea === "string" && inp.idea) ||
        (typeof inp.business === "string" && inp.business) ||
        (typeof inp.url === "string" && inp.url) || "";
      const key = slug + ":" + ctx.slice(0, 30);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        id: "recent-" + r.id,
        group: "Recent",
        label: prettyToolName(r.tool_key),
        hint: ctx ? ctx.slice(0, 60) + (ctx.length > 60 ? "…" : "") : new Date(r.created_at).toLocaleDateString(),
        icon: History,
        to: "/app/launchpad/$tool",
        toolSlug: slug,
        search: ctx ? { context: ctx, title: ctx.slice(0, 60) } : {},
        match: /.*/,
      });
      if (out.length >= 4) break;
    }
    return out;
  }, [term, recentQ.data]);

  const assetItems = useMemo<Item[]>(() => {
    if (!term || assetResults.length === 0) return [];
    return assetResults.map((a) => ({
      id: "asset-" + a.id,
      group: "Recent" as Group,
      label: a.title ?? "Untitled",
      hint: a.category ? `${a.category} · ${new Date(a.created_at).toLocaleDateString()}` : new Date(a.created_at).toLocaleDateString(),
      icon: FileText,
      to: "/app/assets",
      match: /.*/,
    }));
  }, [term, assetResults]);

  const filteredActions = useMemo<Item[]>(() => {
    if (!term) return QUICK_ACTIONS;
    const t = term.toLowerCase();
    return QUICK_ACTIONS.filter(
      (it) => it.match.test(term) || it.label.toLowerCase().includes(t) || (it.hint?.toLowerCase().includes(t) ?? false),
    );
  }, [term]);

  const filteredTools = useMemo<Item[]>(() => {
    if (!term) return STATIC_TOOLS;
    const t = term.toLowerCase();
    return STATIC_TOOLS.filter(
      (it) => it.match.test(term) || it.label.toLowerCase().includes(t) || (it.hint?.toLowerCase().includes(t) ?? false),
    );
  }, [term]);

  // Flat navigable list: dynamic action → quick actions → recent/asset → tools
  const flat = useMemo<Item[]>(() => {
    const out: Item[] = [];
    if (dynamicAction) out.push(dynamicAction);
    out.push(...filteredActions.slice(0, term ? filteredActions.length : 4));
    out.push(...(term ? assetItems : recentItems));
    out.push(...filteredTools);
    return out;
  }, [dynamicAction, filteredActions, term, assetItems, recentItems, filteredTools]);

  // ── Reset on close / query change ─────────────────────────────────────────
  useEffect(() => { setActiveIdx(0); }, [q]);
  useEffect(() => {
    if (!open) {
      setQ("");
      setActiveIdx(0);
      setAiAnswer("");
      setAiLoading(false);
      abortRef.current?.abort();
      setAssetResults([]);
    } else {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  // ── Scroll active into view ───────────────────────────────────────────────
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // ── Execute item ──────────────────────────────────────────────────────────
  const execute = useCallback((it: Item) => {
    onOpenChange(false);
    if (it.to === "/app/launchpad/$tool" && it.toolSlug) {
      navigate({ to: "/app/launchpad/$tool", params: { tool: it.toolSlug }, search: it.search ?? {} });
    } else {
      navigate({ to: it.to });
    }
  }, [navigate, onOpenChange]);

  // ── Keyboard nav ──────────────────────────────────────────────────────────
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(flat.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const it = flat[activeIdx]; if (it) execute(it); }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  let navIdx = -1;

  function renderGroup(label: string, items: Item[], showAll = false) {
    const display = showAll ? items : items.slice(0, 6);
    if (display.length === 0) return null;
    return (
      <div className="mb-1">
        <div style={{
          padding: "8px 12px 4px",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--muted-foreground)", opacity: 0.6,
        }}>{label}</div>
        {display.map((it) => {
          navIdx++;
          const myIdx = navIdx;
          const active = myIdx === activeIdx;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              data-active={active}
              onMouseEnter={() => setActiveIdx(myIdx)}
              onClick={() => execute(it)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "8px 10px", borderRadius: 10, textAlign: "left",
                transition: "background 0.12s",
                background: active
                  ? it.group === "Action"
                    ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                    : "color-mix(in oklab, var(--primary) 10%, transparent)"
                  : "transparent",
              }}
            >
              <span style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: active
                  ? it.group === "Action"
                    ? "color-mix(in oklab, var(--accent) 18%, transparent)"
                    : "color-mix(in oklab, var(--primary) 16%, transparent)"
                  : "color-mix(in oklab, var(--surface-2) 80%, transparent)",
                color: active
                  ? it.group === "Action" ? "var(--accent)" : "var(--primary)"
                  : "var(--muted-foreground)",
                border: active
                  ? `1px solid color-mix(in oklab, ${it.group === "Action" ? "var(--accent)" : "var(--primary)"} 25%, transparent)`
                  : "1px solid transparent",
              }}>
                <Icon className="h-3.5 w-3.5" />
              </span>

              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {it.label}
                </span>
                {it.hint && (
                  <span style={{ display: "block", fontSize: 11, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                    {it.hint}
                  </span>
                )}
              </span>

              {it.badge && (
                <span style={{
                  fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 99,
                  background: "color-mix(in oklab, var(--primary) 14%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--primary) 30%, transparent)",
                  color: "var(--primary)", flexShrink: 0,
                }}>{it.badge}</span>
              )}
              {it.search?.context && !it.badge && (
                <span style={{
                  fontSize: 9.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 99,
                  background: "color-mix(in oklab, var(--accent) 10%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--accent) 22%, transparent)",
                  color: "var(--accent)", flexShrink: 0,
                }}>Prefilled</span>
              )}

              {active ? (
                <CornerDownLeft style={{ width: 13, height: 13, flexShrink: 0, color: "var(--primary)" }} />
              ) : (
                <ArrowRight style={{ width: 13, height: 13, flexShrink: 0, opacity: 0 }} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  const showQuickGrid = !term && !dynamicAction;

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        onClick={() => onOpenChange(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 49,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px) saturate(1.6)",
          WebkitBackdropFilter: "blur(6px) saturate(1.6)",
          transition: "opacity 0.18s",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed", left: "50%", zIndex: 50,
          width: "100%", maxWidth: 680, padding: "0 16px",
          transform: open ? "translate(-50%, 0)" : "translate(-50%, -8px)",
          top: "clamp(60px, 10vh, 120px)",
          transition: "opacity 0.2s, transform 0.2s cubic-bezier(0.16,1,0.3,1)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "var(--surface)",
          border: "1px solid color-mix(in oklab, var(--primary) 22%, var(--border))",
          boxShadow: "0 0 0 1px color-mix(in oklab, var(--primary) 8%, transparent), 0 24px 60px rgba(0,0,0,0.55), 0 0 80px color-mix(in oklab, var(--primary) 6%, transparent)",
        }}>

          {/* ── Input ───────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
          }}>
            <Sparkles style={{ width: 16, height: 16, flexShrink: 0, color: "var(--primary)" }} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask Nova anything, or search tools and outputs…"
              style={{
                flex: 1, background: "transparent", outline: "none", border: "none",
                fontSize: 14, color: "var(--foreground)",
                fontFamily: "inherit",
              }}
            />
            {q && (
              <button
                onClick={() => setQ("")}
                style={{ color: "var(--muted-foreground)", background: "transparent", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
            <kbd style={{
              padding: "2px 6px", borderRadius: 6, fontSize: 10, fontFamily: "monospace",
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--muted-foreground)", flexShrink: 0,
            }}>ESC</kbd>
          </div>

          {/* ── Quick-action icon grid (empty state) ────────────────────── */}
          {showQuickGrid && (
            <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid var(--border)" }}>
              <div style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "var(--muted-foreground)", opacity: 0.55,
                marginBottom: 8,
              }}>Quick actions</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {QUICK_ACTIONS.slice(0, 8).map((it) => {
                  const Icon = it.icon;
                  return (
                    <button
                      key={it.id}
                      onClick={() => execute(it)}
                      title={it.label}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                        background: "var(--surface-2)", border: "1px solid var(--border)",
                        color: "var(--foreground)", cursor: "pointer",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "color-mix(in oklab, var(--primary) 35%, transparent)";
                        (e.currentTarget as HTMLElement).style.background = "color-mix(in oklab, var(--primary) 6%, var(--surface-2))";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
                      }}
                    >
                      <Icon className="h-3 w-3 text-primary opacity-85" />
                      {it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Results list ─────────────────────────────────────────────── */}
          <div
            ref={listRef}
            style={{ maxHeight: "52vh", overflowY: "auto", padding: "6px 6px" }}
          >
            {(() => {
              navIdx = -1; // reset for each render pass

              const hasAnyResults =
                dynamicAction || filteredActions.length > 0 ||
                (term ? assetItems.length > 0 : recentItems.length > 0) ||
                filteredTools.length > 0;

              if (!hasAnyResults) {
                return (
                  <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
                    <Bot style={{ width: 28, height: 28, margin: "0 auto 10px", opacity: 0.35 }} />
                    <p>No results for <strong style={{ color: "var(--foreground)" }}>"{q}"</strong></p>
                    <p style={{ fontSize: 11.5, marginTop: 4, opacity: 0.7 }}>
                      Try "validate my SaaS idea", "audit my website", or ask a business question.
                    </p>
                  </div>
                );
              }

              return (
                <>
                  {/* Dynamic AI intent action */}
                  {dynamicAction && (() => {
                    navIdx++;
                    const myIdx = navIdx;
                    const active = myIdx === activeIdx;
                    const Icon = dynamicAction.icon;
                    return (
                      <div style={{ marginBottom: 4 }}>
                        <div style={{
                          padding: "8px 12px 4px", fontSize: 10, fontWeight: 700,
                          letterSpacing: "0.12em", textTransform: "uppercase",
                          color: "var(--accent)", opacity: 0.85,
                        }}>AI Action</div>
                        <button
                          data-active={active}
                          onMouseEnter={() => setActiveIdx(myIdx)}
                          onClick={() => execute(dynamicAction)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10, width: "100%",
                            padding: "10px 10px", borderRadius: 10, textAlign: "left",
                            background: active
                              ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                              : "color-mix(in oklab, var(--accent) 5%, transparent)",
                            border: `1px solid color-mix(in oklab, var(--accent) ${active ? 28 : 15}%, transparent)`,
                            transition: "background 0.12s, border-color 0.12s",
                          }}
                        >
                          <span style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                            background: "color-mix(in oklab, var(--accent) 18%, transparent)",
                            color: "var(--accent)",
                            border: "1px solid color-mix(in oklab, var(--accent) 28%, transparent)",
                          }}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--foreground)" }}>
                              {dynamicAction.label}
                            </span>
                            <span style={{ display: "block", fontSize: 11, color: "var(--muted-foreground)", marginTop: 1 }}>
                              {dynamicAction.hint}
                            </span>
                          </span>
                          {active
                            ? <CornerDownLeft style={{ width: 13, height: 13, color: "var(--accent)", flexShrink: 0 }} />
                            : <ArrowRight style={{ width: 13, height: 13, opacity: 0, flexShrink: 0 }} />}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Actions / Quick actions (when querying) */}
                  {!dynamicAction && term && filteredActions.length > 0 &&
                    renderGroup("Actions", filteredActions, true)}

                  {/* Recent Outputs — runs (no query) or asset search (with query) */}
                  {!term && recentItems.length > 0 && renderGroup("Recent Outputs", recentItems)}
                  {term && assetItems.length > 0 && renderGroup("Recent Outputs", assetItems)}

                  {/* Tools */}
                  {filteredTools.length > 0 && renderGroup("Tools", filteredTools, true)}
                </>
              );
            })()}
          </div>

          {/* ── AI inline answer ─────────────────────────────────────────── */}
          {(aiLoading || aiAnswer) && (
            <div style={{
              borderTop: "1px solid var(--border)",
              padding: "12px 16px",
              background: "color-mix(in oklab, var(--primary) 4%, var(--surface))",
            }}>
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 1,
                  background: "color-mix(in oklab, var(--primary) 16%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--primary) 28%, transparent)",
                }}>
                  <Sparkles style={{ width: 13, height: 13, color: "var(--primary)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--primary)", marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Nova
                  </div>
                  {aiLoading && !aiAnswer ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center", paddingTop: 2 }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "var(--primary)", opacity: 0.7,
                          animation: `dotPulse 1.2s ease-in-out ${i * 0.22}s infinite`,
                        }} />
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.6, margin: 0 }}>
                      {aiAnswer}
                      {aiLoading && <span style={{ display: "inline-block", width: 2, height: "1em", background: "var(--primary)", marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 14px",
            borderTop: "1px solid var(--border)",
            background: "color-mix(in oklab, var(--surface-2) 60%, transparent)",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10.5, color: "var(--muted-foreground)" }}>
              {(["↑↓ navigate", "↵ open", "esc close"] as const).map((hint) => (
                <span key={hint} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <kbd style={{
                    padding: "1px 5px", borderRadius: 5, fontFamily: "monospace", fontSize: 10,
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    color: "var(--muted-foreground)",
                  }}>{hint.split(" ")[0]}</kbd>
                  <span style={{ opacity: 0.6 }}>{hint.split(" ").slice(1).join(" ")}</span>
                </span>
              ))}
            </span>
            <span style={{ fontSize: 10.5, color: "var(--muted-foreground)", opacity: 0.55 }}>
              {flat.length} result{flat.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </>
  );
}
