-- Check if images are being saved

-- 1. Check recent products
SELECT id, name, approval_status, created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check product_images table
SELECT pi.*, p.name as product_name
FROM product_images pi
LEFT JOIN products p ON pi.product_id = p.id
ORDER BY pi.created_at DESC
LIMIT 10;

-- 3. Check if any images exist
SELECT COUNT(*) as total_images FROM product_images;

-- 4. Check storage objects
SELECT name, bucket_id, created_at 
FROM storage.objects 
WHERE bucket_id = 'product-images'
ORDER BY created_at DESC
LIMIT 10;
