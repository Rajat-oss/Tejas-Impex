-- Run this to create a test pending product
-- Replace 'YOUR_SUPPLIER_ID' with actual supplier user ID

INSERT INTO public.products (
  name,
  slug,
  price,
  description,
  stock_quantity,
  supplier_id,
  approval_status,
  is_active
) VALUES (
  'Test Product for Approval',
  'test-product-approval',
  1000,
  'This is a test product to check admin approval and pricing',
  50,
  'YOUR_SUPPLIER_ID',  -- Replace with actual supplier ID
  'pending',
  true
);
