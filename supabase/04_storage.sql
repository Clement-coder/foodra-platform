-- ============================================================
-- 04_storage.sql — Supabase Storage Buckets
-- Run after 03_rls.sql
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('trainings', 'trainings', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

CREATE POLICY "products_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "products_images_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'products' AND auth.role() = 'authenticated'
);

CREATE POLICY "trainings_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'trainings');
CREATE POLICY "trainings_images_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'trainings' AND auth.role() = 'authenticated'
);

CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
