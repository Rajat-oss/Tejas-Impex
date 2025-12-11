-- ============================================
-- SUPPLIER DASHBOARD SETUP - SUPABASE SQL
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure app_role enum has supplier
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('user', 'admin', 'supplier');
  ELSE
    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supplier';
  END IF;
END $$;

-- Step 2: Add supplier fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS gst_number TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Step 3: Create supplier_products table
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  commission_percent DECIMAL(5,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, product_id)
);

-- Step 4: Enable RLS on supplier_products
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Suppliers can view own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can add products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can update own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Suppliers can delete own products" ON public.supplier_products;
DROP POLICY IF EXISTS "Admins can manage supplier products" ON public.supplier_products;

-- Step 6: Create RLS policies for supplier_products
CREATE POLICY "Suppliers can view own products" ON public.supplier_products
  FOR SELECT USING (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can add products" ON public.supplier_products
  FOR INSERT WITH CHECK (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can update own products" ON public.supplier_products
  FOR UPDATE USING (auth.uid() = supplier_id);

CREATE POLICY "Suppliers can delete own products" ON public.supplier_products
  FOR DELETE USING (auth.uid() = supplier_id);

-- Step 7: Admin can manage all supplier products (has_role function already exists)
CREATE POLICY "Admins can manage supplier products" ON public.supplier_products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Step 8: Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to 'user'
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'user'::app_role);
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name', 
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;

-- Step 9: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DONE! Now suppliers can:
-- 1. Sign up as supplier
-- 2. Access /supplier dashboard
-- 3. Manage their products
-- ============================================
