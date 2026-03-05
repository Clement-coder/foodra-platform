# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

## 2. Run Database Schema

In your Supabase SQL Editor, run the following files in order:

1. `schema.sql` - Creates all tables and indexes
2. `rls.sql` - Enables Row Level Security policies
3. `storage.sql` - Sets up storage buckets for images
4. `seed.sql` - (Optional) Adds sample training data

If your project already has an existing `users` table from an older setup, run:

5. `alter_users_profile_fields.sql` - Adds `phone` and `role` to users for profile completion

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
