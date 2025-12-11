# Supplier Approval System - Complete Setup Guide

## Overview
Suppliers need admin approval before they can access their dashboard and sell products.

## Setup Steps

### 1. Run SQL in Supabase
Open Supabase SQL Editor and run the code from `supplier_setup.sql`

**IMPORTANT:** Change the admin email on line 72:
```sql
admin_email TEXT := 'your-admin@email.com'; -- CHANGE THIS!
```

### 2. How It Works

#### For Suppliers:
1. User signs up and selects "Supplier" role
2. Account is created with `approval_status = 'pending'`
3. After login, they see "Waiting for Approval" page at `/supplier-pending`
4. They cannot access supplier dashboard until approved
5. Once approved by admin, they can access `/supplier` dashboard

#### For Admin:
1. Admin logs in and goes to Admin Dashboard
2. Clicks on "Supplier Approvals" card
3. Sees list of all supplier requests (pending, approved, rejected)
4. Can approve or reject each supplier
5. Approved suppliers get `approval_status = 'approved'` and `is_verified = true`

### 3. New Pages Created

- **`/supplier-pending`** - Waiting approval page for suppliers
- **`/admin/suppliers`** - Admin page to manage supplier approvals

### 4. Database Changes

Added to `profiles` table:
- `approval_status` - 'pending', 'approved', or 'rejected'
- Suppliers start with 'pending'
- Users and admins are auto-approved

### 5. Features

✅ Only approved suppliers can access dashboard
✅ Only approved suppliers can add/manage products
✅ Pending suppliers see waiting page with contact info
✅ Admin can approve/reject from one page
✅ Shows supplier details (name, email, phone, business info)
✅ Status badges (Pending/Approved/Rejected)
✅ Email notifications ready (contact info shown)

### 6. Security

- Only one admin allowed (hardcoded email)
- Suppliers cannot bypass approval (RLS policies)
- Unapproved suppliers have no product access
- Admin has full control over approvals

## Testing

1. Sign up as supplier with any email
2. Login - should redirect to `/supplier-pending`
3. Login as admin
4. Go to `/admin/suppliers`
5. Approve the supplier
6. Logout and login as supplier again
7. Should now access `/supplier` dashboard

## Contact Support

Update contact details in `SupplierPending.tsx`:
- Email: Line 52
- Phone: Line 56
