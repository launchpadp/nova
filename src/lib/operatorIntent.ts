/**
 * Operator intent parser.
 *
 * Pure, presentational helper: maps a free-text user prompt to a
 * {tool slug + prefilled fields + label} suggestion. No backend logic.
 *
 * Returns at most one structured "Action" suggestion. The Operator
 * component still shows static Tools/Pages and recent runs alongside it.
 */

export type OperatorIntent = {
  /** Launchpad tool slug, e.g. "idea-validator" */
  toolSlug: string;
  /** Pretty action label shown in the palette */
  label: string;
  /** Short hint shown under the label */
  hint: string;
  /** Search params to forward to the tool route */
  search: { context?: string; title?: string };
};

type Pattern = {
  /** Tool slug to route to */
  slug: string;
  /** Pretty label prefix, e.g. "Validate idea" */
  verb: string;
  /** Patterns that capture an optional context (group 1) */
  matchers: RegExp[];
  /** Trigger words alone (no context) — still routes, no prefill */
  bareTriggers: RegExp[];
};

const PATTERNS: Pattern[] = [
  {
    slug: "idea-validator",
    verb: "Validate idea",
    matchers: [
      /^validat(?:e|ion)\s+(?:my\s+|the\s+|an?\s+|this\s+)?(?:idea\s+(?:for\s+|about\s+)?)?(.+)$/i,
      /^(?:test|pressure[- ]test|critique|stress[- ]test)\s+(?:my\s+|the\s+|an?\s+|this\s+)?(?:idea\s+(?:for\s+|about\s+)?)?(.+)$/i,
      /^(?:i\s+have\s+an?\s+idea\s+(?:for\s+|about\s+)?)(.+)$/i,
      /^(?:idea\s+for\s+)(.+)$/i,
    ],
    bareTriggers: [/^validate$/i, /^idea$/i, /^test\s+idea$/i],
  },
  {
    slug: "pitch-generator",
    verb: "Generate pitch",
    matchers: [
      /^(?:generate|create|write|build|draft|make)\s+(?:a\s+|an\s+|my\s+)?(?:investor\s+)?pitch\s+(?:for\s+|about\s+)?(.+)$/i,
      /^pitch\s+(?:for\s+|about\s+)(.+)$/i,
    ],
    bareTriggers: [/^pitch$/i, /^pitch\s+(?:me|generator)$/i, /^investor\s+pitch$/i],
  },
  {
    slug: "gtm-strategy",
    verb: "Build GTM strategy",
    matchers: [
      /^(?:generate|create|write|build|draft|make|plan)\s+(?:a\s+|an\s+|my\s+)?(?:gtm|go[- ]to[- ]market)\s+(?:strategy\s+|plan\s+)?(?:for\s+|about\s+)?(.+)$/i,
      /^(?:gtm|go[- ]to[- ]market)\s+(?:for\s+|about\s+)(.+)$/i,
    ],
    bareTriggers: [/^gtm$/i, /^go[- ]to[- ]market$/i, /^build\s+(?:my\s+)?gtm$/i, /^strategy$/i],
  },
  {
    slug: "offer",
    verb: "Build offer",
    matchers: [
      /^(?:generate|create|write|build|draft|make)\s+(?:an?\s+|my\s+)?offer\s+(?:for\s+|about\s+)?(.+)$/i,
      /^offer\s+(?:for\s+)(.+)$/i,
    ],
    bareTriggers: [/^offer$/i, /^build\s+(?:an?\s+)?offer$/i, /^pricing$/i],
  },
  {
    slug: "ops-plan",
    verb: "Generate ops plan",
    matchers: [
      /^(?:generate|create|write|build|draft|make|plan)\s+(?:an?\s+|my\s+)?(?:ops|operations)\s+(?:plan\s+)?(?:for\s+|about\s+)?(.+)$/i,
      /^(?:automate|operationalize)\s+(.+)$/i,
    ],
    bareTriggers: [/^ops$/i, /^operations$/i, /^ops\s+plan$/i, /^automate$/i],
  },
  {
    slug: "followup",
    verb: "Write follow-up sequence",
    matchers: [
      /^(?:generate|create|write|build|draft|make)\s+(?:a\s+)?(?:follow[- ]up|email)\s+(?:sequence\s+)?(?:for\s+|about\s+)?(.+)$/i,
      /^follow\s+up\s+(?:with\s+)(.+)$/i,
    ],
    bareTriggers: [/^follow[- ]?up$/i, /^email\s+sequence$/i, /^sequence$/i],
  },
  {
    slug: "website-audit",
    verb: "Audit website",
    matchers: [
      /^(?:audit|analyze|analyse|review|check)\s+(?:my\s+|the\s+)?(?:website|site|landing\s+page|url)\s*[:\-]?\s*(.+)$/i,
      /^(?:website|site)\s+(?:audit|review|analysis)\s+(?:for\s+)?(.+)$/i,
      /^(https?:\/\/\S+)$/i,
    ],
    bareTriggers: [/^audit$/i, /^website\s+audit$/i, /^seo$/i],
  },
  {
    slug: "first-10-customers",
    verb: "Plan first 10 customers",
    matchers: [
      /^(?:get|find|win|acquire|plan)\s+(?:my\s+)?first\s+(?:10|ten)\s+customers\s+(?:for\s+|about\s+)?(.+)$/i,
      /^(?:first\s+(?:10|ten)\s+customers\s+for\s+)(.+)$/i,
    ],
    bareTriggers: [/^first\s+(?:10|ten)(?:\s+customers)?$/i, /^acquisition$/i],
  },
  {
    slug: "kill-my-idea",
    verb: "Kill this idea",
    matchers: [
      /^(?:kill|destroy|tear\s+apart|critique|roast|challenge)\s+(?:my\s+)?(?:idea\s+(?:for\s+|about\s+)?)?(.+)$/i,
      /^(?:what['']?s\s+wrong\s+with|why\s+will\s+.+\s+fail|devil['']?s\s+advocate\s+for)\s+(.+)$/i,
    ],
    bareTriggers: [/^kill$/i, /^kill\s+(?:my\s+)?idea$/i, /^roast$/i, /^critique$/i],
  },
  {
    slug: "funding-score",
    verb: "Score funding readiness",
    matchers: [
      /^(?:score|rate|assess|check)\s+(?:my\s+)?(?:funding|fundrais(?:e|ing)|investor\s+readiness)\s+(?:for\s+|on\s+)?(.+)$/i,
      /^(?:how\s+fundable\s+is\s+|am\s+i\s+ready\s+to\s+raise\s+for\s+)(.+)$/i,
    ],
    bareTriggers: [/^funding\s+score$/i, /^fundrais(?:e|ing)$/i, /^investor\s+readiness$/i, /^fundable$/i],
  },
  {
    slug: "business-plan",
    verb: "Write business plan",
    matchers: [
      /^(?:write|create|build|draft|generate|make)\s+(?:a\s+|an?\s+|my\s+)?business\s+plan\s+(?:for\s+|about\s+)?(.+)$/i,
      /^business\s+plan\s+(?:for\s+)(.+)$/i,
    ],
    bareTriggers: [/^business\s+plan$/i, /^biz\s+plan$/i],
  },
  {
    slug: "investor-emails",
    verb: "Write investor emails",
    matchers: [
      /^(?:write|draft|create|generate)\s+(?:investor|vc|cold)\s+(?:outreach\s+)?emails?\s+(?:for\s+|about\s+)?(.+)$/i,
      /^(?:cold\s+email|outreach)\s+(?:to\s+)?(?:investors?\s+)?(?:for\s+)?(.+)$/i,
    ],
    bareTriggers: [/^investor\s+emails?$/i, /^cold\s+outreach$/i, /^vc\s+emails?$/i],
  },
  {
    slug: "idea-vs-idea",
    verb: "Compare ideas",
    matchers: [
      /^(?:compare|vs|versus)\s+(.+?)\s+(?:vs\.?\s+|versus\s+|against\s+).+$/i,
      /^(?:which\s+is\s+better|choose\s+between)\s+(.+)$/i,
    ],
    bareTriggers: [/^idea\s+vs\.?\s+idea$/i, /^compare\s+ideas$/i, /^versus$/i],
  },
  {
    slug: "landing-page",
    verb: "Write landing page",
    matchers: [
      /^(?:write|create|build|generate|draft)\s+(?:a\s+|my\s+)?landing\s+page\s+(?:for\s+|about\s+)?(.+)$/i,
      /^landing\s+page\s+(?:copy\s+)?(?:for\s+)(.+)$/i,
    ],
    bareTriggers: [/^landing\s+page$/i, /^homepage\s+copy$/i, /^lp$/i],
  },
  {
    slug: "competitor",
    verb: "Analyse competitors",
    matchers: [
      /^(?:analyse?|analyze|research|map|find)\s+(?:my\s+|the\s+)?competi(?:tors?|tion)\s+(?:for\s+|in\s+)?(.+)$/i,
      /^competitor\s+(?:analysis|research|landscape)\s+(?:for\s+)?(.+)$/i,
    ],
    bareTriggers: [/^competi(?:tor|tion)$/i, /^competitor\s+analysis$/i, /^market\s+map$/i],
  },
  {
    slug: "pricing",
    verb: "Build pricing strategy",
    matchers: [
      /^(?:build|create|design|generate|plan)\s+(?:a\s+|my\s+)?pricing\s+(?:strategy|model|plan)\s+(?:for\s+)?(.+)$/i,
      /^(?:how\s+should\s+i\s+price|what\s+should\s+i\s+charge\s+for)\s+(.+)$/i,
      /^pricing\s+(?:for\s+)(.+)$/i,
    ],
    bareTriggers: [/^pric(?:e|ing)$/i, /^pricing\s+strategy$/i, /^monetiz(?:e|ation)$/i],
  },
  {
    slug: "revenue-projector",
    verb: "Project revenue",
    matchers: [
      /^(?:project|forecast|model|estimate|calculate)\s+(?:my\s+|the\s+)?revenue\s+(?:for\s+|of\s+)?(.+)$/i,
      /^(?:revenue|mrr|arr)\s+(?:forecast|projection|model)\s+(?:for\s+)?(.+)$/i,
      /^(?:how\s+much\s+(?:revenue|money)\s+can\s+i\s+make\s+from\s+)(.+)$/i,
    ],
    bareTriggers: [/^revenue\s+projector$/i, /^revenue\s+forecast$/i, /^mrr\s+model$/i, /^arr$/i],
  },
];

