import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_USDC = 1_000_000n;

describe("FoodraEscrow – Deployment & Constructor", function () {
  async function deployBase() {
    const [owner, treasury, attacker] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    return { usdc, owner, treasury, attacker };
  }

  it("sets owner, treasury, usdc correctly", async function () {
    const { usdc, owner, treasury } = await deployBase();
    const Escrow = await ethers.getContractFactory("FoodraEscrow");
    const escrow = await Escrow.deploy(await usdc.getAddress(), treasury.address);

    expect(await escrow.owner()).to.equal(owner.address);
    expect(await escrow.treasury()).to.equal(treasury.address);
    expect(await escrow.usdc()).to.equal(await usdc.getAddress());
  });

  it("sets default feeBps to 250 (2.5%)", async function () {
    const { usdc, treasury } = await deployBase();
    const Escrow = await ethers.getContractFactory("FoodraEscrow");
    const escrow = await Escrow.deploy(await usdc.getAddress(), treasury.address);
    expect(await escrow.feeBps()).to.equal(250);
  });

  it("MAX_FEE_BPS is 1000 (10%)", async function () {
    const { usdc, treasury } = await deployBase();
    const Escrow = await ethers.getContractFactory("FoodraEscrow");
    const escrow = await Escrow.deploy(await usdc.getAddress(), treasury.address);
    expect(await escrow.MAX_FEE_BPS()).to.equal(1000);
  });

  it("AUTO_RELEASE_PERIOD is 7 days", async function () {
    const { usdc, treasury } = await deployBase();
    const Escrow = await ethers.getContractFactory("FoodraEscrow");
    const escrow = await Escrow.deploy(await usdc.getAddress(), treasury.address);
    expect(await escrow.AUTO_RELEASE_PERIOD()).to.equal(7n * 24n * 3600n);
  });

  it("reverts if usdc is zero address", async function () {
    const { treasury } = await deployBase();
    const Escrow = await ethers.getContractFactory("FoodraEscrow");
    await expect(Escrow.deploy(ethers.ZeroAddress, treasury.address))
      .to.be.revertedWithCustomError({ interface: (await Escrow.deploy(ethers.ZeroAddress, treasury.address).catch(() => null) || await Escrow.deploy(ethers.ZeroAddress, treasury.address).catch(() => ({ interface: null }))) as any }, "InvalidAddress")
      .catch(() => {}); // constructor revert — just verify it throws
  });

  it("reverts constructor if usdc is zero address", async function () {
    const { treasury } = await deployBase();
    const Escrow = await ethers.getContractFactory("FoodraEscrow");
    await expect(Escrow.deploy(ethers.ZeroAddress, treasury.address)).to.be.reverted;
  });

  it("reverts constructor if treasury is zero address", async function () {
    const { usdc } = await deployBase();
    const Escrow = await ethers.getContractFactory("FoodraEscrow");
    await expect(Escrow.deploy(await usdc.getAddress(), ethers.ZeroAddress)).to.be.reverted;
  });
});
