# Foodra Smart Contracts

Solidity contracts powering the Foodra marketplace escrow system on Base.

## Contracts

### FoodraEscrow
Per-product USDC escrow for trustless marketplace transactions.

**Escrow Flow:**
1. Buyer calls `createEscrow()` → USDC locked in contract
2. Buyer calls `confirmDelivery()` → farmer paid minus 2.5% fee
3. After 7 days silence → anyone calls `autoRelease()` → farmer paid
4. Either party calls `raiseDispute()` → admin resolves via `resolveDispute()`

**Key Parameters:**
- Fee: 2.5% (configurable up to 10% max)
- Auto-release: 7 days after escrow creation
- Token: USDC (6 decimals)

### MockUSDC
ERC-20 mock token for testnet. Has a public `mint()` function.

## Setup

```bash
pnpm install
cp .env.example .env
# Fill in DEPLOYER_PRIVATE_KEY, FOODRA_TREASURY_WALLET, BASE_SEPOLIA_RPC_URL
```

## Commands

```bash
# Compile
npx hardhat compile

# Test (all 25+ tests)
npx hardhat test

# Deploy to Base Sepolia (testnet)
npx hardhat run scripts/deploy.ts --network baseSepolia

# Deploy to Base Mainnet
npx hardhat run scripts/deploy-mainnet.ts --network base

# Verify on Basescan
npx hardhat run scripts/verify.ts --network base
```

## Environment Variables

| Variable | Description |
|---|---|
| `DEPLOYER_PRIVATE_KEY` | Wallet private key for deployment |
| `FOODRA_TREASURY_WALLET` | Address to receive protocol fees |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC endpoint |
| `BASE_MAINNET_RPC_URL` | Base Mainnet RPC endpoint |
| `BASESCAN_API_KEY` | For contract verification |

## Deployed Addresses

After deployment, addresses are saved to:
- `deployed-addresses.json` (testnet)
- `deployed-addresses-mainnet.json` (mainnet)

Copy the values to `frontend/.env.local`:
```
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=84532  # or 8453 for mainnet
```

## Security

- Owner-only admin functions (fee update, treasury update, dispute resolution)
- 10% hard cap on fees
- Reentrancy-safe (status updated before transfers)
- Custom errors for gas efficiency
- Immutable USDC address
