# Component: Fund Wallet Modal
# File: frontend/components/FundWalletModal.tsx

## What it shows
```
┌──────────────────────────────┐
│  Fund Your Wallet             │
│                               │
│  Amount (NGN)                 │
│  [        5000              ] │
│                               │
│  You will be redirected to    │
│  Paystack to complete payment │
│                               │
│  Min: ₦500 · Max: ₦1,000,000  │
│                               │
│  [Cancel]    [Continue →]    │
└──────────────────────────────┘
```

## On "Continue"
1. POST /api/wallet/fund with { amount_ngn }
2. Receive { authorization_url }
3. window.location.href = authorization_url
4. Paystack handles payment on their page
5. User returns to /wallet?funded=1
6. WalletPage detects ?funded=1 → refreshes balance + shows toast

## Props
```ts
interface FundWalletModalProps {
  isOpen: boolean
  onClose: () => void
}
```
