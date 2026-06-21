# API: Paystack Webhook
# Route: POST /api/payments/webhook
# File: frontend/app/api/payments/webhook/route.ts

## What it does
This is the most critical route. Paystack calls this when payment succeeds.

## Flow
1. Verify `x-paystack-signature` header using HMAC-SHA512
2. Check event type is `charge.success`
3. Extract `reference` and `metadata.user_id` from payload
4. Find `paystack_payments` row by reference
5. If already `success` → return 200 (idempotent, avoid double credit)
6. Update `paystack_payments.status = 'success'`
7. Upsert `wallet_accounts` — add amount to `balance_ngn`
8. Insert `wallet_transactions` row (category: 'fund', type: 'credit')
9. Send notification to user: "₦X,XXX has been added to your Foodra wallet"
10. Return 200

## Signature Verification
```ts
import crypto from 'crypto'

const hash = crypto
  .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
  .update(rawBody)
  .digest('hex')

if (hash !== req.headers['x-paystack-signature']) {
  return 403 // reject
}
```

## IMPORTANT
- Must use `req.text()` not `req.json()` to get raw body for signature
- Must be idempotent — same reference can arrive twice
- Do NOT credit until signature is verified
