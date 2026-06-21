# Shop Checkout — Wallet Payment Flow (No Farmers, Foodra is the Seller)
# File: frontend/app/shop/page.tsx (update)

## Business Model
Foodra owns and sells all products. Buyers purchase from Foodra directly.
No seller splitting, no farmer payouts, no escrow to third parties.
Money paid goes straight to Foodra's Paystack account and stays there.

## Purchase Flow
```
Cart → [Proceed to Checkout]
         ↓
   Delivery Address Modal (unchanged)
         ↓
   GET /api/wallet/balance
         ↓
   ┌─ balance >= total ──────────────────────────────┐
   │  Confirmation modal:                            │
   │  "Pay ₦3,500 from your Foodra wallet"           │
   │  Current balance: ₦5,000                        │
   │  Balance after: ₦1,500                          │
   │  [Cancel]  [Confirm Payment]                    │
   │       ↓                                         │
   │  POST /api/orders (create order)               │
   │  PATCH /api/orders/:id/pay-wallet (deduct)     │
   │       ↓                                         │
   │  clearCart() → router.push('/orders')           │
   └─────────────────────────────────────────────────┘
         ↓
   ┌─ balance < total ───────────────────────────────┐
   │  "Insufficient wallet balance"                  │
   │  Balance: ₦2,000  |  Total: ₦3,500              │
   │  You need ₦1,500 more                           │
   │  [Fund Wallet]  ← opens FundWalletModal         │
   └─────────────────────────────────────────────────┘
```

## Order Lifecycle (Admin manages everything)
```
Pending      → order created, payment deducted from wallet
Processing   → admin confirms and starts fulfillment
Shipped      → admin marks shipped, buyer notified
Delivered    → admin or buyer marks delivered
Cancelled    → admin cancels → buyer wallet automatically refunded
```

## Refund on Cancellation
- No Paystack refund API needed
- Just credit buyer's wallet_accounts.balance_ngn back
- Insert wallet_transactions row: type='credit', category='refund', order_id=order.id
- Notify buyer: "Order cancelled. ₦3,500 refunded to your wallet."

## What to Remove from shop/page.tsx
- EscrowPaymentModal import and usage
- handleEscrowSuccess, handleEscrowError functions
- enrichedCart farmerWallet fetching (no farmers)
- escrowTxHash, usdcAmount fields
- All ethers/USDC/blockchain references
- farmerWallet from CartItem type (no longer needed)

## What to Add to shop/page.tsx
```ts
const [walletBalance, setWalletBalance] = useState<number>(0)
const [showPayConfirm, setShowPayConfirm] = useState(false)
const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
const [isFundModalOpen, setIsFundModalOpen] = useState(false)

// After delivery address confirmed:
// 1. Fetch wallet balance
// 2. If balance < total → show fund prompt
// 3. If balance >= total → open pay confirmation modal
// 4. On confirm → create order → deduct wallet → redirect
```

## Pay Confirmation Modal (inline, no separate file needed)
Simple modal, no new component required:
```
┌────────────────────────────────┐
│  Confirm Payment               │
│                                │
│  ₦ 3,500.00                   │
│  from your Foodra Wallet       │
│                                │
│  Balance: ₦5,000               │
│  After:   ₦1,500               │
│                                │
│  [Cancel]   [Pay Now ✓]       │
└────────────────────────────────┘
```

## API Route: PATCH /api/orders/[id]/pay-wallet
1. Verify buyer owns the order
2. Check order status is "Pending"
3. Check wallet balance >= order total_amount
4. Deduct wallet balance (admin supabase client)
5. Insert wallet_transaction: debit, category='purchase'
6. Update order status → "Processing"
7. Send order confirmation email to buyer
8. Return { success: true, new_balance: number }
