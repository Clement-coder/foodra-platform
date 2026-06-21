# Execution Order — Build Steps

## Step 1: Database (Run SQL first)
1. Run `sql/01_wallet_ledger.sql` in Supabase SQL editor
2. Run `sql/02_wallet_rls.sql` in Supabase SQL editor
3. Confirm tables: wallet_accounts, wallet_transactions, wallet_withdrawals, paystack_payments

## Step 2: Backend API Routes (in this order)
1. `POST /api/payments/webhook` — must exist before testing any payment
2. `GET /api/wallet/balance` — read user balance
3. `POST /api/wallet/fund` — initialize Paystack transaction
4. `POST /api/wallet/transfer` — Foodra-to-Foodra transfer
5. `POST /api/wallet/withdraw` — withdraw to bank

## Step 3: Remove Old Wallet Code
- Delete `app/api/wallet/fund-request/` (replaced by Paystack flow)
- Delete `app/api/wallet/send-confirmation/`
- Delete `app/api/wallet/expire-requests/`
- Delete `app/api/wallet/transactions/` (replaced by wallet_transactions table)
- Delete `components/EscrowPaymentModal.tsx`
- Delete `components/SendModal.tsx` (replace with new NGN send modal)
- Delete `lib/useEscrow.ts`, `lib/escrow.ts`
- Keep all Privy auth code unchanged

## Step 4: New Wallet Page
Replace `app/wallet/page.tsx` with new NGN wallet UI:
- Balance card (NGN)
- Fund button → Paystack redirect
- Send button → Foodra tag search modal
- Withdraw button → bank account modal
- Transaction history from wallet_transactions table

## Step 5: Update Shop Checkout
Replace `EscrowPaymentModal` in `app/shop/page.tsx`:
- Check user wallet balance >= order total
- If yes: deduct balance, create order with status "Paid"
- If no: show "Insufficient balance — fund your wallet" with link

## Step 6: Update Admin
- Replace `AdminWalletRequests.tsx` with `AdminWithdrawals.tsx`
  - Shows withdrawal requests with bank details
  - Admin approves → triggers Paystack Transfer API
  - Shows paystack_payments for funding history

## Step 7: Remove Blockchain UI
- Remove crypto wallet nav from `NavBar.tsx`
- Remove `EscrowStatusBadge`, `AccountMismatchBanner`, `WrongAccountBanner`
- Remove Base/MoonPay from partners page, add Paystack
- Update order cards: escrow status → "Held / Released / Refunded"

## Step 8: Test End-to-End
1. Sign up via Privy ✓
2. Fund wallet → Paystack test card → balance increases ✓
3. Send ₦500 to another test user → both balances update ✓
4. Buy item → balance deducted, order created ✓
5. Withdraw → admin approves → Paystack transfer fires ✓
