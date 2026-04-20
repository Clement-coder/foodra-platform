/**
 * Integration tests — state machine transitions
 *
 * Exhaustively verifies every valid and invalid state transition
 * for the EscrowStatus enum: LOCKED → RELEASED / REFUNDED / DISPUTED → RELEASED / REFUNDED
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE_USDC = 1_000_000n;
const SEVEN_DAYS = 7 * 24 * 60 * 60;

// Status codes
const LOCKED = 0, RELEASED = 1, REFUNDED = 2, DISPUTED = 3;

describe("Integration – State Machine", function () {
  async function setup() {
    const [owner, treasury, buyer, farmer, anyone] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    await usdc.mint(buyer.address, 1000n * ONE_USDC);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 1000n * ONE_USDC);

    let counter = 0;
    const newId = () => escrow.computeOrderId(`sm-${counter}`, `sm-${counter++}`);
    const create = async (amount = 100n * ONE_USDC) => {
      const id = await newId();
      await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
      return id;
    };

    return { escrow, owner, buyer, farmer, anyone, create };
  }

  // ── Valid transitions ──────────────────────────────────────

  it("LOCKED → RELEASED via confirmDelivery", async function () {
    const { escrow, buyer, create } = await setup();
    const id = await create();
    expect((await escrow.getEscrow(id)).status).to.equal(LOCKED);
    await escrow.connect(buyer).confirmDelivery(id);
    expect((await escrow.getEscrow(id)).status).to.equal(RELEASED);
  });

  it("LOCKED → RELEASED via autoRelease", async function () {
    const { escrow, create } = await setup();
    const id = await create();
    await time.increase(SEVEN_DAYS + 1);
    await escrow.autoRelease(id);
    expect((await escrow.getEscrow(id)).status).to.equal(RELEASED);
  });

  it("LOCKED → DISPUTED via raiseDispute (buyer)", async function () {
    const { escrow, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).raiseDispute(id);
    expect((await escrow.getEscrow(id)).status).to.equal(DISPUTED);
  });

  it("LOCKED → DISPUTED via raiseDispute (farmer)", async function () {
    const { escrow, farmer, create } = await setup();
    const id = await create();
    await escrow.connect(farmer).raiseDispute(id);
    expect((await escrow.getEscrow(id)).status).to.equal(DISPUTED);
  });

  it("DISPUTED → REFUNDED via resolveDispute(zero)", async function () {
    const { escrow, owner, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).raiseDispute(id);
    await escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress);
    expect((await escrow.getEscrow(id)).status).to.equal(REFUNDED);
  });

  it("DISPUTED → RELEASED via resolveDispute(farmer)", async function () {
    const { escrow, owner, buyer, farmer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).raiseDispute(id);
    await escrow.connect(owner).resolveDispute(id, farmer.address);
    expect((await escrow.getEscrow(id)).status).to.equal(RELEASED);
  });

  // ── Invalid transitions ────────────────────────────────────

  it("RELEASED → cannot confirmDelivery again", async function () {
    const { escrow, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).confirmDelivery(id);
    await expect(escrow.connect(buyer).confirmDelivery(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("RELEASED → cannot raiseDispute", async function () {
    const { escrow, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).confirmDelivery(id);
    await expect(escrow.connect(buyer).raiseDispute(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("RELEASED → cannot autoRelease", async function () {
    const { escrow, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).confirmDelivery(id);
    await time.increase(SEVEN_DAYS + 1);
    await expect(escrow.autoRelease(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("REFUNDED → cannot confirmDelivery", async function () {
    const { escrow, owner, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).raiseDispute(id);
    await escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress);
    await expect(escrow.connect(buyer).confirmDelivery(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("REFUNDED → cannot raiseDispute", async function () {
    const { escrow, owner, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).raiseDispute(id);
    await escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress);
    await expect(escrow.connect(buyer).raiseDispute(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("DISPUTED → cannot confirmDelivery", async function () {
    const { escrow, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).raiseDispute(id);
    await expect(escrow.connect(buyer).confirmDelivery(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("DISPUTED → cannot autoRelease (even after 7 days)", async function () {
    const { escrow, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).raiseDispute(id);
    await time.increase(SEVEN_DAYS + 1);
    await expect(escrow.autoRelease(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("DISPUTED → cannot dispute again", async function () {
    const { escrow, buyer, create } = await setup();
    const id = await create();
    await escrow.connect(buyer).raiseDispute(id);
    await expect(escrow.connect(buyer).raiseDispute(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });
});
