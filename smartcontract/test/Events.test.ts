/**
 * Event emission tests — verifies every event is emitted with correct args
 * across all contract functions.
 */
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { deployEscrow, ONE_USDC, SEVEN_DAYS } from "./helpers";

describe("FoodraEscrow – Events", function () {
  async function setup() {
    const { escrow, usdc, owner, treasury, buyers, farmers } = await deployEscrow(1);
    const buyer = buyers[0];
    const farmer = farmers[0];
    const id = ethers.keccak256(ethers.toUtf8Bytes("event-test"));
    return { escrow, usdc, owner, treasury, buyer, farmer, id };
  }

  it("EscrowCreated: all indexed and non-indexed args correct", async function () {
    const { escrow, buyer, farmer, id } = await setup();
    const amount = 50n * ONE_USDC;
    const ngn = 80_000n;
    await expect(escrow.connect(buyer).createEscrow(id, farmer.address, amount, ngn))
      .to.emit(escrow, "EscrowCreated")
      .withArgs(id, buyer.address, farmer.address, amount, ngn);
  });

  it("DeliveryConfirmed: emitted on confirmDelivery with correct split", async function () {
    const { escrow, buyer, farmer, id } = await setup();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await expect(escrow.connect(buyer).confirmDelivery(id))
      .to.emit(escrow, "DeliveryConfirmed")
      .withArgs(id, 97_500_000n, 2_500_000n);
  });

  it("DeliveryConfirmed: emitted on autoRelease", async function () {
    const { escrow, buyer, farmer, id } = await setup();
    await escrow.connect(buyer).createEscrow(id, farmer.address, 100n * ONE_USDC, 0n);
    await time.increase(SEVEN_DAYS + 1);
    await expect(escrow.autoRelease(id))
      .to.emit(escrow, "DeliveryConfirmed");
  });

  it("AutoReleased: emitted only on autoRelease (not confirmDelivery)", async function () {
    const { escrow, buyer, farmer } = await setup();
    const id1 = ethers.keccak256(ethers.toUtf8Bytes("auto-yes"));
    const id2 = ethers.keccak256(ethers.toUtf8Bytes("auto-no"));

    await escrow.connect(buyer).createEscrow(id1, farmer.address, ONE_USDC, 0n);
    await escrow.connect(buyer).createEscrow(id2, farmer.address, ONE_USDC, 0n);

    await time.increase(SEVEN_DAYS + 1);
    await expect(escrow.autoRelease(id1)).to.emit(escrow, "AutoReleased").withArgs(id1);
    await expect(escrow.connect(buyer).confirmDelivery(id2)).to.not.emit(escrow, "AutoReleased");
  });

  it("DisputeRaised: emitted with correct raisedBy", async function () {
    const { escrow, buyer, farmer, id } = await setup();
    await escrow.connect(buyer).createEscrow(id, farmer.address, ONE_USDC, 0n);
    await expect(escrow.connect(farmer).raiseDispute(id))
      .to.emit(escrow, "DisputeRaised")
      .withArgs(id, farmer.address);
  });

  it("DisputeResolved: emitted with buyer as recipient on refund", async function () {
    const { escrow, owner, buyer, farmer, id } = await setup();
    const amount = 100n * ONE_USDC;
    await escrow.connect(buyer).createEscrow(id, farmer.address, amount, 0n);
    await escrow.connect(buyer).raiseDispute(id);
    await expect(escrow.connect(owner).resolveDispute(id, ethers.ZeroAddress))
      .to.emit(escrow, "DisputeResolved")
      .withArgs(id, buyer.address, amount);
  });

  it("FeeUpdated: emits old and new fee", async function () {
    const { escrow, owner } = await setup();
    await expect(escrow.connect(owner).updateFee(400))
      .to.emit(escrow, "FeeUpdated")
      .withArgs(250, 400);
  });

  it("TreasuryUpdated: emits old and new treasury", async function () {
    const { escrow, owner, treasury } = await setup();
    const [, , , , , newTreasury] = await ethers.getSigners();
    await expect(escrow.connect(owner).updateTreasury(newTreasury.address))
      .to.emit(escrow, "TreasuryUpdated")
      .withArgs(treasury.address, newTreasury.address);
  });
});
