import { createFileRoute } from "@tanstack/react-router";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/leads")({ component: LeadsPage });

function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">CRM</div>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">Capture, track, and convert prospects.</p>
        </div>
        <Button className="gap-2 bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Inbox className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-lg font-semibold">No leads yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add your first lead or import them from a CSV.</p>
        <Button className="mt-4 gap-2"><Plus className="h-4 w-4" /> Add your first lead</Button>
      </div>
    </div>
  );
}
