# API: Checkout with Wallet
# Route: PATCH /api/orders/:id/pay-wallet
# File: frontend/app/api/orders/[id]/pay-wallet/route.ts

## What it does
Deducts order total from buyer's wallet balance.
Replaces the current EscrowPaymentModal + USDC flow entirely.

## Request
```json
{ "order_id": "uuid" }
```

## Flow
1. Verify buyer is authenticated
2. Load order by ID, confirm it belongs to buyer and status is "Pending"
3. Check buyer wallet balance >= order total_amount
4. Deduct from buyer wallet
5. Insert wallet_transaction: type='debit', category='purchase', order_id=order.id
6. Update order: status='Processing', escrow_status='held', paid_at=now()
7. Notify farmer: "New order received — ₦X,XXX held in escrow"
8. Send order confirmation email to buyer

## When buyer confirms delivery
- PATCH /api/orders/:id  with status='Delivered'
- This triggers: wallet_transactions insert for farmer (future payout pool)
- In Phase 2: batch Paystack transfers to farmers weekly

## Response
```json
{ "success": true, "new_balance": 3500.00, "order_status": "Processing" }
```

## Shop Page Change (shop/page.tsx)
Replace `EscrowPaymentModal` with:
```tsx
// After delivery address confirmed:
// 1. Check balance via GET /api/wallet/balance
// 2. If balance < totalAmount → show "Top up wallet" button
// 3. If balance >= totalAmount → show "Pay ₦X,XXX from wallet" button
// 4. On confirm → call PATCH /api/orders/:id/pay-wallet
// 5. On success → clearCart(), router.push('/orders')
```

No crypto, no USDC, no blockchain. Just NGN.
