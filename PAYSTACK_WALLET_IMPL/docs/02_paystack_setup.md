# Paystack Dashboard Setup

## 1. Create a Paystack Account
Go to https://dashboard.paystack.com and create/use your business account.

## 2. Get API Keys
Dashboard → Settings → API Keys & Webhooks:
```
PAYSTACK_SECRET_KEY=sk_live_xxxx          (server only, never expose)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxx   (frontend)
```
Use `sk_test_` and `pk_test_` for development.

## 3. Set Webhook URL
Dashboard → Settings → API Keys & Webhooks → Webhook URL:
```
https://yourdomain.com/api/payments/webhook
```
Paystack will send `charge.success` and `transfer.success` events here.

## 4. Enable Transfers
Dashboard → Settings → Transfers → Enable Transfers
This allows the Transfers API for withdrawals.

## 5. Environment Variables to Add
In `frontend/.env.local`:
```
PAYSTACK_SECRET_KEY=sk_test_xxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxx
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret  # same as secret key for HMAC
```

## 6. Transaction Fees to Know
- Paystack charges 1.5% + ₦100 per transaction (capped at ₦2,000)
- Transfers cost ₦10–₦50 per withdrawal depending on bank
- Factor this into your platform if needed
