-- Lead stage enum
DO $$ BEGIN
  CREATE TYPE public.lead_stage AS ENUM ('New','Contacted','Qualified','Proposal','Won','Lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  source text,
  stage public.lead_stage NOT NULL DEFAULT 'New',
  notes text,
  value numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_org_idx ON public.leads(organization_id, created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_org_read ON public.leads FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY leads_org_insert ON public.leads FOR INSERT WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY leads_org_update ON public.leads FOR UPDATE USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY leads_org_delete ON public.leads FOR DELETE USING (public.is_org_member(organization_id, auth.uid()));

CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- User integrations
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_key text NOT NULL,
  value text,
  status text NOT NULL DEFAULT 'connected',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, integration_key)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY ui_own_select ON public.user_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ui_own_insert ON public.user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ui_own_update ON public.user_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ui_own_delete ON public.user_integrations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER ui_set_updated_at BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();