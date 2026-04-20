/**
 * Fee precision tests — verifies fee math is correct across
 * a wide range of amounts and fee values.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployEscrow, ONE_USDC, createEscrow } from "./helpers";

describe("FoodraEscrow – Fee Precision", function () {
  async function setup() {
    const { escrow, usdc, owner, treasury, buyers, farmers } = await deployEscrow(1);
    return { escrow, usdc, owner, treasury, buyer: buyers[0], farmer: farmers[0] };
  }

  const cases: [string, bigint, number, bigint, bigint][] = [
    // [label, amount, feeBps, expectedFarmer, expectedTreasury]
    ["100 USDC @ 2.5%",  100n * ONE_USDC,  250,  97_500_000n,  2_500_000n],
    ["100 USDC @ 5%",    100n * ONE_USDC,  500,  95_000_000n,  5_000_000n],
    ["100 USDC @ 10%",   100n * ONE_USDC, 1000,  90_000_000n, 10_000_000n],
    ["100 USDC @ 0%",    100n * ONE_USDC,    0, 100_000_000n,          0n],
    ["1 USDC @ 2.5%",      1n * ONE_USDC,  250,     975_000n,     25_000n],
    ["0.01 USDC @ 2.5%",       10_000n,   250,       9_750n,        250n],
    ["1 unit @ 2.5%",              1n,   250,           1n,          0n], // fee rounds to 0
    ["1000 USDC @ 1%",  1000n * ONE_USDC,  100, 990_000_000n, 10_000_000n],
  ];

  for (const [label, amount, feeBps, expectedFarmer, expectedTreasury] of cases) {
    it(`${label}`, async function () {
      const { escrow, usdc, owner, treasury, buyer, farmer } = await setup();
      await escrow.connect(owner).updateFee(feeBps);
      const id = await createEscrow(escrow, buyer, farmer, amount, label);
      const farmerBefore = await usdc.balanceOf(farmer.address);
      const treasuryBefore = await usdc.balanceOf(treasury.address);
      await escrow.connect(buyer).confirmDelivery(id);
      expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + expectedFarmer);
      expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + expectedTreasury);
    });
  }

  it("farmer + treasury always equals original amount (no value lost)", async function () {
    const { escrow, usdc, owner, treasury, buyer, farmer } = await setup();
    const amount = 777n * ONE_USDC;
    const id = await createEscrow(escrow, buyer, farmer, amount, "no-loss");
    const farmerBefore = await usdc.balanceOf(farmer.address);
    const treasuryBefore = await usdc.balanceOf(treasury.address);
    await escrow.connect(buyer).confirmDelivery(id);
    const farmerGot = (await usdc.balanceOf(farmer.address)) - farmerBefore;
    const treasuryGot = (await usdc.balanceOf(treasury.address)) - treasuryBefore;
    expect(farmerGot + treasuryGot).to.equal(amount);
  });
});
