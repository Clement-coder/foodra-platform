import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE_USDC = 1_000_000n;
const SEVEN_DAYS = 7 * 24 * 60 * 60;

describe("FoodraEscrow – autoRelease (unit)", function () {
  async function deploy() {
    const [owner, treasury, buyer, farmer, anyone] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    await usdc.mint(buyer.address, 1000n * ONE_USDC);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 1000n * ONE_USDC);
    const id = ethers.keccak256(ethers.toUtf8Bytes("order-auto"));
    return { escrow, usdc, owner, treasury, buyer, farmer, anyone, id };
  }

  it("reverts if called before 7 days", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await expect(escrow.autoRelease(id))
      .to.be.revertedWithCustomError(escrow, "TooEarlyForAutoRelease");
  });

  it("reverts one second before 7 days have elapsed", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    // increase by 6 days 23 hours 59 minutes 59 seconds — still too early
    await time.increase(SEVEN_DAYS - 2);
    await expect(escrow.autoRelease(id))
      .to.be.revertedWithCustomError(escrow, "TooEarlyForAutoRelease");
  });

  it("succeeds at 7 days + 1 second", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await time.increase(SEVEN_DAYS + 1);
    await expect(escrow.autoRelease(id)).to.not.be.reverted;
  });

  it("emits AutoReleased and DeliveryConfirmed", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await time.increase(SEVEN_DAYS + 1);
    await expect(escrow.autoRelease(id))
      .to.emit(escrow, "AutoReleased").withArgs(id)
      .and.to.emit(escrow, "DeliveryConfirmed");
  });

  it("pays farmer 97.5% and treasury 2.5%", async function () {
    const { escrow, usdc, buyer, farmer, treasury, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await time.increase(SEVEN_DAYS + 1);
    const farmerBefore = await usdc.balanceOf(farmer.address);
    const treasuryBefore = await usdc.balanceOf(treasury.address);
    await escrow.autoRelease(id);
    expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + 97_500_000n);
    expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + 2_500_000n);
  });

  it("sets status to RELEASED", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await time.increase(SEVEN_DAYS + 1);
    await escrow.autoRelease(id);
    expect((await escrow.getEscrow(id)).status).to.equal(1); // RELEASED
  });

  it("can be called by anyone (not just buyer)", async function () {
    const { escrow, buyer, farmer, anyone, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await time.increase(SEVEN_DAYS + 1);
    await expect(escrow.connect(anyone).autoRelease(id)).to.not.be.reverted;
  });

  it("reverts if escrow is disputed (even after 7 days)", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await escrow.connect(buyer).raiseDispute(id);
    await time.increase(SEVEN_DAYS + 1);
    await expect(escrow.autoRelease(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("reverts if already released", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await time.increase(SEVEN_DAYS + 1);
    await escrow.autoRelease(id);
    await expect(escrow.autoRelease(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("reverts for unknown orderId", async function () {
    const { escrow } = await deploy();
    const unknown = ethers.keccak256(ethers.toUtf8Bytes("ghost"));
    await expect(escrow.autoRelease(unknown))
      .to.be.revertedWithCustomError(escrow, "EscrowNotFound");
  });

  it("works well after 30 days", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await time.increase(30 * 24 * 3600);
    await expect(escrow.autoRelease(id)).to.not.be.reverted;
  });
});
