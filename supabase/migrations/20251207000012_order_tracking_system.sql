-- Add supplier_status column to order_items if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'supplier_status'
  ) THEN
    ALTER TABLE public.order_items 
    ADD COLUMN supplier_status TEXT DEFAULT 'pending' CHECK (supplier_status IN ('pending', 'accepted', 'rejected'));
  END IF;
END $$;

-- Update existing order_items to have pending status
UPDATE public.order_items 
SET supplier_status = 'pending' 
WHERE supplier_status IS NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Suppliers can update order item status" ON public.order_items;

-- Allow users to view their own orders for tracking
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to view their own order items
CREATE POLICY "Users can view their own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Allow suppliers to update order item status
CREATE POLICY "Suppliers can update order item status" ON public.order_items
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'supplier') AND
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = order_items.product_id AND supplier_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'supplier') AND
    EXISTS (
      SELECT 1 FROM public.products
      WHERE id = order_items.product_id AND supplier_id = auth.uid()
    )
  );
