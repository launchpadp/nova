
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

UPDATE storage.buckets SET public = false WHERE id = 'brand-assets';

DROP POLICY IF EXISTS "brand_assets_public_read" ON storage.objects;
CREATE POLICY "brand_assets_org_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'brand-assets'
    AND public.is_org_member((storage.foldername(name))[1]::uuid, auth.uid()));
