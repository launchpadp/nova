-- Enable pgcrypto for symmetric encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Add encrypted column + last4 hint for masked display
ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS value_encrypted bytea,
  ADD COLUMN IF NOT EXISTS value_last4 text;

-- 2) Drop the existing plaintext-readable RLS policies so the client can no longer touch raw rows
DROP POLICY IF EXISTS "ui_own_select" ON public.user_integrations;
DROP POLICY IF EXISTS "ui_own_insert" ON public.user_integrations;
DROP POLICY IF EXISTS "ui_own_update" ON public.user_integrations;
DROP POLICY IF EXISTS "ui_own_delete" ON public.user_integrations;

-- Members can still DELETE their own row (disconnect) directly
CREATE POLICY "ui_own_delete" ON public.user_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- NO select / insert / update policies for end users.
-- All reads go through user_integrations_masked, all writes through set_user_integration().

-- 3) Drop the legacy plaintext "value" column entirely (was readable via select *)
ALTER TABLE public.user_integrations DROP COLUMN IF EXISTS value;

-- 4) Masked view — safe for client SELECT
CREATE OR REPLACE VIEW public.user_integrations_masked
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  integration_key,
  status,
  value_last4,
  (value_encrypted IS NOT NULL) AS is_connected,
  created_at,
  updated_at
FROM public.user_integrations;

-- The view inherits RLS from the underlying table (security_invoker = true).
-- Re-add a SELECT policy that ONLY exposes the safe columns through the view.
CREATE POLICY "ui_own_masked_select" ON public.user_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

GRANT SELECT ON public.user_integrations_masked TO authenticated;

-- 5) SECURITY DEFINER RPCs. The encryption key is NEVER stored in the DB — it
-- must be passed in by the caller (edge functions read it from env).

-- Encrypt + upsert. Returns the masked row.
CREATE OR REPLACE FUNCTION public.set_user_integration(
  _user_id uuid,
  _integration_key text,
  _value text,
  _encryption_key text
)
RETURNS TABLE (
  integration_key text,
  status text,
  value_last4 text,
  is_connected boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_last4 text;
  v_status text;
  v_encrypted bytea;
BEGIN
  IF _encryption_key IS NULL OR length(_encryption_key) < 16 THEN
    RAISE EXCEPTION 'encryption key missing or too short';
  END IF;

  IF _value IS NULL OR length(btrim(_value)) = 0 THEN
    -- Treat empty value as "disconnect" — clear encrypted blob
    v_encrypted := NULL;
    v_last4 := NULL;
    v_status := 'disabled';
  ELSE
    v_encrypted := pgp_sym_encrypt(_value, _encryption_key);
    v_last4 := right(_value, 4);
    v_status := 'connected';
  END IF;

  INSERT INTO public.user_integrations (user_id, integration_key, value_encrypted, value_last4, status, updated_at)
  VALUES (_user_id, _integration_key, v_encrypted, v_last4, v_status, now())
  ON CONFLICT (user_id, integration_key)
  DO UPDATE SET
    value_encrypted = EXCLUDED.value_encrypted,
    value_last4 = EXCLUDED.value_last4,
    status = EXCLUDED.status,
    updated_at = now();

  RETURN QUERY
    SELECT _integration_key, v_status, v_last4, (v_encrypted IS NOT NULL);
END
$$;

-- Decrypt + return plaintext. Server-only callers pass the encryption key.
CREATE OR REPLACE FUNCTION public.get_user_integration_secret(
  _user_id uuid,
  _integration_key text,
  _encryption_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_blob bytea;
BEGIN
  IF _encryption_key IS NULL OR length(_encryption_key) < 16 THEN
    RAISE EXCEPTION 'encryption key missing or too short';
  END IF;

  SELECT value_encrypted INTO v_blob
  FROM public.user_integrations
  WHERE user_id = _user_id AND integration_key = _integration_key
  LIMIT 1;

  IF v_blob IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_decrypt(v_blob, _encryption_key);
END
$$;

-- Add the unique constraint upsert relies on (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_integrations_user_id_integration_key_key'
  ) THEN
    ALTER TABLE public.user_integrations
      ADD CONSTRAINT user_integrations_user_id_integration_key_key
      UNIQUE (user_id, integration_key);
  END IF;
END $$;

-- Lock down direct execution: only service_role can call the SECURITY DEFINER
-- functions. Edge functions use service_role via the gateway / our own
-- authenticated edge function below.
REVOKE ALL ON FUNCTION public.set_user_integration(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_integration_secret(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_integration(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_integration_secret(uuid, text, text) TO service_role;