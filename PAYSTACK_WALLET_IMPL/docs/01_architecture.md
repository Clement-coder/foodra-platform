# Architecture — Foodra Paystack Wallet

## Business Model
Foodra is the seller. Buyers purchase from Foodra directly.
No third-party sellers, no farmer accounts, no payout splitting.

## The Ledger Model

Each user has ONE row in `wallet_accounts`:
```
user_id | balance_ngn | foodra_tag | pin_hash | created_at
```

Foodra holds one real Paystack account.
User balances are numbers in the database — shares of that real money.

## Money Flow

```
┌─────────────────────────────────────────────────┐
│              REAL MONEY (Paystack)               │
│                                                  │
│  User pays ₦5,000 ──────────► Foodra Paystack   │
│                                  Balance: ₦5,000 │
└─────────────────────────────────────────────────┘
                    ↓ webhook confirms
┌─────────────────────────────────────────────────┐
│                FOODRA DB LEDGER                  │
│                                                  │
│  emeka_wallet:  ₦5,000                          │
│  amaka_wallet:  ₦0                              │
└─────────────────────────────────────────────────┘

--- emeka sends ₦1,000 to amaka (internal, no real money moves) ---

  emeka_wallet:  ₦4,000
  amaka_wallet:  ₦1,000
  Paystack:      ₦5,000  ← unchanged

--- emeka buys ₦3,500 worth of goods from Foodra ---

  emeka_wallet:  ₦500
  Paystack:      ₦5,000  ← unchanged (money is now Foodra's revenue)
  Order:         Processing

--- emeka withdraws ₦500 to bank ---

  emeka_wallet:  ₦0
  Paystack:      ₦4,500  ← ₦500 sent to emeka's bank
```

## User Actions on Wallet
| Action | Real Money Moves? | What Changes |
|--------|------------------|--------------|
| Fund wallet | YES — into Foodra Paystack | DB balance +N |
| Send to Foodra user | NO | Sender -N, Receiver +N in DB |
| Buy from marketplace | NO | Buyer wallet -N in DB |
| Withdraw to bank | YES — out of Foodra Paystack | DB balance -N |
| Order cancelled/refunded | NO | Buyer wallet +N in DB |

## Foodra Tag
Every user gets a unique tag (e.g. `FDR-A1B2C3`) on first wallet creation.
Used to send money without needing bank details.

## Tables
1. `wallet_accounts` — balance per user
2. `wallet_transactions` — full ledger history
3. `wallet_withdrawals` — cash-out requests
4. `paystack_payments` — incoming Paystack charges

## Paystack APIs Used
| Action | API |
|--------|-----|
| Fund wallet | Initialize Transaction |
| Confirm payment | Webhook `charge.success` |
| Withdraw to bank | Transfers API |
| Verify bank account | Resolve Account Number |

## Security
- Webhook verifies HMAC-SHA512 signature before crediting any balance
- Withdrawals require 4-digit PIN (bcrypt hashed)
- All balance mutations via server API routes only (admin Supabase client)
- RLS: users read only their own rows
