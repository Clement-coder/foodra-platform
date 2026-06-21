# API: Fund Wallet
# Route: POST /api/wallet/fund
# File: frontend/app/api/wallet/fund/route.ts

## What it does
1. Receives `{ amount_ngn }` from the client
2. Creates a `paystack_payments` row with status "pending"
3. Calls Paystack Initialize Transaction API
4. Returns `{ authorization_url, reference }` to client
5. Client redirects to `authorization_url`
6. After payment, Paystack redirects to `/wallet?funded=1`
7. Actual balance credit happens in the webhook (not here)

## Request
```json
{ "amount_ngn": 5000 }
```

## Response
```json
{
  "authorization_url": "https://checkout.paystack.com/xxx",
  "reference": "FDR-PAY-XXXXXXXX"
}
```

## Paystack API Call
```
POST https://api.paystack.co/transaction/initialize
Authorization: Bearer sk_xxx
{
  "email": "user@email.com",
  "amount": 500000,          // kobo (amount_ngn * 100)
  "reference": "FDR-PAY-xxx",
  "callback_url": "https://yourdomain.com/wallet?funded=1",
  "metadata": {
    "user_id": "uuid",
    "type": "wallet_fund"
  }
}
```

## Validation
- Minimum: ₦500
- Maximum: ₦1,000,000
- User must be authenticated (Privy token)
