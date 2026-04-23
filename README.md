# Foodra Platform

Blockchain-Powered AgriTech Ecosystem for Food Security and Farmer Empowerment

Foodra is a decentralized agricultural technology platform that empowers smallholder farmers with direct market access, training programs, funding opportunities, and blockchain-based digital wallets. The platform is designed to drive financial inclusion, improve productivity, and strengthen food security across Africa, starting with Nigeria.

## Vision

To contribute towards an Africa that does not depend on the outside world to feed her. Using the least available resources to maximize the capacity of the African food production and supply chain. Through the application of technology, available financial support, and market availability, smallholder farmers will boost in capacity and in turn boost the African food capacity.

## Mission

To offer value to African farmers through sustainable practices and a sustainable supply chain. This includes sustainable practices that protect our environment, a sustainable supply chain that ensures fair value distribution, and farmer empowerment through technology and market access.

## Core Features

### 1. Marketplace
- Farmers can list, edit, and delete agricultural products
- Advanced filtering: category, price range, location, sort order
- Related products section on product detail pages
- Wishlist with price alerts (localStorage + server-side)
- Product view tracking for analytics
- Search with debounce and full-text support

### 2. Training Programs
- Access to online and offline agricultural training sessions
- Expert instructors teaching modern farming techniques
- Enrollment system with capacity tracking
- Training categories covering various farming practices

### 3. Funding Applications
- Farmers can apply for loans and grants
- **AI Credit Scoring** — explainable rule-based engine scoring 0–100 with tier and recommendation
- Application tracking (Pending, Approved, Rejected)
- Admin review with credit score breakdown

### 4. Digital Wallet
- Blockchain-based wallet integration via Privy
- Support for Base and Base Sepolia networks
- ETH balance tracking with real-time conversion to USD, USDC, and NGN
- Send and receive cryptocurrency
- Transaction history with filtering
- QR code generation for receiving payments
- MoonPay/Coinbase fiat on-ramp

### 5. User Authentication & Profiles
- Decentralized authentication via Privy
- Wallet-based identity management
- User profiles with avatar generation
- Profile completion tracking
- Farmer verification system

### 6. Multi-Language Support
- English, Yoruba (Yorùbá), Hausa, Igbo
- Language switcher in NavBar
- Persistent locale preference

### 7. Admin Dashboard
- Users, products, funding, orders, disputes, trainings, support, wallet requests
- Analytics with revenue charts, user growth, category breakdown
- Broadcast notifications to all users
- CSV export for orders, users, and funding data
- AI credit score visible on each funding application

### 8. Farmer Sales Dashboard
- Revenue analytics with monthly charts
- Top products by revenue
- Escrow status breakdown
- Order management with shipping workflow

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, NextUI
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Privy (wallet-based auth)
- **Storage**: Supabase Storage (images)
- **API**: Next.js API Routes

### Blockchain & Web3
- **Wallet Integration**: Privy
- **Blockchain Network**: Base (Mainnet & Sepolia Testnet)
- **Web3 Library**: Ethers.js, Wagmi
- **Escrow Contract**: FoodraEscrow (USDC, 2.5% fee, 7-day auto-release)

### Additional Libraries
- **QR Codes**: qrcode.react
- **Date Handling**: date-fns
- **Email**: EmailJS
- **Analytics**: Vercel Analytics

## Project Structure

```
foodra-platform/
├── frontend/
│   ├── app/
│   │   ├── marketplace/        # Product listings, detail, edit
│   │   ├── training/           # Training programs
│   │   ├── funding/            # Funding applications
│   │   ├── wallet/             # Crypto wallet interface
│   │   ├── profile/            # User profiles
│   │   ├── shop/               # Shopping cart and checkout
│   │   ├── orders/             # Order management
│   │   ├── sales/              # Farmer sales dashboard
│   │   ├── wishlist/           # Wishlist with price alerts
│   │   ├── admin/              # Admin dashboard
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
│       ├── formatters.ts       # Currency/address formatters
│       └── analytics.ts        # Event tracking
└── smartcontract/
    ├── contracts/              # FoodraEscrow.sol, MockUSDC.sol
    ├── scripts/                # deploy.ts, deploy-mainnet.ts, verify.ts
    └── test/                   # 25+ comprehensive tests
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- MetaMask or compatible Web3 wallet
- Supabase account

### Database Setup (IMPORTANT)

Run SQL scripts in `/supabase` folder in order. **All recent files have been fixed for UUID compatibility**:

1. Core: `schema.sql`, `rls.sql`, `storage.sql`
2. Features: `cart_management.sql`, `notifications.sql`, `ratings_comments.sql`  
3. Latest: `credit_score.sql`, `wishlist.sql`, `product_views.sql`, `farmer_verification.sql`

See `SQL_MIGRATION_CHECKLIST.md` for complete setup guide.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your credentials
npm run dev
```

