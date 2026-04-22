import { authenticateAndAuthorize, callClaude, corsHeaders, incrementUsage, jsonResponse } from "../_shared/helpers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authResult = await authenticateAndAuthorize(req, "analyze-website");
  if (authResult instanceof Response) return authResult;
  const ctx = authResult;

  let input: { url?: string };
  try { input = await req.json(); } catch { return jsonResponse({ error: "Invalid JSON" }, 400); }
  const url = (input.url || "").trim();
  if (!/^https?:\/\//.test(url)) return jsonResponse({ error: "Invalid URL" }, 400);

  const { data: run } = await ctx.supabase.from("tool_runs").insert({
    organization_id: ctx.organizationId,
    user_id: ctx.userId,
    tool_key: "analyze-website",
    status: "running",
    input,
  }).select().single();

  try {
    // Fetch the page
    const pageResp = await fetch(url, { headers: { "User-Agent": "Launchpad-Nova-Analyzer/1.0" } });
    const html = (await pageResp.text()).slice(0, 30000);

    // Snapshot to storage
    const snapshotPath = `${ctx.organizationId}/${ctx.userId}/${Date.now()}.html`;
    await ctx.supabase.storage.from("website-snapshots").upload(snapshotPath, html, {
      contentType: "text/html",
      upsert: false,
    });

    const output = await callClaude(
      "You are a senior conversion + SEO + UX consultant. Audit the supplied HTML and return actionable findings.",
      `Analyze this website (${url}). HTML excerpt:\n\n${html}`,
      {
        name: "analyze_website",
        description: "Return a structured website audit.",
        parameters: {
          type: "object",
          properties: {
            issues: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            ux_notes: { type: "string" },
            seo_notes: { type: "string" },
            suggested_changes: { type: "array", items: { type: "string" } },
          },
          required: ["issues", "opportunities", "ux_notes", "seo_notes", "suggested_changes"],
          additionalProperties: false,
        },
      },
    );

    await ctx.supabase.from("tool_runs").update({ status: "succeeded", output }).eq("id", run!.id);

    const { data: analysis } = await ctx.supabase.from("website_analyses").insert({
      organization_id: ctx.organizationId,
      user_id: ctx.userId,
      url,
      snapshot_path: snapshotPath,
      issues: output.issues,
      opportunities: output.opportunities,
      ux_notes: output.ux_notes,
      seo_notes: output.seo_notes,
      suggested_changes: output.suggested_changes,
    }).select().single();

    await incrementUsage(ctx, "analyze-website");

    return jsonResponse({ run_id: run!.id, analysis_id: analysis?.id, output });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await ctx.supabase.from("tool_runs").update({ status: "failed", error: msg }).eq("id", run!.id);
    if (msg === "RATE_LIMIT") return jsonResponse({ error: "Rate limit exceeded." }, 429);
    if (msg === "PAYMENT_REQUIRED") return jsonResponse({ error: "AI credits exhausted." }, 402);
    return jsonResponse({ error: msg }, 500);
  }
});
