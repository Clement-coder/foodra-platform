# Component: New Wallet Page
# File: frontend/app/wallet/page.tsx (replace existing)

## Layout
```
┌──────────────────────────────────┐
│  💰 Your Foodra Wallet            │
│                                  │
│  ┌────────────────────────────┐  │
│  │  Balance                   │  │
│  │  ₦ 4,500.00                │  │
│  │  @FDR-A1B2C3   [copy tag]  │  │
│  └────────────────────────────┘  │
│                                  │
│  [+ Fund]  [→ Send]  [↓ Withdraw]│
│                                  │
│  Transaction History             │
│  ─────────────────────────────   │
│  ↑ Funded ₦5,000    Jun 20       │
│  ↓ Sent ₦500 to @tunde Jun 19   │
│  ↑ Received ₦200 @amaka Jun 18  │
│  ↓ Purchase ₦800 (Order #xxx)   │
└──────────────────────────────────┘
```

## State
- `balance: number` — from GET /api/wallet/balance
- `tag: string` — from same endpoint
- `transactions: WalletTransaction[]` — from GET /api/wallet/transactions
- `fundModalOpen`, `sendModalOpen`, `withdrawModalOpen`

## Fund Button
- Opens Fund Modal
- On confirm → POST /api/wallet/fund → redirect to Paystack URL
- On return (URL has `?funded=1`) → show success toast, refresh balance

## Send Button
- Opens Send Modal (see SendModal.md)

## Withdraw Button
- Opens Withdraw Modal (see WithdrawModal.md)

## Transaction Row Colors
- credit (fund, receive, refund) → green arrow ↑
- debit (send, purchase, withdraw) → red arrow ↓

## Remove from existing wallet page
- All ETH/USDC balance display
- QR code for crypto address
- usePrivy useSendTransaction useFundWallet hooks
- All blockchain/ethers imports
- USDC rate display
- MoonPay/Coinbase buttons
