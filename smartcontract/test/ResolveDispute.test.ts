import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_USDC = 1_000_000n;

describe("FoodraEscrow – resolveDispute (unit)", function () {
  async function deploy() {
    const [owner, treasury, buyer, farmer, stranger] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    await usdc.mint(buyer.address, 500n * ONE_USDC);
    await usdc.connect(buyer).approve(await escrow.getAddress(), 500n * ONE_USDC);
    const id = ethers.keccak256(ethers.toUtf8Bytes("order-resolve"));

    // Helper: create + dispute
    const createAndDispute = async (amount = 100n * ONE_USDC) => {
      await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
      await escrow.connect(buyer).raiseDispute(id);
    };

    return { escrow, usdc, owner, treasury, buyer, farmer, stranger, id, createAndDispute };
  }

  it("refunds buyer when releaseTo = zero address", async function () {
    const { escrow, usdc, owner, buyer, id, createAndDispute } = await deploy();
    const amount = 100n * ONE_USDC;
    await createAndDispute(amount);
    const before = await usdc.balanceOf(buyer.address);
    await escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress);
    expect(await usdc.balanceOf(buyer.address)).to.equal(before + amount);
  });

  it("sets status REFUNDED when refunding buyer", async function () {
    const { escrow, owner, id, createAndDispute } = await deploy();
    await createAndDispute();
    await escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress);
    expect((await escrow.getEscrow(id)).status).to.equal(2); // REFUNDED
  });

  it("releases full amount to farmer when releaseTo = farmer", async function () {
    const { escrow, usdc, owner, farmer, id, createAndDispute } = await deploy();
    const amount = 100n * ONE_USDC;
    await createAndDispute(amount);
    const before = await usdc.balanceOf(farmer.address);
    await escrow.connect(owner).resolveDispute(id, farmer.address);
    expect(await usdc.balanceOf(farmer.address)).to.equal(before + amount);
  });

  it("sets status RELEASED when releasing to farmer", async function () {
    const { escrow, owner, farmer, id, createAndDispute } = await deploy();
    await createAndDispute();
    await escrow.connect(owner).resolveDispute(id, farmer.address);
    expect((await escrow.getEscrow(id)).status).to.equal(1); // RELEASED
  });

  it("emits DisputeResolved with correct args (refund)", async function () {
    const { escrow, owner, buyer, id, createAndDispute } = await deploy();
    const amount = 100n * ONE_USDC;
    await createAndDispute(amount);
    await expect(escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress))
      .to.emit(escrow, "DisputeResolved")
      .withArgs(id, buyer.address, amount);
  });

  it("emits DisputeResolved with correct args (release to farmer)", async function () {
    const { escrow, owner, farmer, id, createAndDispute } = await deploy();
    const amount = 100n * ONE_USDC;
    await createAndDispute(amount);
    await expect(escrow.connect(owner).resolveDispute(id, farmer.address))
      .to.emit(escrow, "DisputeResolved")
      .withArgs(id, farmer.address, amount);
  });

  it("no fee deducted — full amount transferred", async function () {
    const { escrow, usdc, owner, farmer, id, createAndDispute } = await deploy();
    const amount = 100n * ONE_USDC;
    await createAndDispute(amount);
    const before = await usdc.balanceOf(farmer.address);
    await escrow.connect(owner).resolveDispute(id, farmer.address);
    expect(await usdc.balanceOf(farmer.address)).to.equal(before + amount); // full, no fee
  });

  it("contract balance is zero after resolution", async function () {
    const { escrow, usdc, owner, id, createAndDispute } = await deploy();
    await createAndDispute();
    await escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0n);
  });

  it("reverts if caller is not owner", async function () {
    const { escrow, stranger, id, createAndDispute } = await deploy();
    await createAndDispute();
    await expect(escrow.connect(stranger).resolveDispute(id, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(escrow, "NotOwner");
  });

  it("reverts if buyer tries to resolve", async function () {
    const { escrow, buyer, id, createAndDispute } = await deploy();
    await createAndDispute();
    await expect(escrow.connect(buyer).resolveDispute(id, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(escrow, "NotOwner");
  });

  it("reverts if escrow is LOCKED (not disputed)", async function () {
    const { escrow, usdc, owner, buyer, farmer } = await deploy();
    const id2 = ethers.keccak256(ethers.toUtf8Bytes("locked-order"));
    await escrow.connect(buyer).createEscrow(id2, farmer.address, ONE_USDC, 0n);
    await expect(escrow.connect(owner).resolveDispute(id2, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(escrow, "EscrowNotLocked");
  });

  it("reverts if escrow does not exist", async function () {
    const { escrow, owner } = await deploy();
    const ghost = ethers.keccak256(ethers.toUtf8Bytes("ghost"));
    await expect(escrow.connect(owner).resolveDispute(ghost, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(escrow, "EscrowNotFound");
  });

  it("can resolve to a third-party address (not buyer or farmer)", async function () {
    const { escrow, usdc, owner, stranger, id, createAndDispute } = await deploy();
    const amount = 100n * ONE_USDC;
    await createAndDispute(amount);
    const before = await usdc.balanceOf(stranger.address);
    await escrow.connect(owner).resolveDispute(id, stranger.address);
    expect(await usdc.balanceOf(stranger.address)).to.equal(before + amount);
  });
});
