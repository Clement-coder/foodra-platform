/**
 * Access control matrix — exhaustively tests every privileged function
 * against every role: owner, buyer, farmer, stranger.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployEscrow, ONE_USDC } from "./helpers";

describe("FoodraEscrow – Access Control Matrix", function () {
  async function setup() {
    const { escrow, usdc, owner, treasury, buyers, farmers, signers } = await deployEscrow(1);
    const buyer = buyers[0];
    const farmer = farmers[0];
    const stranger = signers[signers.length - 1];
    const id = ethers.keccak256(ethers.toUtf8Bytes("acl-test"));
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await escrow.connect(buyer).raiseDispute(id);
    return { escrow, owner, buyer, farmer, stranger, id };
  }

  // resolveDispute — only owner
  for (const [role, getActor] of [
    ["buyer",   (s: any) => s.buyer],
    ["farmer",  (s: any) => s.farmer],
    ["stranger",(s: any) => s.stranger],
  ] as const) {
    it(`resolveDispute: ${role} cannot resolve`, async function () {
      const ctx = await setup();
      const actor = getActor(ctx);
      await expect(ctx.escrow.connect(actor).resolveDispute(ctx.id, ethers.ZeroAddress))
        .to.be.revertedWithCustomError(ctx.escrow, "NotOwner");
    });
  }

  it("resolveDispute: owner can resolve", async function () {
    const { escrow, owner, id } = await setup();
    await expect(escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress)).to.not.be.reverted;
  });

  // updateFee — only owner
  for (const [role, getActor] of [
    ["buyer",   (s: any) => s.buyer],
    ["farmer",  (s: any) => s.farmer],
    ["stranger",(s: any) => s.stranger],
  ] as const) {
    it(`updateFee: ${role} cannot update fee`, async function () {
      const ctx = await setup();
      await expect(ctx.escrow.connect(getActor(ctx)).updateFee(100))
        .to.be.revertedWithCustomError(ctx.escrow, "NotOwner");
    });
  }

  // updateTreasury — only owner
  for (const [role, getActor] of [
    ["buyer",   (s: any) => s.buyer],
    ["stranger",(s: any) => s.stranger],
  ] as const) {
    it(`updateTreasury: ${role} cannot update treasury`, async function () {
      const ctx = await setup();
      const [newAddr] = await ethers.getSigners();
      await expect(ctx.escrow.connect(getActor(ctx)).updateTreasury(newAddr.address))
        .to.be.revertedWithCustomError(ctx.escrow, "NotOwner");
    });
  }

  // transferOwnership — only owner
  it("transferOwnership: stranger cannot transfer", async function () {
    const { escrow, stranger } = await setup();
    await expect(escrow.connect(stranger).transferOwnership(stranger.address))
      .to.be.revertedWithCustomError(escrow, "NotOwner");
  });

  // confirmDelivery — only buyer
  it("confirmDelivery: farmer cannot confirm (disputed escrow → NotLocked, but fresh escrow → NotBuyer)", async function () {
    const { escrow, usdc, owner, buyer, farmer } = await setup();
    // Create a fresh locked escrow
    const id2 = ethers.keccak256(ethers.toUtf8Bytes("fresh"));
    await usdc.connect(buyer).approve(await escrow.getAddress(), 100n * ONE_USDC);
    await escrow.connect(buyer).createEscrow(id2, farmer.address, 100n * ONE_USDC, 0n);
    await expect(escrow.connect(farmer).confirmDelivery(id2))
      .to.be.revertedWithCustomError(escrow, "NotBuyer");
  });
});
