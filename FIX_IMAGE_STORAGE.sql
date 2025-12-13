-- Fix product images storage and policies

-- 1. Ensure product-images bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public access to view images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 3. Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

-- 4. Allow users to update their own images
DROP POLICY IF EXISTS "Users can update their product images" ON storage.objects;
CREATE POLICY "Users can update their product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 5. Allow users to delete their own images
DROP POLICY IF EXISTS "Users can delete their product images" ON storage.objects;
CREATE POLICY "Users can delete their product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Verify policies
SELECT * FROM storage.buckets WHERE id = 'product-images';
