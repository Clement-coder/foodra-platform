# Smart Contract Test Suite

## Coverage Summary

| File | Tests | Description |
|---|---|---|
| `MockUSDC.test.ts` | 16 | Full ERC-20 unit tests — mint, approve, transfer, transferFrom |
| `Deployment.test.ts` | 6 | Constructor validation — state vars, constants, zero-address guards |
| `CreateEscrow.test.ts` | 12 | createEscrow — struct storage, USDC transfer, events, all revert paths |
| `ConfirmDelivery.test.ts` | 13 | confirmDelivery — fee splits, events, all revert paths, edge fee values |
| `AutoRelease.test.ts` | 10 | autoRelease — time boundaries, anyone can call, dispute guard |
| `RaiseDispute.test.ts` | 9 | raiseDispute — buyer/farmer access, USDC stays locked, revert paths |
| `ResolveDispute.test.ts` | 13 | resolveDispute — refund/release, events, no fee, all revert paths |
| `Admin.test.ts` | 17 | updateFee, updateTreasury, transferOwnership — all edge cases |
| `ViewFunctions.test.ts` | 9 | computeOrderId determinism, off-chain match, getEscrow struct |
| `FeePrecision.test.ts` | 9 | Parametric fee math across amounts/rates, no-value-lost invariant |
| `Events.test.ts` | 8 | Every event emitted with correct args |
| `AccessControl.test.ts` | 9 | Role matrix — every privileged function vs every role |
| `Integration.HappyPath.test.ts` | 7 | End-to-end flows — confirm, auto-release, dispute, concurrent, fee change |
| `Integration.Adversarial.test.ts` | 11 | Attack scenarios — theft, griefing, front-running, privilege escalation |
| `Integration.StateMachine.test.ts` | 14 | All valid + invalid state transitions exhaustively tested |
| `Integration.Volume.test.ts` | 5 | 20 escrows, large/dust amounts, mixed outcomes, zero balance |
| `FoodraEscrow.ts` (original) | 25 | Original test suite (preserved) |

**Total: 192 tests, 0 failing**

## Running Tests

```bash
cd smartcontract
npm install
npx hardhat test

# With gas report
REPORT_GAS=true npx hardhat test
```

## Key Invariants Verified

1. **No value lost** — farmer + treasury always equals original escrow amount
2. **State machine** — every invalid transition is blocked
3. **Access control** — every privileged function rejects non-owners
4. **Idempotency** — completed escrows cannot be re-used
5. **Time lock** — auto-release strictly requires 7 days elapsed
6. **Fee cap** — fee can never exceed 10% (1000 bps)
