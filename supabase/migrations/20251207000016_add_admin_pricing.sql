-- Add admin_price column to products table
-- This allows admin to override supplier's price
-- If admin_price is NULL, the original supplier price is used
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS admin_price DECIMAL(10,2);

-- Add comment to explain the column
COMMENT ON COLUMN public.products.admin_price IS 'Admin-set price that overrides supplier price. If NULL, supplier price is used.';

-- Create a view or function to get the effective price (admin_price if set, otherwise price)
CREATE OR REPLACE FUNCTION public.get_effective_price(product_row public.products)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(product_row.admin_price, product_row.price);
END;
$$ LANGUAGE plpgsql STABLE;
