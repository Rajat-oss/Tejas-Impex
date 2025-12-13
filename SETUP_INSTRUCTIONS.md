# Tejas Impex Platform - Setup Instructions

## Database Setup

Run these SQL files in Supabase SQL Editor in order:

1. **FINAL_FIX.sql** - Main database schema and policies
2. **ENABLE_IMAGES_REALTIME.sql** - Enable realtime for product images

## User Roles

- **Admin**: Approve/reject products from suppliers
- **Finance**: Set final prices for approved products
- **Supplier**: Add products to the platform
- **User**: Browse and purchase products

## Workflow

1. Supplier adds product → Status: `pending`
2. Admin approves → Status: `finance_pending` → Goes to Finance
3. Finance sets price → Status: `approved` → Live for customers

## Important Files

- `FINAL_FIX.sql` - Database schema
- `ENABLE_IMAGES_REALTIME.sql` - Realtime configuration
- `README.md` - Project documentation
