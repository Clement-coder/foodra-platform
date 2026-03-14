# Foodra Platform — Smart Contract & Escrow Architecture

## Overview

Foodra uses a USDC-based escrow smart contract on **Base** (mainnet) and **Base Sepolia** (testnet).  
All prices on the platform are displayed in local African currencies (NGN, GHS, KES, ZAR, etc.) but  
payments are settled in **USDC** using a live exchange rate at the time of purchase.

---

## 1. Currency Strategy

### Display vs Settlement
- Product prices are listed and displayed in **NGN (₦)** as the base currency
- At checkout, the NGN total is converted to **USDC** using a live rate (e.g. from CoinGecko or Chainlink)
- The USDC amount is what gets locked in the escrow contract
- Future: support GHS, KES, ZAR display with same USDC settlement

### Why USDC on Base?
- Stablecoin — no price volatility risk for farmers
- Base network has very low gas fees (~$0.01 per tx)
- USDC is widely available and easy to off-ramp in Africa
- Privy embedded wallets support Base natively

### USDC Contract Addresses
- Base Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

---

## 2. Escrow Flow

```
Buyer adds to cart
       ↓
Checkout → NGN total shown → converted to USDC at live rate
       ↓
Buyer signs USDC approval + createEscrow() tx via Privy embedded wallet
       ↓
USDC locked in FoodraEscrow contract (per order item, per farmer)
       ↓
Farmer ships product → marks as shipped in Supabase
       ↓
Buyer receives product → clicks "Confirm Delivery" → signs confirmDelivery() tx
       ↓
Contract releases: farmer gets (amount - platform fee), Foodra treasury gets fee
       ↓
If buyer never confirms after 7 days → anyone can call autoRelease() → farmer gets paid
       ↓
If dispute raised → funds frozen until admin resolves
```

---

## 3. Platform Fee

- **Fee: 2.5%** of each escrow amount
- Deducted at release time (not at lock time)
- Sent to a Foodra treasury wallet address set in the contract
- Owner can update fee (capped at 10% max) and treasury address
- Example: Buyer pays 100 USDC → farmer receives 97.5 USDC → Foodra gets 2.5 USDC

---

## 4. Smart Contract: FoodraEscrow.sol

### Escrow States
```
LOCKED     → funds held, awaiting delivery confirmation
RELEASED   → buyer confirmed delivery, farmer paid
REFUNDED   → dispute resolved in buyer's favour
DISPUTED   → under review by admin
```


### Key Functions

| Function | Caller | Description |
|---|---|---|
| `createEscrow(orderId, farmer, amount)` | Buyer | Locks USDC, creates escrow record |
| `confirmDelivery(orderId)` | Buyer | Releases funds to farmer minus fee |
| `autoRelease(orderId)` | Anyone | Releases after 7-day timeout if buyer hasn't confirmed |
| `raiseDispute(orderId)` | Buyer or Farmer | Freezes funds, flags for admin |
| `resolveDispute(orderId, releaseTo)` | Admin/Owner | Sends funds to buyer or farmer |
| `updateFee(newFee)` | Owner | Update platform fee (max 10%) |
| `updateTreasury(addr)` | Owner | Update treasury wallet |

### Escrow Struct
```solidity
struct Escrow {
  address buyer;
  address farmer;
  uint256 amount;       // USDC (6 decimals)
  uint256 ngnAmount;    // stored for reference/display
  EscrowStatus status;
  uint256 createdAt;
}
```

### Events
```solidity
event EscrowCreated(bytes32 orderId, address buyer, address farmer, uint256 amount);
event DeliveryConfirmed(bytes32 orderId, uint256 farmerAmount, uint256 fee);
event AutoReleased(bytes32 orderId);
event DisputeRaised(bytes32 orderId);
event DisputeResolved(bytes32 orderId, address releasedTo);
```

---

## 5. Per-Product Escrow (not per-order)

Each product in a cart from a different farmer creates its own escrow entry.  
This means:
- Farmer A's items → Escrow A
- Farmer B's items → Escrow B
- Each confirmed independently
- Each farmer gets paid when their specific items are confirmed

The `orderId` used as the escrow key is: `keccak256(abi.encodePacked(supabaseOrderId, productId))`

---

## 6. Product Authentication — How We Verify Listings

There is no way to verify on-chain that a farmer physically has a product. Instead, Foodra uses a **layered trust system**:

### Layer 1 — Wallet-Linked Identity
- Every listing is tied to a verified Privy wallet address stored in Supabase
- The farmer's `wallet_address` is saved on their user profile
- Listings without a wallet address are rejected at the API level

### Layer 2 — Image Requirement
- Product listings require at least one image uploaded to Supabase Storage
- Images are stored with the farmer's user ID in the path: `products/{farmerId}/{filename}`
- No image = listing blocked

### Layer 3 — Escrow as Accountability
- If a farmer lists a product they don't have and a buyer pays:
  - Buyer raises a dispute
  - Admin reviews and refunds the buyer
  - Farmer's wallet is flagged in Supabase (`is_flagged = true`)
  - Flagged farmers cannot list new products

### Layer 4 — Future: Stake-to-List (Planned)
- Farmer deposits a small USDC stake (e.g. 1 USDC) when listing
- Stake is returned when order is completed successfully
- Stake is slashed if a dispute is resolved against the farmer
- This creates real financial accountability

