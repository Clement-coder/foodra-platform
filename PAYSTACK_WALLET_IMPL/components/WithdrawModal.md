# Component: Withdraw to Bank Modal
# File: frontend/components/WalletWithdrawModal.tsx

## What it shows — 3 steps

### Step 1: Enter Bank Details
```
┌──────────────────────────────┐
│  Withdraw to Bank             │
│                               │
│  Bank                         │
│  [Select bank ▼             ] │
│                               │
│  Account Number               │
│  [0123456789               ]  │
│                               │
│  [Verify Account]             │
│                               │
│  ✓ Emeka Johnson (GTBank)     │
│                               │
│  [Next →]                    │
└──────────────────────────────┘
```

### Step 2: Enter Amount + PIN
```
┌──────────────────────────────┐
│  Withdraw to Bank             │
│  Emeka Johnson · GTBank       │
│  0123456789                   │
│                               │
│  Amount (NGN)                 │
│  [        2000              ] │
│  Available: ₦4,500            │
│                               │
│  Wallet PIN                   │
│  [● ● ● ●                   ] │
│                               │
│  Processing fee: ₦25          │
│                               │
│  [Back]   [Withdraw →]       │
└──────────────────────────────┘
```

### Step 3: Confirmation
```
  ✅ Withdrawal request submitted!
  ₦2,000 will be sent to your bank
  within 1–2 business days.
```

## Verify Account (Step 1)
- GET /api/wallet/verify-bank?account_number=xxx&bank_code=xxx
- Calls Paystack resolve account API
- Shows account_name for user to confirm

## Bank List
- GET https://api.paystack.co/bank (returns all Nigerian banks)
- Cache this list, it rarely changes

## PIN Setup
- If user has no PIN yet → show "Set PIN first" prompt
- PIN is 4 digits, stored as bcrypt hash in wallet_accounts.pin_hash

## Props
```ts
interface WalletWithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}
```
