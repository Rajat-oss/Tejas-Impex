# Order Tracking System Guide

## Overview
This system allows users to track their orders and suppliers to manage orders directly in their dashboard.

## Features Implemented

### 1. Order Tracking Page (`/order-tracking/:orderId`)
- Visual tracking timeline showing order status (Placed → Processing → Shipped → Delivered)
- Order details with items, quantities, and prices
- Delivery address information
- Payment details and status
- Accessible from the Orders page via "Track Order" button

### 2. Supplier Order Management
- Orders automatically go to suppliers when placed
- Suppliers can view all orders containing their products at `/supplier/orders`
- Suppliers can accept or reject individual order items
- Order items have three statuses: `pending`, `accepted`, `rejected`

### 3. Database Changes
- Added `supplier_status` column to `order_items` table
- Created RLS policies for:
  - Users to view their own orders
  - Suppliers to view orders with their products
  - Suppliers to update order item status

## How It Works

### For Users:
1. User places an order from cart
2. Order is created with status "placed"
3. User can view order in `/orders` page
4. User clicks "Track Order" to see detailed tracking at `/order-tracking/:orderId`
5. Tracking page shows visual timeline of order progress

### For Suppliers:
1. When user orders a product, it appears in supplier's dashboard
2. Supplier navigates to `/supplier/orders` from dashboard
3. Supplier sees all orders containing their products
4. Supplier can accept or reject each order item
5. Order item status updates in real-time

## Order Status Flow
- **placed** → Order just created
- **processing** → Order being prepared
- **shipped** → Order dispatched
- **delivered** → Order completed
- **cancelled** → Order cancelled by user

## Supplier Item Status
- **pending** → Waiting for supplier action
- **accepted** → Supplier confirmed the order
- **rejected** → Supplier declined the order

## Setup Instructions

1. Run the migration:
```sql
-- Run this in Supabase SQL Editor
\i supabase/migrations/20251207000012_order_tracking_system.sql
```

2. Routes are already configured in App.tsx:
   - `/order-tracking/:orderId` - User order tracking
   - `/supplier/orders` - Supplier order management

3. Test the flow:
   - Login as a user
   - Add products to cart
   - Complete checkout
   - View order in `/orders`
   - Click "Track Order"
   - Login as supplier
   - Navigate to `/supplier/orders`
   - Accept/reject order items

## Key Components

### OrderTracking.tsx
- Displays order tracking timeline
- Shows order details and delivery info
- Visual progress indicator

### supplier/Orders.tsx
- Lists all orders with supplier's products
- Accept/reject buttons for each item
- Order status badges

## Database Policies
- Users can only view their own orders
- Suppliers can only view orders containing their products
- Suppliers can only update status of their own product orders
