# Admin Pricing Feature Guide

## Overview
Admins can now set custom prices for products that override the supplier's original prices. When users view products, they will see the admin-set price instead of the supplier's price.

## How It Works

### Database Changes
- Added `admin_price` column to the `products` table
- If `admin_price` is set, it will be displayed to users
- If `admin_price` is NULL, the original supplier `price` is used

### Admin Features
1. **View Supplier Prices**: Admins can see both supplier price and admin price in the products table
2. **Set Admin Price**: Click the edit icon next to "Admin Price" to set or update the price
3. **Clear Admin Price**: Leave the field empty and save to remove admin pricing (reverts to supplier price)

### User Experience
- Regular users see only the effective price (admin price if set, otherwise supplier price)
- Admins see both prices when viewing products:
  - Main price shown: Admin price (if set) or Supplier price
  - Supplier price shown as strikethrough when admin price is set

### Where Admin Pricing Applies
- Product listing page
- Product detail page
- Shopping cart
- Order checkout
- Order history

## Setup Instructions

### 1. Run the Migration
Execute the migration file to add the `admin_price` column:
```sql
-- File: supabase/migrations/20251207000016_add_admin_pricing.sql
```

Run this in your Supabase SQL editor or via CLI:
```bash
supabase db push
```

### 2. Set Admin Prices
1. Login as admin
2. Navigate to Admin > Products
3. Find the product you want to price
4. Click the edit icon in the "Admin Price" column
5. Enter the new price
6. Click "Save"

### 3. Remove Admin Pricing
To revert to supplier pricing:
1. Click edit on the admin price
2. Clear the input field
3. Click "Save"

## Example Scenarios

### Scenario 1: Markup
- Supplier price: ₹1000
- Admin sets price: ₹1200
- Users see: ₹1200

### Scenario 2: Discount
- Supplier price: ₹1000
- Admin sets price: ₹800
- Users see: ₹800

### Scenario 3: No Admin Price
- Supplier price: ₹1000
- Admin price: Not set
- Users see: ₹1000

## Technical Details

### Database Schema
```sql
ALTER TABLE public.products 
ADD COLUMN admin_price DECIMAL(10,2);
```

### Price Resolution Logic
```javascript
const effectivePrice = product.admin_price || product.price;
```

This ensures:
- If admin_price exists, use it
- If admin_price is NULL, use supplier's price
- No breaking changes to existing functionality
