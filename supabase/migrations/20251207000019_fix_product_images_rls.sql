-- Add explicit admin policy for product_images to ensure admins can view all images
CREATE POLICY "Admins can view all product images" ON public.product_images
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
