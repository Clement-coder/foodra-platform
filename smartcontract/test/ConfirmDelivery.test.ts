import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_USDC = 1_000_000n;

describe("FoodraEscrow – confirmDelivery (unit)", function () {
  async function deploy() {
    const [owner, treasury, buyer, farmer, stranger] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    await usdc.mint(buyer.address, 1000n * ONE_USDC);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 1000n * ONE_USDC);
    const id = ethers.keccak256(ethers.toUtf8Bytes("order-confirm"));
    return { escrow, usdc, owner, treasury, buyer, farmer, stranger, id };
  }

  it("sets status to RELEASED", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await escrow.connect(buyer).confirmDelivery(id);
    expect((await escrow.getEscrow(id)).status).to.equal(1); // RELEASED
  });

  it("pays farmer 97.5% at default 2.5% fee", async function () {
    const { escrow, usdc, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    const before = await usdc.balanceOf(farmer.address);
    await escrow.connect(buyer).confirmDelivery(id);
    expect(await usdc.balanceOf(farmer.address)).to.equal(before + 97_500_000n);
  });

  it("pays treasury 2.5% at default fee", async function () {
    const { escrow, usdc, buyer, farmer, treasury, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    const before = await usdc.balanceOf(treasury.address);
    await escrow.connect(buyer).confirmDelivery(id);
    expect(await usdc.balanceOf(treasury.address)).to.equal(before + 2_500_000n);
  });

  it("emits DeliveryConfirmed with correct farmerAmount and fee", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await expect(escrow.connect(buyer).confirmDelivery(id))
      .to.emit(escrow, "DeliveryConfirmed")
      .withArgs(id, 97_500_000n, 2_500_000n);
  });

  it("contract balance is zero after release", async function () {
    const { escrow, usdc, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await escrow.connect(buyer).confirmDelivery(id);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0n);
  });

  it("reverts if called by farmer (not buyer)", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await expect(escrow.connect(farmer).confirmDelivery(id))
      .to.be.revertedWithCustomError(escrow, "NotBuyer");
  });

  it("reverts if called by stranger", async function () {
    const { escrow, buyer, farmer, stranger, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await expect(escrow.connect(stranger).confirmDelivery(id))
      .to.be.revertedWithCustomError(escrow, "NotBuyer");
  });

  it("reverts if escrow already released", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await escrow.connect(buyer).confirmDelivery(id);
    await expect(escrow.connect(buyer).confirmDelivery(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("reverts if escrow is disputed", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await escrow.connect(buyer).raiseDispute(id);
    await expect(escrow.connect(buyer).confirmDelivery(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("reverts if orderId does not exist", async function () {
    const { escrow, buyer } = await deploy();
    const unknown = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));
    await expect(escrow.connect(buyer).confirmDelivery(unknown))
      .to.be.revertedWithCustomError(escrow, "EscrowNotFound");
  });

  it("fee = 0 bps: farmer receives full amount, treasury receives 0", async function () {
    const { escrow, usdc, owner, buyer, farmer, treasury, id } = await deploy();
    await escrow.connect(owner).updateFee(0);
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    const farmerBefore = await usdc.balanceOf(farmer.address);
    const treasuryBefore = await usdc.balanceOf(treasury.address);
    await escrow.connect(buyer).confirmDelivery(id);
    expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + 100n * ONE_USDC);
    expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore); // unchanged
  });

  it("fee = 1000 bps (10%): correct split", async function () {
    const { escrow, usdc, owner, buyer, farmer, treasury, id } = await deploy();
    await escrow.connect(owner).updateFee(1000);
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    const farmerBefore = await usdc.balanceOf(farmer.address);
    const treasuryBefore = await usdc.balanceOf(treasury.address);
    await escrow.connect(buyer).confirmDelivery(id);
    expect(await usdc.balanceOf(farmer.address)).to.equal(farmerBefore + 90_000_000n);
    expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + 10_000_000n);
  });

  it("fee = 1 bps: correct split on small amount", async function () {
    const { escrow, usdc, owner, buyer, farmer, treasury, id } = await deploy();
    await escrow.connect(owner).updateFee(1); // 0.01%
    const amount = 10_000n; // 0.01 USDC
    await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
    await escrow.connect(buyer).confirmDelivery(id);
    // fee = 10000 * 1 / 10000 = 1 unit
    expect(await usdc.balanceOf(farmer.address)).to.equal(9999n);
    expect(await usdc.balanceOf(treasury.address)).to.equal(1n);
  });
});
