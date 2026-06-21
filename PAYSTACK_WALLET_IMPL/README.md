# Foodra Paystack Wallet — Full Implementation Guide

## What We're Building

A **custodial NGN wallet** system on top of Paystack, keeping Privy for auth/identity.

```
User signs up via Privy (unchanged)
      ↓
User funds wallet via Paystack (pay NGN)
      ↓
Money sits in Foodra's Paystack account
      ↓
User's DB balance increases (ledger)
      ↓
User can:
  ├── Send to another Foodra user (DB transfer, no real money moves)
  ├── Buy from marketplace (deducted from wallet balance)
  └── Withdraw to bank account (Paystack Transfer API, real money leaves)
```

## Folder Contents

```
PAYSTACK_WALLET_IMPL/
├── README.md                    ← You are here
├── docs/
│   ├── 01_architecture.md       ← Full system design
│   ├── 02_paystack_setup.md     ← Paystack dashboard config
│   └── 03_execution_order.md   ← Step-by-step build order
├── sql/
│   ├── 01_wallet_ledger.sql     ← New DB tables
│   └── 02_wallet_rls.sql        ← Security policies
├── api/
│   ├── wallet-balance.md        ← GET /api/wallet/balance
│   ├── fund-wallet.md           ← POST /api/wallet/fund (Paystack init)
│   ├── paystack-webhook.md      ← POST /api/payments/webhook
│   ├── wallet-transfer.md       ← POST /api/wallet/transfer (user→user)
│   ├── wallet-withdraw.md       ← POST /api/wallet/withdraw (to bank)
│   └── checkout-wallet.md       ← PATCH shop checkout to use wallet
├── components/
│   ├── WalletPage.md            ← New wallet/page.tsx spec
│   ├── FundModal.md             ← Fund wallet modal spec
│   ├── SendModal.md             ← Send to Foodra user modal spec
│   └── WithdrawModal.md         ← Withdraw to bank modal spec
└── pages/
    └── ShopCheckout.md          ← Updated shop checkout flow
```

## Auth: Privy Stays

Privy is **only used for authentication** — login, session, JWT token.
Blockchain/wallet features of Privy are completely ignored.
`usePrivy()` hook stays in `useUser.tsx` for auth only.

## Key Rule

> Money transferred between Foodra users **never leaves Paystack**.
> Only withdrawals and marketplace purchases cause real Paystack movement.
