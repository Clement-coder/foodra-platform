# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

## 2. Run Database Schema

In your Supabase SQL Editor, run the following files in order:

### Core Setup (Required):
1. `schema.sql` - Creates all tables and indexes
2. `rls.sql` - Enables Row Level Security policies
3. `storage.sql` - Sets up storage buckets for images

### Feature Extensions (Run in Order):
4. `alter_users_profile_fields.sql` - Adds phone and role to users
5. `cart_management.sql` - Shopping cart functionality
6. `escrow_migration.sql` - Blockchain escrow integration
7. `rls_escrow.sql` - Escrow security policies
8. `delivery_addresses.sql` - User delivery addresses
9. `admin_support.sql` - Admin support system
10. `notifications.sql` - In-app notifications
11. `wallet_funding.sql` - Wallet funding requests
12. `ratings_comments.sql` - Product ratings and comments
13. `add_product_unit.sql` - Product unit field
14. `order_disputes.sql` - Order dispute system
15. `terms_acceptance.sql` - Terms acceptance tracking
16. `push_subscriptions.sql` - PWA push notifications

### Latest Features (April 2026):
17. `credit_score.sql` - AI credit scoring system ✅
18. `order_tracking.sql` - Enhanced order tracking ✅
19. `wishlist.sql` - Product wishlist with price alerts ✅
20. `product_views.sql` - Product analytics tracking ✅
21. `farmer_verification.sql` - Farmer verification system ✅
22. `search_indexes.sql` - Search performance optimization ✅
23. `seed.sql` - Sample data for testing ✅

## 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 4. Install Dependencies

```bash
cd frontend
npm install @supabase/supabase-js
```

## 5. Test Connection

Start the development server:

```bash
npm run dev
```

## Database Structure

### Tables

- **users** - User profiles synced with Privy auth
- **products** - Marketplace product listings
- **trainings** - Training programs
- **training_enrollments** - User enrollments in trainings
- **funding_applications** - Loan/grant applications
- **orders** - Purchase orders
- **order_items** - Items within orders

### Storage Buckets

- **products** - Product images
- **trainings** - Training images
- **avatars** - User avatars

## Security

All tables have Row Level Security (RLS) enabled:

- Users can only modify their own data
- Farmers can only manage their own products
- Public read access for marketplace items
- Private access for orders and applications

## API Routes

All data access goes through Next.js API routes:

- `/api/products` - Product CRUD
- `/api/trainings` - Training programs
- `/api/trainings/enroll` - Enrollment
- `/api/funding` - Funding applications
- `/api/orders` - Order management
- `/api/users` - User profiles
