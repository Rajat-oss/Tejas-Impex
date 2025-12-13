# Admin Price Edit Setup Guide

## Step 1: Run Migration
1. Go to Supabase Dashboard
2. Click on "SQL Editor"
3. Copy and paste from `RUN_THIS_SQL.sql`
4. Click "Run"

## Step 2: Access Product Approvals Page
1. Login as Admin
2. Go to: `http://localhost:5173/admin/product-approvals`
3. Or click "Product Approvals" from Admin Dashboard

## Step 3: Test the Feature
1. Make sure you have a supplier account
2. Login as supplier and add a product
3. Product will be in "pending" status
4. Logout and login as admin
5. Go to Product Approvals page
6. You will see:
   - Supplier Price (original price)
   - Input field to "Set Admin Price"
   - Input field to "Set Stock Quantity"
7. Edit the price and stock
8. Click "Approve"

## Step 4: Verify
1. Go to Products page as regular user
2. Check that admin price is showing (not supplier price)

## Troubleshooting

### If Product Approvals page is empty:
- Make sure supplier has added products
- Check that products have `approval_status = 'pending'`
- Run this SQL to check:
```sql
SELECT id, name, price, approval_status, supplier_id 
FROM products 
WHERE approval_status = 'pending';
```

### If admin_price column doesn't exist:
- Run the migration from `RUN_THIS_SQL.sql`
- Check with:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'admin_price';
```

### To create a test product:
- Use `CREATE_TEST_PRODUCT.sql`
- Replace 'YOUR_SUPPLIER_ID' with actual supplier user ID

## How It Works

1. Supplier adds product with price ₹1000
2. Product status = "pending"
3. Admin goes to Product Approvals
4. Admin sees supplier price ₹1000
5. Admin changes price to ₹1200
6. Admin clicks Approve
7. Product is approved with admin_price = ₹1200
8. Users see ₹1200 (not ₹1000)

## Features

✅ Admin can edit price before approval
✅ Admin can edit stock before approval
✅ Original supplier price is preserved
✅ Users always see admin price (if set)
✅ Admin can approve or reject products
