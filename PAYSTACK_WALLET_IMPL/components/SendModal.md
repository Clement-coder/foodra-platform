# Component: Send to Foodra User Modal
# File: frontend/components/WalletSendModal.tsx

## What it shows
```
┌──────────────────────────────┐
│  Send Money                   │
│                               │
│  Foodra Tag                   │
│  [@FDR-      ]  [Search]     │
│                               │
│  ┌──────────────────────────┐ │
│  │ 👤 Tunde Bakare           │ │
│  │ @FDR-C3D4E5               │ │
│  └──────────────────────────┘ │
│                               │
│  Amount (NGN)                 │
│  [        500               ] │
│                               │
│  Note (optional)              │
│  [For tomatoes              ] │
│                               │
│  Your balance: ₦4,500         │
│  After transfer: ₦4,000       │
│                               │
│  [Cancel]    [Send →]        │
└──────────────────────────────┘
```

## Tag Search
- User types @FDR-xxx or partial name
- Hits GET /api/users/search?foodra_tag=xxx
- Shows matching user name + tag
- Must confirm recipient before entering amount

## On "Send"
1. POST /api/wallet/transfer { to_foodra_tag, amount_ngn, note }
2. Show success: "₦500 sent to @FDR-C3D4E5"
3. Refresh balance

## Props
```ts
interface WalletSendModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance: number
  onSuccess: (newBalance: number) => void
}
```
