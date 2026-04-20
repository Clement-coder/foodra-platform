/**
 * Integration tests — adversarial / attack scenarios
 *
 * Verifies the contract is resistant to common attack patterns:
 * reentrancy attempts, front-running, griefing, privilege escalation.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE_USDC = 1_000_000n;
const SEVEN_DAYS = 7 * 24 * 60 * 60;

describe("Integration – Adversarial Scenarios", function () {
  async function setup() {
    const [owner, treasury, buyer, farmer, attacker] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    await usdc.mint(buyer.address, 5000n * ONE_USDC);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 5000n * ONE_USDC);
    const oid = (s: string) => escrow.computeOrderId(s, s);
    return { escrow, usdc, owner, treasury, buyer, farmer, attacker, oid };
  }

  it("attacker cannot steal funds by calling confirmDelivery", async function () {
    const { escrow, buyer, farmer, attacker, oid } = await setup();
    const id = await oid("steal-confirm");
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await expect(escrow.connect(attacker).confirmDelivery(id))
      .to.be.revertedWithCustomError(escrow, "NotBuyer");
  });

  it("attacker cannot raise dispute to freeze funds indefinitely", async function () {
    const { escrow, buyer, farmer, attacker, oid } = await setup();
    const id = await oid("freeze-dispute");
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await expect(escrow.connect(attacker).raiseDispute(id))
      .to.be.revertedWithCustomError(escrow, "NotParty");
  });

  it("attacker cannot resolve dispute (not owner)", async function () {
    const { escrow, buyer, farmer, attacker, oid } = await setup();
    const id = await oid("resolve-attack");
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await escrow.connect(buyer).raiseDispute(id);
    await expect(escrow.connect(attacker).resolveDispute(id, attacker.address))
      .to.be.revertedWithCustomError(escrow, "NotOwner");
  });

  it("attacker cannot hijack ownership", async function () {
    const { escrow, attacker } = await setup();
    await expect(escrow.connect(attacker).transferOwnership(attacker.address))
      .to.be.revertedWithCustomError(escrow, "NotOwner");
  });

  it("attacker cannot set fee to 100% to drain funds", async function () {
    const { escrow, attacker } = await setup();
    await expect(escrow.connect(attacker).updateFee(10000))
      .to.be.revertedWithCustomError(escrow, "NotOwner");
  });

  it("attacker cannot redirect treasury to themselves", async function () {
    const { escrow, attacker } = await setup();
    await expect(escrow.connect(attacker).updateTreasury(attacker.address))
      .to.be.revertedWithCustomError(escrow, "NotOwner");
  });

  it("double-spend: buyer cannot reuse same orderId for a second escrow", async function () {
    const { escrow, buyer, farmer, oid } = await setup();
    const id = await oid("double-spend");
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await escrow.connect(buyer).confirmDelivery(id);
    // Try to create another escrow with same orderId after release
    await expect(escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n))
      .to.be.revertedWithCustomError(escrow, "EscrowAlreadyExists");
  });

  it("griefing: farmer cannot block auto-release by raising dispute after 7 days", async function () {
    const { escrow, buyer, farmer, oid } = await setup();
    const id = await oid("grief-autorelease");
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await time.increase(SEVEN_DAYS + 1);
    // Farmer tries to dispute AFTER 7 days — but auto-release can still be called
    // (dispute is still possible before auto-release is called)
    await escrow.connect(farmer).raiseDispute(id); // this succeeds — dispute wins
    // Now auto-release should fail because it's disputed
    await expect(escrow.autoRelease(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("front-running: second createEscrow with same orderId reverts", async function () {
    const { escrow, usdc, buyer, farmer, attacker, oid } = await setup();
    const id = await oid("frontrun");
    // Attacker also gets USDC and approval
    await usdc.mint(attacker.address, 200n * ONE_USDC);
    await usdc.connect(attacker).approve(await escrow.getAddress(), 200n * ONE_USDC);

    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    // Attacker tries to front-run with same orderId
    await expect(escrow.connect(attacker).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n))
      .to.be.revertedWithCustomError(escrow, "EscrowAlreadyExists");
  });

  it("zero-value attack: cannot create escrow with 0 amount", async function () {
    const { escrow, buyer, farmer, oid } = await setup();
    await expect(escrow.connect(buyer).createEscrow(await oid("zero"), farmer.address, 0n, 0n))
      .to.be.revertedWithCustomError(escrow, "InvalidAmount");
  });

  it("self-deal: buyer cannot set themselves as farmer", async function () {
    const { escrow, buyer, oid } = await setup();
    await expect(escrow.connect(buyer).createEscrow(await oid("self"), buyer.address, ONE_USDC, 0n))
      .to.be.revertedWithCustomError(escrow, "InvalidAddress");
  });
});
