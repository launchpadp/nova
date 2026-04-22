// Static catalog for Launchpad tools (UI metadata only).
// Dynamic data (runs, outputs, usage) lives in Supabase.

export type Stage = "Idea" | "Validate" | "Launch" | "Operate" | "Scale";
export type Plan = "Starter" | "Launch" | "Operate" | "Scale";

export const STAGES: Stage[] = ["Idea", "Validate", "Launch", "Operate", "Scale"];

export const launchpadCatalog = [
  { key: "idea-validator", toolKey: "validate-idea", name: "Idea Validator", desc: "Pressure-test your idea against market signal.", wired: true },
  { key: "pitch-generator", toolKey: "generate-pitch", name: "Pitch Generator", desc: "Investor-ready pitch in minutes.", wired: true },
  { key: "gtm-strategy", toolKey: "generate-gtm-strategy", name: "GTM Strategy", desc: "Channel plan, ICP, messaging map.", wired: true },
  { key: "kill-my-idea", toolKey: "validate-idea", name: "Kill My Idea", desc: "Adversarial critique to find blind spots.", wired: false },
  { key: "funding-score", toolKey: "validate-idea", name: "Funding Score", desc: "VC-style scorecard with gaps to close.", wired: false },
  { key: "first-10-customers", toolKey: "generate-gtm-strategy", name: "First 10 Customers", desc: "Named-account list + outreach plan.", wired: false },
  { key: "business-plan", toolKey: "generate-ops-plan", name: "Business Plan", desc: "Lean plan with financials.", wired: false },
  { key: "investor-emails", toolKey: "generate-followup-sequence", name: "Investor Emails", desc: "Personalized outreach to target VCs.", wired: false },
  { key: "idea-vs-idea", toolKey: "validate-idea", name: "Idea vs Idea", desc: "Side-by-side scoring of two directions.", wired: false },
  { key: "landing-page", toolKey: "generate-pitch", name: "Landing Page", desc: "Conversion-ready copy + hero.", wired: false },
  { key: "offer", toolKey: "generate-offer", name: "Offer Builder", desc: "Irresistible offer with risk reversal.", wired: true },
  { key: "ops-plan", toolKey: "generate-ops-plan", name: "Ops Plan", desc: "Workflows, automations, KPIs.", wired: true },
  { key: "followup", toolKey: "generate-followup-sequence", name: "Follow-up Sequence", desc: "Multi-touch follow-ups.", wired: true },
  { key: "website-audit", toolKey: "analyze-website", name: "Website Audit", desc: "AI audit of your live site.", wired: true },
] as const;

export const novaSystemsCatalog = [
  { key: "crm", name: "CRM Pipeline", href: "/app/nova/crm" },
  { key: "leads", name: "Lead Capture", href: "/app/nova/leads" },
  { key: "workflows", name: "Automation Workflows", href: "/app/nova/workflows" },
  { key: "clients", name: "Client Onboarding", href: "/app/nova/clients" },
  { key: "reports", name: "Reporting Dashboard", href: "/app/nova/reports" },
] as const;

export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  source: string;
  stage: "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
  value: number;
  lastTouch: string;
};
