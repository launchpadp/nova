import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
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

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const value = data[current.key] || "";

  const saveStep = async (key: string, val: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("onboarding_responses").upsert(
      { user_id: user.id, question_key: key, answer: val },
      { onConflict: "user_id,question_key" },
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
    if (step < STEPS.length - 1) setStep(step + 1);
    else void finish();
  };

  // Final screen
  if (completed) {
    return (
      <div className="boot-grid relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elevated">
            <Check className="h-8 w-8" />
          </div>
          <div className="mt-6 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            All set
          </div>
          <h1 className="mt-3 font-display text-[2.25rem] font-semibold tracking-tight md:text-[2.75rem]">
            Welcome to <span className="text-gradient">Nova OPS</span>
          </h1>
          <p className="mt-3 max-w-md text-[14px] text-muted-foreground">
            Your workspace is ready. Jump in and run your first AI tool.
          </p>
          <Button onClick={() => navigate({ to: "/app/dashboard" })} className="mt-8 gap-2">
            Open Nova OPS <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="boot-grid relative flex min-h-screen flex-col">
      {/* Header */}
      <header className="relative z-10 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-6 backdrop-blur">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="font-display text-[14px] font-semibold tracking-tight">Nova OPS</span>
        <span className="ml-2 text-[11.5px] text-muted-foreground">Welcome — let's set things up</span>
        <div className="ml-auto text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 border-b border-border bg-background/70 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11.5px] font-medium tabular-nums text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Question */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
            Question {step + 1}
          </div>
          <h1 className="mt-3 font-display text-[1.6rem] font-semibold tracking-tight md:text-[1.85rem]">
            {current.label}
          </h1>

          <div className="mt-6">
            {current.choices ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {current.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setData({ ...data, [current.key]: c })}
                    className={cn(
                      "rounded-md border px-3 py-3 text-[13px] font-medium transition",
                      value === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground/80 hover:border-foreground/20 hover:bg-muted/40",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                autoFocus
                className="h-11 text-base"
                placeholder={current.placeholder}
                value={value}
                onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") void next(); }}
              />
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={step === 0 || submitting}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => void next()} disabled={submitting || !value.trim()}>
              {step === STEPS.length - 1 ? (
                <>Finish <Check className="h-4 w-4" /></>
              ) : (
                <>Continue <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