const STOP_WORDS = new Set([
  "a", "an", "the", "for", "about", "my", "our", "this", "that", "to", "of",
]);

function deriveTitle(context: string, max = 60): string {
  const words = context.trim().split(/\s+/).filter(Boolean);
  // Skip leading stop-words
  while (words.length && STOP_WORDS.has(words[0].toLowerCase())) words.shift();
  const joined = words.slice(0, 8).join(" ");
  return joined.length > max ? joined.slice(0, max - 1).trimEnd() + "…" : joined;
}

/**
 * Try to extract a structured Operator intent from a free-text prompt.
 * Returns null if nothing confidently matches.
 */
export function parseOperatorIntent(raw: string): OperatorIntent | null {
  const q = raw.trim();
  if (!q) return null;

  for (const p of PATTERNS) {
    // Pattern with captured context wins first (gives us prefill)
    for (const re of p.matchers) {
      const m = q.match(re);
      if (m && m[1]) {
        const ctx = m[1].trim().replace(/[.,;:!?]+$/, "");
        if (ctx.length > 0) {
          return {
            toolSlug: p.slug,
            label: `${p.verb}: ${ctx}`,
            hint: "Opens the tool with this context prefilled",
            search: { context: ctx, title: deriveTitle(ctx) },
          };
        }
      }
    }
    // Bare trigger ("validate", "pitch") — route without prefill
    for (const re of p.bareTriggers) {
      if (re.test(q)) {
        return {
          toolSlug: p.slug,
          label: `Open ${p.verb.replace(/^(Generate|Build|Write|Audit|Plan|Validate)\s+/, "").replace(/^./, (c) => c.toUpperCase())}`,
          hint: `Jump to ${p.verb.toLowerCase()}`,
          search: {},
        };
      }
    }
  }

  return null;
}
