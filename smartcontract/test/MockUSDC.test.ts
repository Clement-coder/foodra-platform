import { expect } from "chai";
import { ethers } from "hardhat";

const ONE_USDC = 1_000_000n;

describe("MockUSDC", function () {
  async function deploy() {
    const [owner, alice, bob, spender] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    return { usdc, owner, alice, bob, spender };
  }

  describe("metadata", function () {
    it("has correct name, symbol, decimals", async function () {
      const { usdc } = await deploy();
      expect(await usdc.name()).to.equal("USD Coin");
      expect(await usdc.symbol()).to.equal("USDC");
      expect(await usdc.decimals()).to.equal(6);
    });
  });

  describe("mint", function () {
    it("increases recipient balance and emits Transfer from zero", async function () {
      const { usdc, alice } = await deploy();
      await expect(usdc.mint(alice.address, 500n * ONE_USDC))
        .to.emit(usdc, "Transfer")
        .withArgs(ethers.ZeroAddress, alice.address, 500n * ONE_USDC);
      expect(await usdc.balanceOf(alice.address)).to.equal(500n * ONE_USDC);
    });

    it("anyone can mint (test token — no access control)", async function () {
      const { usdc, alice, bob } = await deploy();
      await usdc.connect(alice).mint(bob.address, ONE_USDC);
      expect(await usdc.balanceOf(bob.address)).to.equal(ONE_USDC);
    });

    it("minting to zero address still works (mock has no guard)", async function () {
      const { usdc } = await deploy();
      // Just verify it doesn't revert — mock has no zero-address guard
      await usdc.mint(ethers.ZeroAddress, ONE_USDC);
    });
  });

  describe("approve", function () {
    it("sets allowance and emits Approval", async function () {
      const { usdc, alice, spender } = await deploy();
      await expect(usdc.connect(alice).approve(spender.address, 200n * ONE_USDC))
        .to.emit(usdc, "Approval")
        .withArgs(alice.address, spender.address, 200n * ONE_USDC);
      expect(await usdc.allowance(alice.address, spender.address)).to.equal(200n * ONE_USDC);
    });

    it("overwriting allowance replaces old value", async function () {
      const { usdc, alice, spender } = await deploy();
      await usdc.connect(alice).approve(spender.address, 100n * ONE_USDC);
      await usdc.connect(alice).approve(spender.address, 50n * ONE_USDC);
      expect(await usdc.allowance(alice.address, spender.address)).to.equal(50n * ONE_USDC);
    });

    it("approve to zero resets allowance", async function () {
      const { usdc, alice, spender } = await deploy();
      await usdc.connect(alice).approve(spender.address, 100n * ONE_USDC);
      await usdc.connect(alice).approve(spender.address, 0n);
      expect(await usdc.allowance(alice.address, spender.address)).to.equal(0n);
    });
  });

  describe("transfer", function () {
    it("moves tokens and emits Transfer", async function () {
      const { usdc, alice, bob } = await deploy();
      await usdc.mint(alice.address, 100n * ONE_USDC);
      await expect(usdc.connect(alice).transfer(bob.address, 40n * ONE_USDC))
        .to.emit(usdc, "Transfer")
        .withArgs(alice.address, bob.address, 40n * ONE_USDC);
      expect(await usdc.balanceOf(alice.address)).to.equal(60n * ONE_USDC);
      expect(await usdc.balanceOf(bob.address)).to.equal(40n * ONE_USDC);
    });

    it("reverts on insufficient balance", async function () {
      const { usdc, alice, bob } = await deploy();
      await usdc.mint(alice.address, 10n * ONE_USDC);
      await expect(usdc.connect(alice).transfer(bob.address, 11n * ONE_USDC))
        .to.be.revertedWith("insufficient balance");
    });

    it("transfer of zero succeeds", async function () {
      const { usdc, alice, bob } = await deploy();
      await usdc.mint(alice.address, ONE_USDC);
      await expect(usdc.connect(alice).transfer(bob.address, 0n)).to.not.be.reverted;
    });

    it("transfer full balance leaves sender at zero", async function () {
      const { usdc, alice, bob } = await deploy();
      await usdc.mint(alice.address, 50n * ONE_USDC);
      await usdc.connect(alice).transfer(bob.address, 50n * ONE_USDC);
      expect(await usdc.balanceOf(alice.address)).to.equal(0n);
    });
  });

  describe("transferFrom", function () {
    it("moves tokens and decrements allowance", async function () {
      const { usdc, alice, bob, spender } = await deploy();
      await usdc.mint(alice.address, 100n * ONE_USDC);
      await usdc.connect(alice).approve(spender.address, 60n * ONE_USDC);
      await usdc.connect(spender).transferFrom(alice.address, bob.address, 40n * ONE_USDC);
      expect(await usdc.balanceOf(bob.address)).to.equal(40n * ONE_USDC);
      expect(await usdc.allowance(alice.address, spender.address)).to.equal(20n * ONE_USDC);
    });

    it("reverts on insufficient balance", async function () {
      const { usdc, alice, bob, spender } = await deploy();
      await usdc.mint(alice.address, 5n * ONE_USDC);
      await usdc.connect(alice).approve(spender.address, 100n * ONE_USDC);
      await expect(usdc.connect(spender).transferFrom(alice.address, bob.address, 10n * ONE_USDC))
        .to.be.revertedWith("insufficient balance");
    });

    it("reverts on insufficient allowance", async function () {
      const { usdc, alice, bob, spender } = await deploy();
      await usdc.mint(alice.address, 100n * ONE_USDC);
      await usdc.connect(alice).approve(spender.address, 5n * ONE_USDC);
      await expect(usdc.connect(spender).transferFrom(alice.address, bob.address, 10n * ONE_USDC))
        .to.be.revertedWith("insufficient allowance");
    });

    it("reverts with zero allowance", async function () {
      const { usdc, alice, bob, spender } = await deploy();
      await usdc.mint(alice.address, 100n * ONE_USDC);
      await expect(usdc.connect(spender).transferFrom(alice.address, bob.address, ONE_USDC))
        .to.be.revertedWith("insufficient allowance");
    });
  });
});
