import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_USDC = 1_000_000n;

describe("FoodraEscrow – raiseDispute (unit)", function () {
  async function deploy() {
    const [owner, treasury, buyer, farmer, stranger] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    await usdc.mint(buyer.address, 500n * ONE_USDC);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 500n * ONE_USDC);
    const id = ethers.keccak256(ethers.toUtf8Bytes("order-dispute"));
    return { escrow, usdc, owner, treasury, buyer, farmer, stranger, id };
  }

  it("buyer can raise dispute — sets status DISPUTED", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await escrow.connect(buyer).raiseDispute(id);
    expect((await escrow.getEscrow(id)).status).to.equal(3); // DISPUTED
  });

  it("farmer can raise dispute", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await escrow.connect(farmer).raiseDispute(id);
    expect((await escrow.getEscrow(id)).status).to.equal(3);
  });

  it("emits DisputeRaised with buyer address", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await expect(escrow.connect(buyer).raiseDispute(id))
      .to.emit(escrow, "DisputeRaised")
      .withArgs(id, buyer.address);
  });

  it("emits DisputeRaised with farmer address", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await expect(escrow.connect(farmer).raiseDispute(id))
      .to.emit(escrow, "DisputeRaised")
      .withArgs(id, farmer.address);
  });

  it("USDC stays locked in contract after dispute", async function () {
    const { escrow, usdc, buyer, farmer, id } = await deploy();
    const amount = 100n * ONE_USDC;
    await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
    await escrow.connect(buyer).raiseDispute(id);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(amount);
  });

  it("reverts if stranger raises dispute", async function () {
    const { escrow, buyer, farmer, stranger, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await expect(escrow.connect(stranger).raiseDispute(id))
      .to.be.revertedWithCustomError(escrow, "NotParty");
  });

  it("reverts if escrow already released", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await escrow.connect(buyer).confirmDelivery(id);
    await expect(escrow.connect(buyer).raiseDispute(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("reverts if escrow already disputed (double dispute)", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await escrow.connect(buyer).raiseDispute(id);
    await expect(escrow.connect(buyer).raiseDispute(id))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("reverts for unknown orderId", async function () {
    const { escrow, buyer } = await deploy();
    const unknown = ethers.keccak256(ethers.toUtf8Bytes("ghost"));
    await expect(escrow.connect(buyer).raiseDispute(unknown))
      .to.be.revertedWithCustomError(escrow, "EscrowNotFound");
  });
});
