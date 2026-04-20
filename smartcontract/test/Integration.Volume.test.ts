/**
 * Integration tests — high-volume and stress scenarios
 *
 * Tests the contract under load: many escrows, large amounts,
 * dust amounts, treasury accumulation, and balance accounting.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE_USDC = 1_000_000n;
const SEVEN_DAYS = 7 * 24 * 60 * 60;

describe("Integration – Volume & Accounting", function () {
  async function setup() {
    const signers = await ethers.getSigners();
    const [owner, treasury] = signers;
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    return { escrow, usdc, owner, treasury, signers };
  }

  it("20 sequential escrows — all confirmed, treasury accumulates correctly", async function () {
    const { escrow, usdc, treasury, signers } = await setup();
    const [, , buyer, farmer] = signers;
    const escrowAddr = await escrow.getAddress();
    const amount = 100n * ONE_USDC;
    const totalAmount = 20n * amount;

    await usdc.mint(buyer.address, totalAmount);
    await usdc.connect(buyer).approve(escrowAddr, totalAmount);

    const treasuryBefore = await usdc.balanceOf(treasury.address);

    for (let i = 0; i < 20; i++) {
      const id = await escrow.computeOrderId(`order-${i}`, `product-${i}`);
      await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
      await escrow.connect(buyer).confirmDelivery(id);
    }

    // 2.5% of 100 USDC × 20 = 50 USDC to treasury
    expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + 50n * ONE_USDC);
    // Contract should be empty
    expect(await usdc.balanceOf(escrowAddr)).to.equal(0n);
  });

  it("large amount: 1,000,000 USDC escrow — correct fee split", async function () {
    const { escrow, usdc, treasury, signers } = await setup();
    const [, , buyer, farmer] = signers;
    const amount = 1_000_000n * ONE_USDC; // 1M USDC
    await usdc.mint(buyer.address, amount);
    await usdc.connect(buyer).approve(await escrow.getAddress(), amount);

    const id = await escrow.computeOrderId("big-order", "big-product");
    await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);

    const farmerBefore = await usdc.balanceOf(farmer.address);
    const treasuryBefore = await usdc.balanceOf(treasury.address);
    await escrow.connect(buyer).confirmDelivery(id);

    // 2.5% of 1M = 25,000 USDC fee
    expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + 25_000n * ONE_USDC);
    expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + 975_000n * ONE_USDC);
  });

  it("dust amount: 1 unit (0.000001 USDC) — fee rounds to 0, farmer gets all", async function () {
    const { escrow, usdc, signers } = await setup();
    const [, , buyer, farmer] = signers;
    await usdc.mint(buyer.address, 1n);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 1n);

    const id = await escrow.computeOrderId("dust", "dust");
    await escrow.connect(buyer).createEscrow(id, farmer.address, 1n, 0n);
    const farmerBefore = await usdc.balanceOf(farmer.address);
    await escrow.connect(buyer).confirmDelivery(id);
    // fee = 1 * 250 / 10000 = 0 (integer division)
    expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + 1n);
  });

  it("mixed outcomes: some confirmed, some auto-released, some refunded — zero contract balance", async function () {
    const { escrow, usdc, owner, signers } = await setup();
    const [, , buyer, farmer] = signers;
    const escrowAddr = await escrow.getAddress();
    const amount = 10n * ONE_USDC;
    await usdc.mint(buyer.address, 30n * amount);
    await usdc.connect(buyer).approve(escrowAddr, 30n * amount);

    const ids = await Promise.all(
      Array.from({ length: 9 }, (_, i) => escrow.computeOrderId(`mix-${i}`, `mix-${i}`))
    );

    // Create 9 escrows
    for (const id of ids) {
      await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
    }

    // 3 confirmed
    for (const id of ids.slice(0, 3)) {
      await escrow.connect(buyer).confirmDelivery(id);
    }
    // 3 disputed → refunded
    for (const id of ids.slice(3, 6)) {
      await escrow.connect(buyer).raiseDispute(id);
      await escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress);
    }
    // 3 auto-released
    await time.increase(SEVEN_DAYS + 1);
    for (const id of ids.slice(6, 9)) {
      await escrow.autoRelease(id);
    }

    expect(await usdc.balanceOf(escrowAddr)).to.equal(0n);
  });

  it("treasury balance grows monotonically across multiple releases", async function () {
    const { escrow, usdc, treasury, signers } = await setup();
    const [, , buyer, farmer] = signers;
    const amount = 100n * ONE_USDC;
    await usdc.mint(buyer.address, 500n * ONE_USDC);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 500n * ONE_USDC);

    let prevTreasury = await usdc.balanceOf(treasury.address);
    for (let i = 0; i < 5; i++) {
      const id = await escrow.computeOrderId(`mono-${i}`, `mono-${i}`);
      await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
      await escrow.connect(buyer).confirmDelivery(id);
      const curr = await usdc.balanceOf(treasury.address);
      expect(curr).to.be.gt(prevTreasury);
      prevTreasury = curr;
    }
  });
});
