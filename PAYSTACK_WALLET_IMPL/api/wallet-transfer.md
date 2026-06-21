# API: Wallet Transfer (Foodra → Foodra)
# Route: POST /api/wallet/transfer
# File: frontend/app/api/wallet/transfer/route.ts

## What it does
Transfers NGN between two Foodra users.
NO real money moves. Only DB numbers change.

## Request
```json
{
  "to_foodra_tag": "FDR-A1B2C3",
  "amount_ngn": 500,
  "note": "For tomatoes"
}
```

## Flow (all in a DB transaction)
1. Verify sender is authenticated
2. Look up recipient by `foodra_tag` in `wallet_accounts`
3. Check sender balance >= amount
4. Deduct from sender: `balance_ngn - amount`
5. Add to recipient: `balance_ngn + amount`
6. Insert two `wallet_transactions` rows:
   - Sender: type='debit', category='send', related_user_id=recipient
   - Recipient: type='credit', category='receive', related_user_id=sender
7. Send notification to recipient: "@emeka sent you ₦500"

## Response
```json
{ "success": true, "new_balance": 4000.00 }
```

## Validations
- Cannot send to yourself
- Minimum ₦100
- Sender balance must be sufficient
- Recipient tag must exist

## NOTE
Use a Supabase RPC (stored procedure) or careful sequential updates
to prevent race conditions if two transfers happen simultaneously.
