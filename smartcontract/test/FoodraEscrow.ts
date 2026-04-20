import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE_USDC = 1_000_000n; // 6 decimals
const SEVEN_DAYS = 7 * 24 * 60 * 60;

describe("FoodraEscrow", function () {
  async function deploy() {
    const [owner, treasury, buyer, farmer, stranger] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    const Escrow = await ethers.getContractFactory("FoodraEscrow");
    const escrow = await Escrow.deploy(await usdc.getAddress(), treasury.address);

    // Give buyer 1000 USDC and approve escrow
    await usdc.mint(buyer.address, 1000n * ONE_USDC);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 1000n * ONE_USDC);

    const orderId = ethers.keccak256(ethers.toUtf8Bytes("order1-product1"));

    return { escrow, usdc, owner, treasury, buyer, farmer, stranger, orderId };
  }

  // ── createEscrow ─────────────────────────────────────────

  describe("createEscrow", function () {
    it("locks USDC and emits EscrowCreated", async function () {
      const { escrow, usdc, buyer, farmer, orderId } = await deploy();
      const amount = 100n * ONE_USDC;

      await expect(escrow.connect(buyer).createEscrow(orderId, farmer.address, amount, 150000n))
        .to.emit(escrow, "EscrowCreated")
        .withArgs(orderId, buyer.address, farmer.address, amount, 150000n);

      const e = await escrow.getEscrow(orderId);
      expect(e.status).to.equal(0); // LOCKED
      expect(e.amount).to.equal(amount);
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(amount);
    });

    it("reverts if farmer is zero address", async function () {
      const { escrow, buyer, orderId } = await deploy();
      await expect(
        escrow.connect(buyer).createEscrow(orderId, ethers.ZeroAddress, ONE_USDC, 0n)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("reverts if buyer == farmer", async function () {
      const { escrow, buyer, orderId } = await deploy();
      await expect(
        escrow.connect(buyer).createEscrow(orderId, buyer.address, ONE_USDC, 0n)
      ).to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("reverts if amount is zero", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await expect(
        escrow.connect(buyer).createEscrow(orderId, farmer.address, 0n, 0n)
      ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
    });

    it("reverts on duplicate orderId", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await expect(
        escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n)
      ).to.be.revertedWithCustomError(escrow, "EscrowAlreadyExists");
    });
  });

  // ── confirmDelivery ──────────────────────────────────────

  describe("confirmDelivery", function () {
    it("releases 97.5% to farmer and 2.5% to treasury", async function () {
      const { escrow, usdc, buyer, farmer, treasury, orderId } = await deploy();
      const amount = 100n * ONE_USDC;
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, amount, 0n);

      const farmerBefore = await usdc.balanceOf(farmer.address);
      const treasuryBefore = await usdc.balanceOf(treasury.address);

      await escrow.connect(buyer).confirmDelivery(orderId);

      // 2.5% fee = 2.5 USDC, farmer gets 97.5 USDC
      expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + 97_500_000n);
      expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + 2_500_000n);
      expect((await escrow.getEscrow(orderId)).status).to.equal(1); // RELEASED
    });

    it("reverts if called by non-buyer", async function () {
      const { escrow, buyer, farmer, stranger, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await expect(
        escrow.connect(stranger).confirmDelivery(orderId)
      ).to.be.revertedWithCustomError(escrow, "NotBuyer");
    });

    it("reverts if already released", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await escrow.connect(buyer).confirmDelivery(orderId);
      await expect(
        escrow.connect(buyer).confirmDelivery(orderId)
      ).to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
    });
  });

  // ── autoRelease ──────────────────────────────────────────

  describe("autoRelease", function () {
    it("reverts before 7 days", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await expect(escrow.autoRelease(orderId))
        .to.be.revertedWithCustomError(escrow, "TooEarlyForAutoRelease");
    });

    it("releases after 7 days and emits AutoReleased", async function () {
      const { escrow, usdc, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, 100n * ONE_USDC, 0n);

      await time.increase(SEVEN_DAYS + 1);

      await expect(escrow.autoRelease(orderId))
        .to.emit(escrow, "AutoReleased").withArgs(orderId)
        .and.to.emit(escrow, "DeliveryConfirmed");

      expect((await escrow.getEscrow(orderId)).status).to.equal(1); // RELEASED
    });
  });

  // ── raiseDispute ─────────────────────────────────────────

  describe("raiseDispute", function () {
    it("buyer can raise dispute", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await expect(escrow.connect(buyer).raiseDispute(orderId))
        .to.emit(escrow, "DisputeRaised").withArgs(orderId, buyer.address);
      expect((await escrow.getEscrow(orderId)).status).to.equal(3); // DISPUTED
    });

    it("farmer can raise dispute", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await expect(escrow.connect(farmer).raiseDispute(orderId))
        .to.emit(escrow, "DisputeRaised").withArgs(orderId, farmer.address);
    });

    it("stranger cannot raise dispute", async function () {
      const { escrow, buyer, farmer, stranger, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await expect(
        escrow.connect(stranger).raiseDispute(orderId)
      ).to.be.revertedWithCustomError(escrow, "NotParty");
    });
  });

  // ── resolveDispute ───────────────────────────────────────

  describe("resolveDispute", function () {
    it("owner refunds buyer when releaseTo is zero address", async function () {
      const { escrow, usdc, owner, buyer, farmer, orderId } = await deploy();
      const amount = 100n * ONE_USDC;
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, amount, 0n);
      await escrow.connect(buyer).raiseDispute(orderId);

      const buyerBefore = await usdc.balanceOf(buyer.address);
      await escrow.connect(owner).resolveDispute(orderId, ethers.ZeroAddress);
      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBefore + amount);
      expect((await escrow.getEscrow(orderId)).status).to.equal(2); // REFUNDED
    });

    it("owner releases full amount to farmer", async function () {
      const { escrow, usdc, owner, buyer, farmer, orderId } = await deploy();
      const amount = 100n * ONE_USDC;
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, amount, 0n);
      await escrow.connect(buyer).raiseDispute(orderId);

      const farmerBefore = await usdc.balanceOf(farmer.address);
      await escrow.connect(owner).resolveDispute(orderId, farmer.address);
      expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + amount);
      expect((await escrow.getEscrow(orderId)).status).to.equal(1); // RELEASED
    });

    it("non-owner cannot resolve", async function () {
      const { escrow, buyer, farmer, stranger, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await escrow.connect(buyer).raiseDispute(orderId);
      await expect(
        escrow.connect(stranger).resolveDispute(orderId, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrow, "NotOwner");
    });
  });

  // ── Admin ────────────────────────────────────────────────

  describe("Admin", function () {
    it("owner can update fee", async function () {
      const { escrow, owner } = await deploy();
      await expect(escrow.connect(owner).updateFee(300))
        .to.emit(escrow, "FeeUpdated").withArgs(250, 300);
      expect(await escrow.feeBps()).to.equal(300);
    });

    it("reverts if fee exceeds 10%", async function () {
      const { escrow, owner } = await deploy();
      await expect(escrow.connect(owner).updateFee(1001))
        .to.be.revertedWithCustomError(escrow, "FeeTooHigh");
    });

    it("owner can update treasury", async function () {
      const { escrow, owner, stranger } = await deploy();
      await expect(escrow.connect(owner).updateTreasury(stranger.address))
        .to.emit(escrow, "TreasuryUpdated");
      expect(await escrow.treasury()).to.equal(stranger.address);
    });

    it("non-owner cannot update fee", async function () {
      const { escrow, stranger } = await deploy();
      await expect(escrow.connect(stranger).updateFee(100))
        .to.be.revertedWithCustomError(escrow, "NotOwner");
    });
  });

  // ── computeOrderId ───────────────────────────────────────

  describe("computeOrderId", function () {
    it("returns consistent bytes32 for same inputs", async function () {
      const { escrow } = await deploy();
      const id1 = await escrow.computeOrderId("order-abc", "product-xyz");
      const id2 = await escrow.computeOrderId("order-abc", "product-xyz");
      expect(id1).to.equal(id2);
    });

    it("returns different bytes32 for different inputs", async function () {
      const { escrow } = await deploy();
      const id1 = await escrow.computeOrderId("order-abc", "product-xyz");
      const id2 = await escrow.computeOrderId("order-abc", "product-123");
      expect(id1).to.not.equal(id2);
    });
  });

  // ── Edge Cases ───────────────────────────────────────────

  describe("Edge Cases", function () {
    it("cannot confirmDelivery on a disputed escrow", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await escrow.connect(buyer).raiseDispute(orderId);
      await expect(
        escrow.connect(buyer).confirmDelivery(orderId)
      ).to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
    });

    it("cannot autoRelease on a disputed escrow", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await escrow.connect(buyer).raiseDispute(orderId);
      await time.increase(SEVEN_DAYS + 1);
      await expect(escrow.autoRelease(orderId))
        .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
    });

    it("cannot raiseDispute on a released escrow", async function () {
      const { escrow, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      await escrow.connect(buyer).confirmDelivery(orderId);
      await expect(
        escrow.connect(buyer).raiseDispute(orderId)
      ).to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
    });

    it("getEscrow returns zero struct for unknown orderId", async function () {
      const { escrow } = await deploy();
      const unknown = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));
      const e = await escrow.getEscrow(unknown);
      expect(e.buyer).to.equal(ethers.ZeroAddress);
      expect(e.amount).to.equal(0n);
    });

    it("fee of 0 bps sends full amount to farmer", async function () {
      const { escrow, usdc, owner, buyer, farmer, orderId } = await deploy();
      await escrow.connect(owner).updateFee(0);
      const amount = 50n * ONE_USDC;
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, amount, 0n);
      const farmerBefore = await usdc.balanceOf(farmer.address);
      await escrow.connect(buyer).confirmDelivery(orderId);
      expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + amount);
    });

    it("fee of 10% (max) sends correct amounts", async function () {
      const { escrow, usdc, owner, buyer, farmer, treasury, orderId } = await deploy();
      await escrow.connect(owner).updateFee(1000); // 10%
      const amount = 100n * ONE_USDC;
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, amount, 0n);
      const farmerBefore = await usdc.balanceOf(farmer.address);
      const treasuryBefore = await usdc.balanceOf(treasury.address);
      await escrow.connect(buyer).confirmDelivery(orderId);
      expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + 90_000_000n);
      expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + 10_000_000n);
    });

    it("transferOwnership works and old owner loses access", async function () {
      const { escrow, owner, stranger } = await deploy();
      await escrow.connect(owner).transferOwnership(stranger.address);
      expect(await escrow.owner()).to.equal(stranger.address);
      await expect(escrow.connect(owner).updateFee(100))
        .to.be.revertedWithCustomError(escrow, "NotOwner");
    });

    it("transferOwnership reverts for zero address", async function () {
      const { escrow, owner } = await deploy();
      await expect(escrow.connect(owner).transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("resolveDispute reverts if escrow is not disputed", async function () {
      const { escrow, owner, buyer, farmer, orderId } = await deploy();
      await escrow.connect(buyer).createEscrow(orderId, farmer.address, ONE_USDC, 0n);
      // Still LOCKED, not DISPUTED
      await expect(
        escrow.connect(owner).resolveDispute(orderId, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
    });

    it("multiple independent escrows do not interfere", async function () {
      const { escrow, usdc, buyer, farmer, owner } = await deploy();
      const id1 = await escrow.computeOrderId("order-1", "product-A");
      const id2 = await escrow.computeOrderId("order-2", "product-B");

      await escrow.connect(buyer).createEscrow(id1, farmer.address, 10n * ONE_USDC, 0n);
      await escrow.connect(buyer).createEscrow(id2, farmer.address, 20n * ONE_USDC, 0n);

      // Confirm first, dispute second
      await escrow.connect(buyer).confirmDelivery(id1);
      await escrow.connect(buyer).raiseDispute(id2);

      expect((await escrow.getEscrow(id1)).status).to.equal(1); // RELEASED
      expect((await escrow.getEscrow(id2)).status).to.equal(3); // DISPUTED

      // Resolve second
      await escrow.connect(owner).resolveDispute(id2, ethers.ZeroAddress);
      expect((await escrow.getEscrow(id2)).status).to.equal(2); // REFUNDED
    });
  });
});
