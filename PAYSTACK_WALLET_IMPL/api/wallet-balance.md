# API: Wallet Balance
# Route: GET /api/wallet/balance
# File: frontend/app/api/wallet/balance/route.ts

## What it does
Returns the authenticated user's wallet balance and foodra_tag.
Auto-creates wallet_accounts row if it doesn't exist (first visit).

## Response
```json
{
  "balance_ngn": 4500.00,
  "foodra_tag": "FDR-A1B2C3",
  "created_at": "2026-01-01T00:00:00Z"
}
```

## Auto-create logic
If no wallet_accounts row for user → INSERT with balance 0 and auto-generated tag.
This way the user always has a wallet from first login.
