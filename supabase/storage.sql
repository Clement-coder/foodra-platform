-- Enable storage for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('trainings', 'trainings', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for products bucket
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'products' AND auth.role() = 'authenticated'
);

-- Storage policies for trainings bucket
CREATE POLICY "Anyone can view training images" ON storage.objects FOR SELECT USING (bucket_id = 'trainings');
CREATE POLICY "Authenticated users can upload training images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'trainings' AND auth.role() = 'authenticated'
);

-- Storage policies for avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
