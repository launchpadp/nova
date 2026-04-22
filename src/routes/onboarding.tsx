import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
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
  { key: "businessType", label: "What kind of business are you building?", placeholder: "e.g. B2B SaaS, agency, ecommerce" },
  { key: "niche", label: "What niche or industry?", placeholder: "e.g. Sales enablement for fintech" },
  { key: "location", label: "Where are you based?", placeholder: "e.g. Austin, TX" },
  { key: "targetCustomer", label: "Who is your target customer?", placeholder: "e.g. Series A founders, ops leaders" },
  { key: "offer", label: "What do you sell (or plan to sell)?", placeholder: "e.g. AI-powered sales playbooks" },
  { key: "goal", label: "What's your primary goal?", placeholder: "e.g. Hit $20k MRR in 90 days" },
  { key: "stage", label: "What stage are you at right now?", choices: ["Idea", "Validate", "Launch", "Operate", "Scale"] as const },
  { key: "currentRevenue", label: "What's your current monthly revenue?", choices: ["$0", "<$1k", "$1k–$10k", "$10k–$50k", "$50k+"] as const },
  { key: "blocker", label: "What's your biggest blocker right now?", placeholder: "e.g. No leads, no offer, no time" },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const value = data[current.key] || "";

  const saveStep = async (key: string, val: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("onboarding_responses")
      .upsert({ user_id: user.id, question_key: key, answer: val }, { onConflict: "user_id,question_key" });
  };

  const finish = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Persist final answer
      await saveStep(current.key, value);

      // Update profile
      await supabase.from("profiles").update({ onboarding_complete: true }).eq("id", user.id);

      // Sync onboarding into the user's organization (most recent membership)
      const { data: member } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (member?.organization_id) {
        const stage = (data.stage || "Idea") as "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
        await supabase
          .from("organizations")
          .update({
            business_type: data.businessType,
            niche: data.niche,
            location: data.location,
            target_customer: data.targetCustomer,
            offer: data.offer,
            goal: data.goal,
            stage,
          })
          .eq("id", member.organization_id);
      }

      toast.success("Workspace ready");
      navigate({ to: "/dashboard" });
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex h-14 items-center gap-2 border-b border-border px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></div>
        <span className="font-display text-sm font-semibold">Launchpad Nova</span>
        <div className="ml-auto text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</div>
      </header>
      <div className="h-1 bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Set up your operating system</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{current.label}</h1>
          <div className="mt-6">
            {current.choices ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {current.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setData({ ...data, [current.key]: c })}
                    className={cn(
                      "rounded-md border px-3 py-2.5 text-sm transition",
                      value === c ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-card hover:bg-accent"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                autoFocus
                placeholder={current.placeholder}
                value={value}
                onChange={(e) => setData({ ...data, [current.key]: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") void next(); }}
              />
            )}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => void next()} disabled={submitting || !value.trim()}>
              {step === STEPS.length - 1 ? <>Finish <Check className="h-4 w-4" /></> : <>Continue <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