### Layer 5 — Community Ratings (Planned)
- Buyers rate farmers after confirmed delivery
- Low-rated farmers get reduced visibility
- High-rated farmers get "Verified Seller" badge

---

## 7. Product Edit & Delete

### Can a farmer edit their listing?
**Yes.** A farmer can edit:
- Product name, description, category
- Price per unit
- Quantity available
- Product image

**Restrictions:**
- Cannot edit a product that has an **active escrow** (status = LOCKED or DISPUTED)
- Editing is blocked at the API level by checking `orders` table for active escrows on that product

### Can a farmer delete their listing?
**Yes, with conditions:**
- Can delete if no orders exist for the product
- Can delete if all orders are in RELEASED or REFUNDED state
- **Cannot delete** if any escrow is LOCKED or DISPUTED
- Deletion sets `is_available = false` in Supabase (soft delete) — data is preserved for order history

### API endpoints needed
```
PATCH /api/products/[id]   → edit product (auth: must be owner)
DELETE /api/products/[id]  → soft delete (auth: must be owner, no active escrows)
```

---

## 8. Supabase Schema Changes Required

```sql
-- Add escrow tracking to orders
ALTER TABLE orders ADD COLUMN escrow_tx_hash TEXT;
ALTER TABLE orders ADD COLUMN escrow_status TEXT DEFAULT 'none'
  CHECK (escrow_status IN ('none', 'locked', 'released', 'refunded', 'disputed'));
ALTER TABLE orders ADD COLUMN usdc_amount DECIMAL(18,6);
ALTER TABLE orders ADD COLUMN ngn_to_usdc_rate DECIMAL(18,6); -- rate at time of purchase

-- Add escrow tracking to order_items (per-product escrow)
ALTER TABLE order_items ADD COLUMN escrow_order_id TEXT; -- bytes32 key used in contract
ALTER TABLE order_items ADD COLUMN farmer_wallet TEXT;
ALTER TABLE order_items ADD COLUMN escrow_status TEXT DEFAULT 'none'
  CHECK (escrow_status IN ('none', 'locked', 'released', 'refunded', 'disputed'));

-- Add farmer accountability fields
ALTER TABLE users ADD COLUMN is_flagged BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN completed_orders INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN disputed_orders INTEGER DEFAULT 0;

-- Add wallet_address index for fast lookup
CREATE INDEX idx_users_wallet ON users(wallet_address);
```

---

## 9. Frontend Changes Required

### New Components
- `EscrowPaymentModal` — shown at checkout, displays NGN → USDC conversion, asks for wallet signature
- `ConfirmDeliveryButton` — on orders page, triggers `confirmDelivery()` tx
- `DisputeButton` — on orders page, triggers `raiseDispute()` tx
- `EscrowStatusBadge` — shows locked/released/disputed state on order cards

### Updated Pages
- `/shop` — replace fake `setTimeout` payment with real USDC escrow tx
- `/orders` — add escrow status, confirm delivery button, dispute button
- `/listing/new` — require wallet address before allowing listing
- `/marketplace/[id]` — show seller trust score and completed orders count
- `/profile` — show farmer's completed/disputed order stats

### New Pages
- `/listing/[id]/edit` — edit an existing product listing
- `/orders/farmer` — farmer's view of incoming orders (currently missing entirely)

---

## 10. Deployment Plan

### Phase 1 — Testnet (Base Sepolia)
1. Write and test `FoodraEscrow.sol` with Hardhat
2. Deploy to Base Sepolia
3. Wire up frontend to testnet contract
4. Test full flow: list → buy → escrow → confirm → release

### Phase 2 — Mainnet (Base)
1. Audit contract (at minimum a manual review)
2. Deploy to Base mainnet
3. Set treasury wallet address
4. Switch frontend to mainnet USDC address

### Contract Deployment Config (hardhat.config.ts additions needed)
```
networks:
  baseSepolia:
    url: https://sepolia.base.org
    chainId: 84532
    accounts: [DEPLOYER_PRIVATE_KEY]
  base:
    url: https://mainnet.base.org
    chainId: 8453
    accounts: [DEPLOYER_PRIVATE_KEY]
```

---

## 11. Environment Variables Needed

```
# Already exist
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_PRIVY_APP_ID
NEXT_PUBLIC_BASESCAN_API_KEY

# New — to be added
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=   # deployed FoodraEscrow address
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=     # USDC on Base Sepolia or Base
NEXT_PUBLIC_CHAIN_ID=84532             # 84532 = Base Sepolia, 8453 = Base mainnet
FOODRA_TREASURY_WALLET=                # wallet that receives platform fees
```

---

## 12. Open Questions / Decisions

| Question | Options | Recommendation |
|---|---|---|
| NGN→USDC rate source | CoinGecko API, Chainlink oracle | CoinGecko for now (free), Chainlink later |
| Auto-release timeout | 3 days, 7 days, 14 days | 7 days |
| Platform fee | 1%, 2.5%, 5% | 2.5% |
| Dispute arbiter | Foodra admin wallet, DAO vote | Foodra admin wallet for now |
| Stake-to-list amount | 0.5 USDC, 1 USDC, 5 USDC | 1 USDC (low barrier, real accountability) |
| Multi-currency display | NGN only, or NGN + GHS + KES | NGN base, others as display conversion |

---

*Last updated: March 2026*
*Status: Planning / Pre-implementation*
