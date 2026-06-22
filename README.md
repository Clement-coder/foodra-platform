# Foodra Platform

AgriTech Platform for Food Security and Buyer Empowerment

Foodra is an agricultural technology platform that sells quality farm commodities directly to buyers, provides agricultural training programs, funding opportunities, and an NGN digital wallet. Foodra owns and manages all products on the platform — there are no third-party sellers or farmer listings. When a buyer places an order, Foodra ships the goods directly to them.

The platform is designed to drive financial inclusion, improve access to food, and support the African food supply chain, starting with Nigeria.

## Business Model

- **Foodra is the sole merchant.** All products listed on the platform are owned and managed by Foodra.
- **No third-party sellers.** There are no farmer or vendor accounts that list products.
- **Direct fulfilment.** Foodra ships farm commodities directly to buyers upon order confirmation.
- **Buyers only.** Users on the platform are buyers. Product management is handled exclusively by Foodra admins.

## Vision

To contribute towards an Africa that does not depend on the outside world to feed her. Using the least available resources to maximize the capacity of the African food production and supply chain. Through the application of technology, available financial support, and market availability, food security will improve across Africa.

## Mission

To offer value through sustainable agricultural practices and a fair supply chain. This includes practices that protect our environment, fair value distribution, and empowering people through technology and market access.

## Core Features

### 1. Marketplace
- Browse and purchase fresh agricultural products owned and sold by Foodra
- Advanced filtering: category, price range, location, sort order
- Related products on product detail pages
- Wishlist with price alerts
- Product view tracking for analytics
- Search with debounce and full-text support
- All products managed by Foodra admins — no third-party listings

### 2. Shopping & Checkout
- Shopping cart with quantity management
- Checkout directly from wallet balance (NGN)
- Order tracking from placement to delivery
- Dispute resolution for order issues

### 3. Training Programs
- Access to online and offline agricultural training sessions
- Expert instructors teaching modern farming techniques
- Enrollment system with capacity tracking
- Training categories covering various farming practices

### 4. Funding Applications
- Apply for agricultural loans and grants
- **AI Credit Scoring** — explainable rule-based engine scoring 0–100 with tier and recommendation
- Application tracking (Pending, Approved, Rejected)
- Admin review with credit score breakdown

### 5. NGN Digital Wallet
- Paystack-powered NGN wallet (custodial ledger model)
- Fund wallet via Paystack (debit/credit card, bank transfer)
- Send NGN to other Foodra users by Foodra Tag (e.g. FDR-A1B2C3)
- Withdraw to any Nigerian bank account
- Full transaction history
- Pay for marketplace orders directly from wallet balance

### 6. User Authentication & Profiles
- Authentication via Privy (email, social login)
- User profiles with avatar generation
- Profile completion tracking
- Membership tier system (Seed → Champion)

### 7. Multi-Language Support
- English, Yoruba (Yorùbá), Hausa, Igbo
- Language switcher in NavBar
- Persistent locale preference

### 8. Admin Dashboard
- Full product management (create, edit, delete) — admins are the only ones who manage listings
- Users, funding, orders, disputes, trainings, support management
- Analytics with revenue charts, user growth, category breakdown
- Broadcast notifications to all users
- CSV export for orders, users, and funding data
- AI credit score visible on each funding application
- Withdrawal approvals and Paystack transfer management

### 9. Sales Dashboard
- Revenue analytics with monthly charts
- Top products by revenue
- Order management with shipping workflow

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, NextUI
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Privy (email + social login)
- **Storage**: Supabase Storage (images)
- **API**: Next.js API Routes

### Payments
- **Payment Gateway**: Paystack (NGN)
- **Wallet Model**: Custodial ledger — Foodra holds funds, tracks per-user balances in DB
- **Withdrawals**: Paystack Transfers API → Nigerian bank accounts

### Additional Libraries
- **Date Handling**: date-fns
- **Email**: EmailJS
- **Analytics**: Vercel Analytics

## Project Structure

```
foodra-platform/
├── frontend/
│   ├── app/
│   │   ├── marketplace/        # Product listings and detail pages
│   │   ├── training/           # Training programs
│   │   ├── funding/            # Funding applications
│   │   ├── wallet/             # NGN wallet (fund, send, withdraw)
│   │   ├── profile/            # User profiles
│   │   ├── shop/               # Shopping cart and checkout
│   │   ├── orders/             # Order management
│   │   ├── sales/              # Sales analytics dashboard
│   │   ├── wishlist/           # Wishlist with price alerts
│   │   ├── admin/              # Admin dashboard (product & platform management)
│   │   ├── users/              # User directory
│   │   ├── search/             # Search functionality
│   │   └── api/                # API routes
│   ├── components/             # Reusable UI components
│   └── lib/
│       ├── types.ts            # TypeScript interfaces
│       ├── i18n.ts             # Multi-language support
│       ├── creditScore.ts      # AI credit scoring engine
│       ├── wishlist.ts         # Wishlist utilities
│       ├── rateLimit.ts        # API rate limiting
│       ├── seo.ts              # SEO metadata helpers
│       ├── formatters.ts       # Currency formatters
│       └── analytics.ts        # Event tracking
└── supabase/
    ├── 01_schema.sql           # Core tables
    ├── 02_wallet.sql           # Wallet ledger tables
    ├── 03_rls.sql              # Row level security
    ├── 04_storage.sql          # Storage buckets
    ├── 05_notifications.sql
    ├── 06_support.sql
    ├── 07_cart.sql
    ├── 08_disputes.sql
    ├── 09_ratings_comments.sql
    ├── 10_push_subscriptions.sql
    ├── 11_membership.sql
    ├── 12_wishlist_views.sql
    └── 13_seed.sql             # Optional sample data
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- Supabase account
- Paystack account

### Database Setup

Run SQL scripts in `/supabase` folder in order (01 → 13) in the Supabase SQL editor.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your credentials
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PAYSTACK_SECRET_KEY=sk_live_xxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxx
NEXT_PUBLIC_APP_URL=https://foodramarket.com
```

## Implementation Status

### ✅ Complete
- Marketplace (Foodra-owned products) with advanced filtering, related products, wishlist, price alerts
- Training program enrollment system
- Funding applications with AI credit scoring
- NGN digital wallet (fund, send, withdraw) powered by Paystack
- Wallet-based marketplace checkout
- User authentication and profiles via Privy
- Shopping cart and order management
- Transaction history tracking
- Sales analytics dashboard
- Admin dashboard (product management, users, funding, orders, disputes, analytics, CSV export)
- Notification system (in-app + push)
- Dispute resolution workflow
- Multi-language support (EN, YO, HA, IG)
- SEO metadata and JSON-LD structured data
- PWA with offline detection
- Rate limiting on sensitive endpoints
- Product analytics and view tracking
- Wishlist with price alerts
- Enhanced order tracking
- Search performance optimization
- Membership tier system

### 📋 Planned
- Mobile application
- Insurance integration
- AI-powered crop disease detection

## License

MIT

---

**Foodra Platform** — Building the future of African agriculture through technology, inclusion, and fair access.
