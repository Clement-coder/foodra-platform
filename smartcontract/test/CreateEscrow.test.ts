import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_USDC = 1_000_000n;

describe("FoodraEscrow – createEscrow (unit)", function () {
  async function deploy() {
    const [owner, treasury, buyer, farmer, buyer2, stranger] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    const fund = async (addr: any, amt = 1000n * ONE_USDC) => {
      await usdc.mint(addr, amt);
      await usdc.connect(await ethers.getSigner(addr.address ?? addr)).approve(await escrow.getAddress(), amt);
    };
    await fund(buyer);
    await fund(buyer2);
    const id = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));
    return { escrow, usdc, owner, treasury, buyer, farmer, buyer2, stranger, id };
  }

  it("stores correct escrow struct fields", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    const oid = id("order-1");
    const amount = 250n * ONE_USDC;
    const ngn = 400_000n;
    await escrow.connect(buyer).createEscrow(oid, farmer.address, amount, ngn);
    const e = await escrow.getEscrow(oid);
    expect(e.buyer).to.equal(buyer.address);
    expect(e.farmer).to.equal(farmer.address);
    expect(e.amount).to.equal(amount);
    expect(e.ngnAmount).to.equal(ngn);
    expect(e.status).to.equal(0); // LOCKED
    expect(e.createdAt).to.be.gt(0n);
  });

  it("transfers USDC from buyer to contract", async function () {
    const { escrow, usdc, buyer, farmer, id } = await deploy();
    const oid = id("order-2");
    const amount = 100n * ONE_USDC;
    const buyerBefore = await usdc.balanceOf(buyer.address);
    await escrow.connect(buyer).createEscrow(oid, farmer.address, amount, 0n);
    expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBefore - amount);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(amount);
  });

  it("emits EscrowCreated with correct args", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    const oid = id("order-3");
    const amount = 50n * ONE_USDC;
    await expect(escrow.connect(buyer).createEscrow(oid, farmer.address, amount, 80000n))
      .to.emit(escrow, "EscrowCreated")
      .withArgs(oid, buyer.address, farmer.address, amount, 80000n);
  });

  it("reverts: farmer = zero address", async function () {
    const { escrow, buyer, id } = await deploy();
    await expect(escrow.connect(buyer).createEscrow(id("o"), ethers.ZeroAddress, ONE_USDC, 0n))
      .to.be.revertedWithCustomError(escrow, "InvalidAddress");
  });

  it("reverts: buyer == farmer (same address)", async function () {
    const { escrow, buyer, id } = await deploy();
    await expect(escrow.connect(buyer).createEscrow(id("o"), buyer.address, ONE_USDC, 0n))
      .to.be.revertedWithCustomError(escrow, "InvalidAddress");
  });

  it("reverts: amount = 0", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await expect(escrow.connect(buyer).createEscrow(id("o"), farmer.address, 0n, 0n))
      .to.be.revertedWithCustomError(escrow, "InvalidAmount");
  });

  it("reverts: duplicate orderId", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    const oid = id("dup");
    await escrow.connect(buyer).createEscrow(oid, farmer.address, ONE_USDC, 0n);
    await expect(escrow.connect(buyer).createEscrow(oid, farmer.address, ONE_USDC, 0n))
      .to.be.revertedWithCustomError(escrow, "EscrowAlreadyExists");
  });

  it("reverts: insufficient USDC balance (no mint)", async function () {
    const { escrow, farmer, stranger, id } = await deploy();
    // stranger has no USDC and no approval
    await expect(escrow.connect(stranger).createEscrow(id("o"), farmer.address, ONE_USDC, 0n))
      .to.be.reverted;
  });

  it("reverts: insufficient allowance", async function () {
    const { escrow, usdc, farmer, stranger, id } = await deploy();
    await usdc.mint(stranger.address, 100n * ONE_USDC);
    // no approve — allowance is 0
    await expect(escrow.connect(stranger).createEscrow(id("o"), farmer.address, ONE_USDC, 0n))
      .to.be.reverted;
  });

  it("two different buyers can create escrows for different orderIds", async function () {
    const { escrow, usdc, buyer, buyer2, farmer, id } = await deploy();
    const oid1 = id("buyer1-order");
    const oid2 = id("buyer2-order");
    await escrow.connect(buyer).createEscrow(oid1, farmer.address, 10n * ONE_USDC, 0n);
    await escrow.connect(buyer2).createEscrow(oid2, farmer.address, 20n * ONE_USDC, 0n);
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(30n * ONE_USDC);
    expect((await escrow.getEscrow(oid1)).buyer).to.equal(buyer.address);
    expect((await escrow.getEscrow(oid2)).buyer).to.equal(buyer2.address);
  });

  it("ngnAmount = 0 is valid", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    await expect(escrow.connect(buyer).createEscrow(id("o"), farmer.address, ONE_USDC, 0n))
      .to.not.be.reverted;
  });

  it("large ngnAmount is stored correctly", async function () {
    const { escrow, buyer, farmer, id } = await deploy();
    const oid = id("large-ngn");
    const ngn = 999_999_999n;
    await escrow.connect(buyer).createEscrow(oid, farmer.address, ONE_USDC, ngn);
    expect((await escrow.getEscrow(oid)).ngnAmount).to.equal(ngn);
  });
});
