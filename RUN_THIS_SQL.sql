-- Copy this SQL and run in Supabase SQL Editor
-- This adds admin_price column to products table

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS admin_price DECIMAL(10,2);

COMMENT ON COLUMN public.products.admin_price IS 'Admin-set price that overrides supplier price. If NULL, supplier price is used.';
