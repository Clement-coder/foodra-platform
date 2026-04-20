/**
 * Integration tests — full end-to-end marketplace flows
 *
 * These tests simulate real-world usage: multiple buyers, multiple farmers,
 * concurrent escrows, fee changes mid-flight, ownership handover, etc.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const ONE_USDC = 1_000_000n;
const SEVEN_DAYS = 7 * 24 * 60 * 60;

describe("Integration – Happy Path Flows", function () {
  async function setup() {
    const [owner, treasury, buyer1, buyer2, farmer1, farmer2, anyone] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    const escrowAddr = await escrow.getAddress();

    // Fund buyers
    for (const buyer of [buyer1, buyer2]) {
      await usdc.mint(buyer.address, 10_000n * ONE_USDC);
      await usdc.connect(buyer).approve(escrowAddr, 10_000n * ONE_USDC);
    }

    const oid = (s: string) => escrow.computeOrderId(s, s + "-prod");
    return { escrow, usdc, owner, treasury, buyer1, buyer2, farmer1, farmer2, anyone, oid };
  }

  it("Flow 1: buyer creates escrow → confirms delivery → farmer paid", async function () {
    const { escrow, usdc, buyer1, farmer1, treasury, oid } = await setup();
    const id = await oid("flow1");
    const amount = 200n * ONE_USDC;

    await escrow.connect(buyer1).createEscrow(id, farmer1.address, amount, 320_000n);

    const farmerBefore = await usdc.balanceOf(farmer1.address);
    const treasuryBefore = await usdc.balanceOf(treasury.address);

    await escrow.connect(buyer1).confirmDelivery(id);

    expect(await usdc.balanceOf(farmer1.address)).to.equal(farmerBefore + 195_000_000n); // 97.5%
    expect(await usdc.balanceOf(treasury.address)).to.equal(treasuryBefore + 5_000_000n); // 2.5%
    expect((await escrow.getEscrow(id)).status).to.equal(1); // RELEASED
  });

  it("Flow 2: buyer creates escrow → 7 days pass → auto-release", async function () {
    const { escrow, usdc, buyer1, farmer1, oid } = await setup();
    const id = await oid("flow2");
    await escrow.connect(buyer1).createEscrow(id, farmer1.address, 100n * ONE_USDC, 0n);

    await time.increase(SEVEN_DAYS + 1);

    const farmerBefore = await usdc.balanceOf(farmer1.address);
    await escrow.autoRelease(id);
    expect(await usdc.balanceOf(farmer1.address)).to.equal(farmerBefore + 97_500_000n);
  });

  it("Flow 3: dispute raised by buyer → admin refunds buyer", async function () {
    const { escrow, usdc, owner, buyer1, farmer1, oid } = await setup();
    const id = await oid("flow3");
    const amount = 150n * ONE_USDC;
    await escrow.connect(buyer1).createEscrow(id, farmer1.address, amount, 0n);
    await escrow.connect(buyer1).raiseDispute(id);

    const buyerBefore = await usdc.balanceOf(buyer1.address);
    await escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress);
    expect(await usdc.balanceOf(buyer1.address)).to.equal(buyerBefore + amount);
    expect((await escrow.getEscrow(id)).status).to.equal(2); // REFUNDED
  });

  it("Flow 4: dispute raised by farmer → admin releases to farmer", async function () {
    const { escrow, usdc, owner, buyer1, farmer1, oid } = await setup();
    const id = await oid("flow4");
    const amount = 80n * ONE_USDC;
    await escrow.connect(buyer1).createEscrow(id, farmer1.address, amount, 0n);
    await escrow.connect(farmer1).raiseDispute(id);

    const farmerBefore = await usdc.balanceOf(farmer1.address);
    await escrow.connect(owner).resolveDispute(id, farmer1.address);
    expect(await usdc.balanceOf(farmer1.address)).to.equal(farmerBefore + amount);
  });

  it("Flow 5: multiple concurrent escrows — independent lifecycle", async function () {
    const { escrow, usdc, owner, buyer1, buyer2, farmer1, farmer2, oid } = await setup();
    const id1 = await oid("concurrent-1");
    const id2 = await oid("concurrent-2");
    const id3 = await oid("concurrent-3");

    await escrow.connect(buyer1).createEscrow(id1, farmer1.address, 50n * ONE_USDC, 0n);
    await escrow.connect(buyer1).createEscrow(id2, farmer2.address, 75n * ONE_USDC, 0n);
    await escrow.connect(buyer2).createEscrow(id3, farmer1.address, 100n * ONE_USDC, 0n);

    // id1: confirm delivery
    await escrow.connect(buyer1).confirmDelivery(id1);
    // id2: dispute → refund
    await escrow.connect(buyer1).raiseDispute(id2);
    await escrow.connect(owner).resolveDispute(id2, ethers.ZeroAddress);
    // id3: auto-release
    await time.increase(SEVEN_DAYS + 1);
    await escrow.autoRelease(id3);

    expect((await escrow.getEscrow(id1)).status).to.equal(1); // RELEASED
    expect((await escrow.getEscrow(id2)).status).to.equal(2); // REFUNDED
    expect((await escrow.getEscrow(id3)).status).to.equal(1); // RELEASED
    expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(0n);
  });

  it("Flow 6: fee updated between escrows — each uses fee at time of release", async function () {
    const { escrow, usdc, owner, buyer1, farmer1, treasury, oid } = await setup();
    const id1 = await oid("fee-before");
    const id2 = await oid("fee-after");

    // Create both escrows at default 2.5% fee
    await escrow.connect(buyer1).createEscrow(id1, farmer1.address, 100n * ONE_USDC, 0n);
    await escrow.connect(buyer1).createEscrow(id2, farmer1.address, 100n * ONE_USDC, 0n);

    // Update fee to 5% before releasing id2
    await escrow.connect(owner).updateFee(500);

    const t1Before = await usdc.balanceOf(treasury.address);
    await escrow.connect(buyer1).confirmDelivery(id1);
    const t1After = await usdc.balanceOf(treasury.address);
    // id1 released at 5% (fee is live at release time)
    expect(t1After - t1Before).to.equal(5_000_000n);

    const t2Before = await usdc.balanceOf(treasury.address);
    await escrow.connect(buyer1).confirmDelivery(id2);
    const t2After = await usdc.balanceOf(treasury.address);
    expect(t2After - t2Before).to.equal(5_000_000n);
  });

  it("Flow 7: ownership transfer → new owner resolves dispute", async function () {
    const { escrow, owner, buyer1, farmer1, anyone, oid } = await setup();
    const id = await oid("ownership-flow");
    await escrow.connect(buyer1).createEscrow(id, farmer1.address, 50n * ONE_USDC, 0n);
    await escrow.connect(buyer1).raiseDispute(id);

    // Transfer ownership to 'anyone'
    await escrow.connect(owner).transferOwnership(anyone.address);

    // Old owner cannot resolve
    await expect(escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(escrow, "NotOwner");

    // New owner can resolve
    await expect(escrow.connect(anyone).resolveDispute(id, ethers.ZeroAddress))
      .to.not.be.reverted;
  });
});
