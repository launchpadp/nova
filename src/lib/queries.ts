import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const organizationQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["organization", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const subscriptionQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["subscription", orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").eq("organization_id", orgId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const planEntitlementsQuery = () =>
  queryOptions({
    queryKey: ["plan_entitlements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_entitlements").select("*").order("price_usd", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const toolRunsQuery = (orgId: string, limit = 20) =>
  queryOptions({
    queryKey: ["tool_runs", orgId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_runs").select("*").eq("organization_id", orgId)
        .order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

export const generatedAssetsQuery = (orgId: string, category?: string) =>
  queryOptions({
    queryKey: ["generated_assets", orgId, category ?? "all"],
    queryFn: async () => {
      let q = supabase.from("generated_assets").select("*").eq("organization_id", orgId);
      if (category) q = q.eq("category", category);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

export const usageQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["usage", orgId],
    queryFn: async () => {
      const period = new Date().toISOString().slice(0, 7);
      const { data, error } = await supabase
        .from("usage_tracking").select("*").eq("organization_id", orgId).eq("period", period);
      if (error) throw error;
      return data ?? [];
    },
  });

export const automationSettingsQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["automation_settings", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_settings").select("*").eq("organization_id", orgId).order("key");
      if (error) throw error;
      return data ?? [];
    },
  });

export const websiteAnalysesQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["website_analyses", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("website_analyses").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

// New: leads
export const leadsQuery = (orgId: string) =>
  queryOptions({
    queryKey: ["leads", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads").select("*").eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

// New: user integrations
export const integrationsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["user_integrations", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_integrations").select("*").eq("user_id", userId);
      if (error) throw error;
      return data ?? [];
    },
  });