### Smart Contract Setup

```bash
cd smartcontract
pnpm install
cp .env.example .env
npx hardhat compile
npx hardhat test
# Deploy to testnet
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Supabase Setup

Run SQL scripts in `/supabase` in order:
1. `schema.sql` — core tables
2. `rls.sql` — security policies
3. `storage.sql` — image storage
4. `cart_management.sql`, `notifications.sql`, `ratings_comments.sql`
5. `escrow_migration.sql`, `order_tracking.sql`
6. `credit_score.sql`, `wishlist.sql`, `product_views.sql`
7. `farmer_verification.sql`, `search_indexes.sql`
8. `seed.sql` — optional sample data

## Implementation Status

### ✅ Complete
- Marketplace with advanced filtering, related products, wishlist, price alerts
- Training program enrollment system
- Funding applications with AI credit scoring
- Digital wallet with multi-chain support and fiat on-ramp
- User authentication and profiles
- Shopping cart and escrow-based checkout
- Transaction history tracking
- Farmer sales analytics dashboard
- Admin dashboard (users, products, funding, orders, disputes, analytics, CSV export)
- Notification system (in-app + push)
- Dispute resolution workflow
- Multi-language support (EN, YO, HA, IG)
- Smart contract (FoodraEscrow) with 25+ tests
- Base Mainnet deployment scripts
- SEO metadata and JSON-LD structured data
- PWA with offline detection
- Rate limiting on sensitive endpoints
- Farmer verification system (DB layer)
- **Product analytics and view tracking** ✅
- **Wishlist with price alerts** ✅
- **Enhanced order tracking** ✅
- **Search performance optimization** ✅

### 📋 Planned
- IPFS integration for decentralized storage
- Mobile application
- Insurance integration
- AI-powered crop disease detection

## License

MIT

---

**Foodra Platform Status**: Build ready ✅ | Database integrated ✅ | Deployment 70% complete

Recent updates (April 2026):
- Fixed all TypeScript build errors
- Resolved SQL schema type mismatches  
- Integrated wishlist, product analytics, farmer verification
- Enhanced search performance and order tracking
- All recent SQL files now UUID-compatible

Missing for production: Privy credentials, VAPID keys, treasury wallet address.


Foodra is a decentralized agricultural technology platform that empowers smallholder farmers with direct market access, training programs, funding opportunities, and blockchain-based digital wallets. The platform is designed to drive financial inclusion, improve productivity, and strengthen food security across Africa, starting with Nigeria.

## Vision

To contribute towards an Africa that does not depend on the outside world to feed her. Using the least available resources to maximize the capacity of the African food production and supply chain. Through the application of technology, available financial support, and market availability, smallholder farmers will boost in capacity and in turn boost the African food capacity.

## Mission

To offer value to African farmers through sustainable practices and a sustainable supply chain. This includes sustainable practices that protect our environment, a sustainable supply chain that ensures fair value distribution, and farmer empowerment through technology and market access.

## Core Features

### 1. Marketplace
- Farmers can list and sell agricultural products directly to buyers
- Product listings include name, category, quantity, price, description, and images
- Search and filter functionality by category
- Direct connection between farmers and buyers, eliminating middlemen
- Real-time product availability tracking

### 2. Training Programs
- Access to online and offline agricultural training sessions
- Expert instructors teaching modern farming techniques
- Enrollment system with capacity tracking
- Training categories covering various farming practices
- Digital and in-person education options

### 3. Funding Applications
- Farmers can apply for loans and grants
- Application tracking system (Pending, Approved, Rejected)
- Detailed application forms capturing farm size, experience, and funding needs
- Transparent funding request and approval workflow
- User-specific application dashboard

### 4. Digital Wallet
- Blockchain-based wallet integration via Privy
- Support for Base and Base Sepolia networks
- ETH balance tracking with real-time conversion to USD, USDC, and NGN
- Send and receive cryptocurrency
- Transaction history with filtering (all, sent, received)
- QR code generation for receiving payments
- Multi-chain support with easy network switching

### 5. User Authentication & Profiles
- Decentralized authentication via Privy
- Wallet-based identity management
- User profiles with avatar generation
- Profile completion tracking
- Secure session management

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI, NextUI
- **Animations**: Framer Motion
- **Forms**: React Hook Form with validation
- **State Management**: React hooks

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Privy (wallet-based auth)
- **Storage**: Supabase Storage (images)
- **API**: Next.js API Routes

### Blockchain & Web3
- **Wallet Integration**: Privy
- **Blockchain Network**: Base (Mainnet & Sepolia Testnet)
- **Web3 Library**: Ethers.js, Wagmi

### Additional Libraries
- **QR Codes**: qrcode.react
- **Date Handling**: date-fns
- **Email**: EmailJS
- **Analytics**: Vercel Analytics

## Project Structure

```
foodra-platform/
├── frontend/
│   ├── app/
│   │   ├── marketplace/        # Product listings and details
│   │   ├── training/           # Training programs
│   │   ├── funding/            # Funding applications
│   │   ├── wallet/             # Crypto wallet interface
│   │   ├── profile/            # User profiles
│   │   ├── shop/               # Shopping cart and checkout
│   │   ├── orders/             # Order management
│   │   ├── users/              # User directory
│   │   ├── search/             # Search functionality
│   │   └── api/                # API routes
│   ├── components/             # Reusable UI components
│   ├── lib/
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── useUser.tsx         # User management hook
│   │   ├── useCart.tsx         # Shopping cart hook
│   │   ├── localStorage.ts     # Local storage utilities
│   │   └── schemas.ts          # Form validation schemas
│   └── public/                 # Static assets
└── smartcontract/
    ├── contracts/              # Solidity smart contracts
    ├── scripts/                # Deployment scripts
    ├── test/                   # Contract tests
    └── ignition/               # Deployment modules
