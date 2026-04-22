import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ArrowLeft, Check, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
  },
  component: Onboarding,
});

type Step = {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  choices?: readonly string[];
};

const STEPS: Step[] = [
  { key: "businessType",   label: "What kind of business are you building?", placeholder: "e.g. B2B SaaS, agency, ecommerce" },
  { key: "niche",          label: "What niche or industry?",                 placeholder: "e.g. Sales enablement for fintech" },
  { key: "location",       label: "Where are you based?",                    placeholder: "e.g. Austin, TX" },
  { key: "targetCustomer", label: "Who is your target customer?",            placeholder: "e.g. Series A founders, ops leaders" },
  { key: "offer",          label: "What do you sell (or plan to sell)?",     placeholder: "e.g. AI-powered sales playbooks" },
  { key: "goal",           label: "What's your primary goal?",               placeholder: "e.g. Hit $20k MRR in 90 days" },
  { key: "stage",          label: "What stage are you at right now?",        choices: ["Idea", "Validate", "Launch", "Operate", "Scale"] as const },
  { key: "currentRevenue", label: "What's your current monthly revenue?",    choices: ["$0", "<$1k", "$1k–$10k", "$10k–$50k", "$50k+"] as const },
  { key: "blocker",        label: "What's your biggest blocker right now?",  placeholder: "e.g. No leads, no offer, no time" },
];

function Confetti() {
  // Lightweight confetti using random divs
  const pieces = Array.from({ length: 80 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const duration = 2 + Math.random() * 1.5;
        const colors = ["var(--primary)", "var(--primary-glow)", "var(--launchpad)", "var(--success)", "var(--warning)"];
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className="absolute top-0 h-2 w-1.5 rounded-sm"
            style={{
              left: `${left}%`,
              backgroundColor: color,
              animation: `fall ${duration}s ease-in ${delay}s forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
      <style>{`@keyframes fall { to { transform: translateY(110vh) rotate(720deg); opacity: 0.4; } }`}</style>
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [pulse, setPulse] = useState(false);
  const isFinalScreen = completed;

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const value = data[current.key] || "";

  useEffect(() => {
    if (pulse) {
      const t = setTimeout(() => setPulse(false), 350);
      return () => clearTimeout(t);
    }
  }, [pulse]);

  const saveStep = async (key: string, val: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("onboarding_responses").upsert(
      { user_id: user.id, question_key: key, answer: val },
      { onConflict: "user_id,question_key" }
    );
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      await saveStep(current.key, value);
      await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);

      const { data: member } = await supabase
        .from("organization_members").select("organization_id").eq("user_id", user.id)
        .order("created_at", { ascending: true }).limit(1).maybeSingle();

      if (member?.organization_id) {
        const stage = (data.stage || "Idea") as "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
        await supabase.from("organizations").update({
          business_type: data.businessType,
          niche: data.niche,
          location: data.location,
          target_customer: data.targetCustomer,
          offer: data.offer,
          goal: data.goal,
          stage,
        }).eq("id", member.organization_id);
      }

      setCompleted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Onboarding failed");
    } finally {
      setSubmitting(false);
    }
  };

  const next = async () => {
    if (!value.trim()) return;
    await saveStep(current.key, value);
    setPulse(true);
    if (step < STEPS.length - 1) setTimeout(() => setStep(step + 1), 150);
    else void finish();
  };

  if (isFinalScreen) {
    return (
      <div className="boot-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        <Confetti />
        <div className="relative z-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary glow-primary">
            <Check className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="mission-title mt-6">SYSTEM ONLINE</div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            <span className="text-gradient">Welcome to Nova OPS</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Your operating system is calibrated. All systems are ready for deployment.
          </p>
          <Button onClick={() => navigate({ to: "/app/dashboard" })} className="btn-execute mt-8 gap-2">
            <Zap className="h-4 w-4" /> ENTER NOVA OPS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="boot-grid relative flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative z-10 flex h-14 items-center gap-2 border-b border-border/40 px-6 backdrop-blur-sm">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-primary glow-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-sm font-semibold tracking-tight">Nova OPS</span>
        <span className="ml-2 font-display text-[10px] tracking-[0.22em] text-muted-foreground">SYSTEM INITIALIZATION</span>
        <div className="ml-auto font-mono text-xs text-muted-foreground">
          [{String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}]
        </div>
      </header>

      {/* Boot bar */}
      <div className="relative z-10 border-b border-border/40 bg-background/40 px-6 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.18em] text-primary-glow">BOOT</span>
          <div className="xp-bar flex-1">
            <div className="xp-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[10px] tracking-[0.18em] text-primary-glow">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Question */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className={cn("w-full max-w-xl transition", pulse && "animate-pulse")}>
          <div className="mission-title text-[10px]">QUERY {String(step + 1).padStart(2, "0")}</div>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">{current.label}</h1>

          <div className="mt-6">
            {current.choices ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {current.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setData({ ...data, [current.key]: c })}
                    className={cn(
                      "rounded-md border px-3 py-3 font-display text-sm font-semibold uppercase tracking-wider transition",
                      value === c
                        ? "border-primary bg-primary/15 text-primary-glow shadow-[0_0_20px_-4px_var(--primary-glow)]"
                        : "border-border bg-card text-foreground/80 hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                autoFocus
                className="terminal-input h-12 text-base"
                placeholder={current.placeholder}
                value={value}
                onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") void next(); }}
              />
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => void next()} disabled={submitting || !value.trim()} className="btn-execute">
              {step === STEPS.length - 1 ? <>FINISH <Check className="h-4 w-4" /></> : <>NEXT <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
