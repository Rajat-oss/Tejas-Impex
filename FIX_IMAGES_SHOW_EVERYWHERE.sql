-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR TO ENSURE IMAGES SHOW ON ALL PRODUCT PAGES ⚠️

-- 1. Ensure storage bucket exists and is PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop and recreate storage policies to ensure public access
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Suppliers can delete their product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage product images storage" ON storage.objects;

-- Allow PUBLIC (unauthenticated) to view images
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Allow authenticated users to view images
CREATE POLICY "Authenticated can view product images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-images');

-- Allow suppliers to upload images
CREATE POLICY "Suppliers can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (public.has_role(auth.uid(), 'supplier') OR public.has_role(auth.uid(), 'admin'))
  );

-- Allow suppliers to update their images
CREATE POLICY "Suppliers can update their product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (public.has_role(auth.uid(), 'supplier') OR public.has_role(auth.uid(), 'admin'))
  );

-- Allow suppliers to delete their images
CREATE POLICY "Suppliers can delete their product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (public.has_role(auth.uid(), 'supplier') OR public.has_role(auth.uid(), 'admin'))
  );

-- 3. Ensure product_images table policies allow everyone to view
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;

-- Allow EVERYONE (including unauthenticated) to view product images
CREATE POLICY "Anyone can view product images" ON public.product_images
  FOR SELECT
  USING (true);

-- 4. Verify all products have proper structure
-- Check if any products are missing from product_images
SELECT 
  p.id,
  p.name,
  p.approval_status,
  COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name, p.approval_status
HAVING COUNT(pi.id) = 0
ORDER BY p.created_at DESC;

-- 5. Test query - This should return products with images
SELECT 
  p.id,
  p.name,
  p.approval_status,
  pi.image_url
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
ORDER BY p.created_at DESC
LIMIT 10;

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Image policies updated successfully!';
  RAISE NOTICE '✅ Storage bucket is now PUBLIC';
  RAISE NOTICE '✅ Everyone can view product images';
  RAISE NOTICE '✅ Suppliers can upload/update/delete images';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '1. Supplier uploads product with image';
  RAISE NOTICE '2. Admin approves product (if needed)';
  RAISE NOTICE '3. Image will show on ALL product pages';
END $$;
