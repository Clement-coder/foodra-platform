import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_USDC = 1_000_000n;

describe("FoodraEscrow – computeOrderId & getEscrow (unit)", function () {
  async function deploy() {
    const [, treasury] = await ethers.getSigners();
    const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const escrow = await (await ethers.getContractFactory("FoodraEscrow")).deploy(
      await usdc.getAddress(), treasury.address
    );
    return { escrow };
  }

  describe("computeOrderId", function () {
    it("is deterministic for same inputs", async function () {
      const { escrow } = await deploy();
      const a = await escrow.computeOrderId("order-1", "product-A");
      const b = await escrow.computeOrderId("order-1", "product-A");
      expect(a).to.equal(b);
    });

    it("differs when orderId changes", async function () {
      const { escrow } = await deploy();
      const a = await escrow.computeOrderId("order-1", "product-A");
      const b = await escrow.computeOrderId("order-2", "product-A");
      expect(a).to.not.equal(b);
    });

    it("differs when productId changes", async function () {
      const { escrow } = await deploy();
      const a = await escrow.computeOrderId("order-1", "product-A");
      const b = await escrow.computeOrderId("order-1", "product-B");
      expect(a).to.not.equal(b);
    });

    it("returns bytes32 (66 hex chars with 0x prefix)", async function () {
      const { escrow } = await deploy();
      const result = await escrow.computeOrderId("x", "y");
      expect(result).to.match(/^0x[0-9a-f]{64}$/i);
    });

    it("matches off-chain keccak256(abi.encodePacked(a, b))", async function () {
      const { escrow } = await deploy();
      const onChain = await escrow.computeOrderId("hello", "world");
      const offChain = ethers.keccak256(
        ethers.concat([ethers.toUtf8Bytes("hello"), ethers.toUtf8Bytes("world")])
      );
      expect(onChain).to.equal(offChain);
    });

    it("empty strings produce a valid bytes32", async function () {
      const { escrow } = await deploy();
      const result = await escrow.computeOrderId("", "");
      expect(result).to.match(/^0x[0-9a-f]{64}$/i);
    });

    it("long strings work correctly", async function () {
      const { escrow } = await deploy();
      const long = "a".repeat(200);
      const result = await escrow.computeOrderId(long, long);
      expect(result).to.match(/^0x[0-9a-f]{64}$/i);
    });
  });

  describe("getEscrow", function () {
    it("returns zero struct for non-existent orderId", async function () {
      const { escrow } = await deploy();
      const ghost = ethers.keccak256(ethers.toUtf8Bytes("ghost"));
      const e = await escrow.getEscrow(ghost);
      expect(e.buyer).to.equal(ethers.ZeroAddress);
      expect(e.farmer).to.equal(ethers.ZeroAddress);
      expect(e.amount).to.equal(0n);
      expect(e.ngnAmount).to.equal(0n);
      expect(e.status).to.equal(0);
      expect(e.createdAt).to.equal(0n);
    });

    it("returns correct struct after createEscrow", async function () {
      const { escrow } = await deploy();
      const [, , buyer, farmer] = await ethers.getSigners();
      const usdc = await ethers.getContractAt("MockUSDC", await escrow.usdc());
      await usdc.mint(buyer.address, 100n * ONE_USDC);
      await usdc.connect(buyer).approve(await escrow.getAddress(), 100n * ONE_USDC);
      const id = await escrow.computeOrderId("test", "prod");
      await escrow.connect(buyer).createEscrow(id, farmer.address, 50n * ONE_USDC, 75000n);
      const e = await escrow.getEscrow(id);
      expect(e.buyer).to.equal(buyer.address);
      expect(e.farmer).to.equal(farmer.address);
      expect(e.amount).to.equal(50n * ONE_USDC);
      expect(e.ngnAmount).to.equal(75000n);
      expect(e.status).to.equal(0); // LOCKED
    });
  });
});
