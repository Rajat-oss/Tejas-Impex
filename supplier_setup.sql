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
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

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

-- Step 6: Create RLS policies for supplier_products (only approved suppliers)
CREATE POLICY "Approved suppliers can view own products" ON public.supplier_products
  FOR SELECT USING (
    auth.uid() = supplier_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approval_status = 'approved')
  );

CREATE POLICY "Approved suppliers can add products" ON public.supplier_products
  FOR INSERT WITH CHECK (
    auth.uid() = supplier_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approval_status = 'approved')
  );

CREATE POLICY "Approved suppliers can update own products" ON public.supplier_products
  FOR UPDATE USING (
    auth.uid() = supplier_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approval_status = 'approved')
  );

CREATE POLICY "Approved suppliers can delete own products" ON public.supplier_products
  FOR DELETE USING (
    auth.uid() = supplier_id AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND approval_status = 'approved')
  );

-- Step 7: Admin can manage all supplier products (has_role function already exists)
CREATE POLICY "Admins can manage supplier products" ON public.supplier_products
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Step 8: Update handle_new_user function (Only specific email can be admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role app_role;
  requested_role app_role;
  admin_email TEXT := 'admin@tejasimpex.com'; -- CHANGE THIS TO YOUR ADMIN EMAIL
  profile_approval_status TEXT;
BEGIN
  -- Get requested role from metadata
  requested_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'user'::app_role);
  
  -- Only allow admin role for specific email, otherwise force to user/supplier
  IF requested_role = 'admin' AND NEW.email != admin_email THEN
    user_role := 'user'::app_role; -- Force to user if not admin email
  ELSE
    user_role := requested_role;
  END IF;
  
  -- Set approval status: suppliers need approval, others are auto-approved
  IF user_role = 'supplier' THEN
    profile_approval_status := 'pending';
  ELSE
    profile_approval_status := 'approved';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, phone, approval_status)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name', 
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    profile_approval_status
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