```

## Key Data Models

### Product
- Product information (name, category, quantity, price)
- Farmer details (ID, name, avatar)
- Location and creation timestamp
- Product images and descriptions

### Training
- Training details (title, description, date)
- Mode (online/offline) and location
- Instructor information
- Capacity and enrollment tracking

### Funding Application
- Applicant information (name, phone, location)
- Farm details (size, type, experience)
- Funding request (amount, expected outcome)
- Application status tracking

### User
- User identity (ID, name, email)
- Wallet address
- Avatar and profile information
- Account creation timestamp

### Order & Cart
- Product items with quantities
- Total amount calculation
- Order status tracking
- User-specific order history

## Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- MetaMask or compatible Web3 wallet
- Supabase account

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL scripts in `/supabase` folder:
   - `schema.sql` - Database tables
   - `rls.sql` - Security policies
   - `storage.sql` - Image storage
   - `seed.sql` - Sample data (optional)

See `/supabase/README.md` for detailed instructions.

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_BASESCAN_API_KEY=your_basescan_api_key
```

Run the development server:

```bash
npm run dev
```

The application will run on `http://localhost:3000`

### Smart Contract Setup

```bash
cd smartcontract
pnpm install
npx hardhat compile
npx hardhat test
```

## Current Implementation Status

### ✅ Completed
- Marketplace with product listing and browsing
- Training program enrollment system
- Funding application workflow
- Digital wallet with multi-chain support
- User authentication and profiles
- Shopping cart and order management
- Transaction history tracking
- Responsive UI with dark mode support

### 🚧 In Development
- Smart contract integration for marketplace transactions
- Payment processing with stablecoins
- Advanced search and filtering
- Notification system
- Admin dashboard for application management

### 📋 Planned
- AI-powered credit scoring
- IPFS integration for decentralized storage
- Mobile application
- Multi-language support
- Analytics dashboard
- Insurance integration

## Contributing

Contributions are welcome! Areas of focus:
- Blockchain developers (Solidity, Web3)
- Frontend developers (Next.js, React)
- UI/UX designers
- Agricultural domain experts
- Technical writers

Fork the repository, create a feature branch, commit your changes, and open a pull request.

## License

This project is licensed under the MIT License.

---

Foodra is building the future of African agriculture through transparency, inclusion, and intelligent infrastructure.
