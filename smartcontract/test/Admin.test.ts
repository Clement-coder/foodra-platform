import { expect } from "chai";
import { ethers } from "hardhat";

describe("FoodraEscrow – Admin functions (unit)", function () {
  async function deploy() {
    const [owner, treasury, newTreasury, stranger, newOwner] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    return { escrow, owner, treasury, newTreasury, stranger, newOwner };
  }

  // ── updateFee ──────────────────────────────────────────────

  describe("updateFee", function () {
    it("owner updates fee and emits FeeUpdated", async function () {
      const { escrow, owner } = await deploy();
      await expect(escrow.connect(owner).updateFee(300))
        .to.emit(escrow, "FeeUpdated").withArgs(250, 300);
      expect(await escrow.feeBps()).to.equal(300);
    });

    it("can set fee to 0", async function () {
      const { escrow, owner } = await deploy();
      await escrow.connect(owner).updateFee(0);
      expect(await escrow.feeBps()).to.equal(0);
    });

    it("can set fee to MAX_FEE_BPS (1000)", async function () {
      const { escrow, owner } = await deploy();
      await escrow.connect(owner).updateFee(1000);
      expect(await escrow.feeBps()).to.equal(1000);
    });

    it("reverts if fee > 1000 bps", async function () {
      const { escrow, owner } = await deploy();
      await expect(escrow.connect(owner).updateFee(1001))
        .to.be.revertedWithCustomError(escrow, "FeeTooHigh");
    });

    it("reverts if fee = 9999", async function () {
      const { escrow, owner } = await deploy();
      await expect(escrow.connect(owner).updateFee(9999))
        .to.be.revertedWithCustomError(escrow, "FeeTooHigh");
    });

    it("reverts if called by stranger", async function () {
      const { escrow, stranger } = await deploy();
      await expect(escrow.connect(stranger).updateFee(100))
        .to.be.revertedWithCustomError(escrow, "NotOwner");
    });

    it("emits old and new fee values correctly", async function () {
      const { escrow, owner } = await deploy();
      await escrow.connect(owner).updateFee(500);
      await expect(escrow.connect(owner).updateFee(750))
        .to.emit(escrow, "FeeUpdated").withArgs(500, 750);
    });
  });

  // ── updateTreasury ─────────────────────────────────────────

  describe("updateTreasury", function () {
    it("owner updates treasury and emits TreasuryUpdated", async function () {
      const { escrow, owner, treasury, newTreasury } = await deploy();
      await expect(escrow.connect(owner).updateTreasury(newTreasury.address))
        .to.emit(escrow, "TreasuryUpdated")
        .withArgs(treasury.address, newTreasury.address);
      expect(await escrow.treasury()).to.equal(newTreasury.address);
    });

    it("reverts if new treasury is zero address", async function () {
      const { escrow, owner } = await deploy();
      await expect(escrow.connect(owner).updateTreasury(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("reverts if called by stranger", async function () {
      const { escrow, stranger, newTreasury } = await deploy();
      await expect(escrow.connect(stranger).updateTreasury(newTreasury.address))
        .to.be.revertedWithCustomError(escrow, "NotOwner");
    });

    it("new treasury receives fees after update", async function () {
      const { escrow, owner, newTreasury } = await deploy();
      const usdc = await ethers.getContractAt("MockUSDC", await escrow.usdc());
      const [, , buyer, farmer] = await ethers.getSigners();
      await usdc.mint(buyer.address, 100_000_000n);
      await usdc.connect(buyer).approve(await escrow.getAddress(), 100_000_000n);
      const id = ethers.keccak256(ethers.toUtf8Bytes("treasury-test"));

      await escrow.connect(owner).updateTreasury(newTreasury.address);
      await escrow.connect(buyer).createEscrow(id, farmer.address, 100_000_000n, 0n);
      await escrow.connect(buyer).confirmDelivery(id);

      // 2.5% of 100 USDC = 2.5 USDC goes to newTreasury
      expect(await usdc.balanceOf(newTreasury.address)).to.equal(2_500_000n);
    });
  });

  // ── transferOwnership ──────────────────────────────────────

  describe("transferOwnership", function () {
    it("transfers ownership to new address", async function () {
      const { escrow, owner, newOwner } = await deploy();
      await escrow.connect(owner).transferOwnership(newOwner.address);
      expect(await escrow.owner()).to.equal(newOwner.address);
    });

    it("old owner loses admin access after transfer", async function () {
      const { escrow, owner, newOwner } = await deploy();
      await escrow.connect(owner).transferOwnership(newOwner.address);
      await expect(escrow.connect(owner).updateFee(100))
        .to.be.revertedWithCustomError(escrow, "NotOwner");
    });

    it("new owner gains admin access", async function () {
      const { escrow, owner, newOwner } = await deploy();
      await escrow.connect(owner).transferOwnership(newOwner.address);
      await expect(escrow.connect(newOwner).updateFee(300)).to.not.be.reverted;
    });

    it("reverts if new owner is zero address", async function () {
      const { escrow, owner } = await deploy();
      await expect(escrow.connect(owner).transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(escrow, "InvalidAddress");
    });

    it("reverts if called by stranger", async function () {
      const { escrow, stranger, newOwner } = await deploy();
      await expect(escrow.connect(stranger).transferOwnership(newOwner.address))
        .to.be.revertedWithCustomError(escrow, "NotOwner");
    });

    it("ownership can be transferred multiple times", async function () {
      const { escrow, owner, newOwner, stranger } = await deploy();
      await escrow.connect(owner).transferOwnership(newOwner.address);
      await escrow.connect(newOwner).transferOwnership(stranger.address);
      expect(await escrow.owner()).to.equal(stranger.address);
    });
  });
});
