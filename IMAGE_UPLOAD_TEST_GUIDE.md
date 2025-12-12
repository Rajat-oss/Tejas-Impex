# 🖼️ Image Upload & Display - Complete Test Guide

## ✅ What's Fixed

1. **All Image Formats Supported:**
   - JPEG/JPG ✅
   - PNG ✅
   - GIF ✅
   - WebP ✅
   - BMP ✅
   - SVG ✅

2. **Image Shows Everywhere:**
   - Supplier Dashboard ✅
   - Admin Panel ✅
   - Products Page ✅
   - Product Detail Page ✅
   - New Arrivals ✅
   - Brand Pages ✅
   - Category Pages ✅
   - Cart ✅
   - Wishlist ✅
   - Orders ✅

## 🚀 Step-by-Step Test

### Step 1: Run SQL Fix
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste `FIX_IMAGES_SHOW_EVERYWHERE.sql`
4. Click **Run**
5. Wait for success message

### Step 2: Supplier Uploads Product
1. **Login as Supplier**
2. Go to **Supplier Dashboard**
3. Click **"Add Product"**
4. Fill product details:
   - Name: "Test Product"
   - Price: 100
   - Stock: 10
   - SKU: PCS
5. **Upload Image** (any format: JPG, PNG, GIF, WebP, etc.)
6. See **image preview** immediately
7. Click **"Add Product"**
8. Product created with image!

### Step 3: Verify in Supplier Dashboard
1. Go back to **Supplier Dashboard**
2. See your product in the list
3. **Image should be visible** ✅
4. Status shows "Pending" (yellow badge)

### Step 4: Admin Approves Product
1. **Login as Admin**
2. Go to **Supplier Approvals** (`/admin/suppliers`)
3. Click on the supplier
4. Find the product in products list
5. **Image should be visible** ✅
6. Click **Green Checkmark** to approve
7. Product status changes to "Approved"

### Step 5: Verify on Public Pages
1. **Logout** (or open incognito window)
2. Go to **Products Page** (`/products`)
3. **Image should be visible** ✅
4. Click on product
5. **Product Detail Page** - Image should be visible ✅
6. Check **New Arrivals** - Image should be visible ✅

## 🔍 Troubleshooting

### Issue: Image not uploading
**Check:**
```sql
-- See if storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'product-images';
```
**Fix:** Run `FIX_IMAGES_SHOW_EVERYWHERE.sql`

### Issue: Image uploaded but not showing
**Check:**
```sql
-- See if image is in database
SELECT p.name, pi.image_url 
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.name = 'Test Product';
```
**Fix:** 
- If `image_url` is NULL → Image didn't upload, try again
- If `image_url` exists → Check browser console for errors

### Issue: Image shows in admin but not public pages
**Check:**
```sql
-- Check approval status
SELECT name, approval_status FROM products WHERE name = 'Test Product';
```
**Fix:** 
- If `approval_status = 'pending'` → Admin needs to approve
- If `approval_status = 'approved'` → Clear browser cache

### Issue: 403 Forbidden error
**Problem:** Storage bucket not public or RLS policy blocking

**Fix:** Run this:
```sql
-- Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Allow public access
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
```

## 📊 Verification Queries

### Check all products with images:
```sql
SELECT 
  p.id,
  p.name,
  p.approval_status,
  pi.image_url,
  p.created_at
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
ORDER BY p.created_at DESC;
```

### Check storage bucket status:
```sql
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'product-images';
```

### Check storage policies:
```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%product%';
```

## ✅ Success Checklist

After following all steps, verify:

- [ ] Supplier can upload images (all formats)
- [ ] Image preview shows during upload
- [ ] Image appears in Supplier Dashboard
- [ ] Image appears in Admin Panel
- [ ] Admin can approve product
- [ ] Image appears on Products page
- [ ] Image appears on Product Detail page
- [ ] Image appears on New Arrivals
- [ ] Image appears in Cart (after adding)
- [ ] Image appears in Wishlist (after adding)
- [ ] No console errors
- [ ] No 403 Forbidden errors
- [ ] No broken image icons

## 🎯 Expected Result

**After completing all steps:**
1. Supplier uploads product with image → ✅ Works
2. Image shows in supplier dashboard → ✅ Works
3. Admin approves product → ✅ Works
4. Image shows on ALL public pages → ✅ Works
5. All image formats supported → ✅ Works

## 📝 Notes

- **Pending products** show in Supplier Dashboard and Admin Panel only
- **Approved products** show on public pages (Products, New Arrivals, etc.)
- Images are stored in Supabase Storage bucket `product-images`
- Image URLs are stored in `product_images` table
- Storage bucket is PUBLIC (anyone can view)
- RLS policies allow everyone to view images

## 🆘 Still Not Working?

1. Check browser console (F12) for errors
2. Run `DEBUG_IMAGE_ISSUE.sql` to see diagnostic info
3. Verify Supabase Storage bucket exists
4. Verify RLS policies are applied
5. Clear browser cache and try again
6. Try uploading a different image format
7. Check if file size is too large (max 50MB)

## 🎉 Success!

If images are showing everywhere, you're done! 🚀

The system now supports:
- ✅ All image formats
- ✅ Image preview during upload
- ✅ Images on all pages
- ✅ Public access to images
- ✅ Supplier upload capability
- ✅ Admin approval workflow
