-- Make product-images bucket completely public

-- 1. Make bucket public
UPDATE storage.buckets 
SET public = true
WHERE id = 'product-images';

-- 2. Allow everyone to view files (no authentication needed)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 3. Verify bucket is public
SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';

-- 4. Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%Public%';
