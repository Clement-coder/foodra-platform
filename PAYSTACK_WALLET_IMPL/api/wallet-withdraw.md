# API: Withdraw to Bank
# Route: POST /api/wallet/withdraw
# File: frontend/app/api/wallet/withdraw/route.ts

## What it does
User withdraws NGN from Foodra wallet to their bank account.
Real money leaves Foodra's Paystack account.

## Request
```json
{
  "amount_ngn": 2000,
  "bank_code": "058",
  "account_number": "0123456789",
  "account_name": "Emeka Johnson",
  "bank_name": "GTBank",
  "pin": "1234"
}
```

## Flow
1. Verify user PIN (compare with pin_hash in wallet_accounts)
2. Check balance >= amount
3. Deduct from wallet immediately (hold the money)
4. Create `wallet_withdrawals` row with status "pending"
5. Insert `wallet_transactions` row: type='debit', category='withdraw'
6. Notify admin to approve OR auto-call Paystack Transfer API

## Paystack Transfer API (called by admin approval or auto)
```
POST https://api.paystack.co/transfer
Authorization: Bearer sk_xxx
{
  "source": "balance",
  "amount": 200000,             // kobo
  "recipient": "RCP_xxxxxxxx",  // create recipient first
  "reason": "Foodra wallet withdrawal"
}
```

## Two-Step: Create Recipient First
```
POST https://api.paystack.co/transferrecipient
{
  "type": "nuban",
  "name": "Emeka Johnson",
  "account_number": "0123456789",
  "bank_code": "058",
  "currency": "NGN"
}
```
Returns `recipient_code` → use in Transfer call.

## Verify Bank Account (before withdrawal)
```
GET https://api.paystack.co/bank/resolve?account_number=xxx&bank_code=058
```
Returns `account_name` for user to confirm before submitting.

## Minimum withdrawal: ₦500
