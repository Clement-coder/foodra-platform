"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWallets } from "@privy-io/react-auth";
import {
  ESCROW_ADDRESS,
  ESCROW_ABI,
  USDC_ABI,
  USDC_ADDRESS,
  ngnToUsdc,
} from "./escrow";
import type { CartItem } from "./types";

export function useEscrow() {
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSignerAndContracts = async () => {
    const wallet = wallets[0];
    if (!wallet) throw new Error("No wallet connected");
    if (!ESCROW_ADDRESS) throw new Error("Escrow contract address not configured");
    if (!USDC_ADDRESS) throw new Error("USDC contract address not configured");

    // Force switch to the correct chain (Base Sepolia = 84532)
    const requiredChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 84532);
    await wallet.switchChain(requiredChainId);

    const provider = new ethers.BrowserProvider(await wallet.getEthereumProvider());
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== requiredChainId) {
      throw new Error(`Wrong network. Please switch to Base Sepolia (chain ${requiredChainId}).`);
    }

    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
    return { signer, escrow, usdc };
  };

  /**
   * Called at checkout — approves USDC and creates escrow per farmer
   * Returns array of { orderId, txHash } for saving to Supabase
   */
  const createEscrows = async (
    supabaseOrderId: string,
    items: (CartItem & { farmerWallet: string })[],
    totalNgn: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { escrow, usdc, signer } = await getSignerAndContracts();
      const signerAddress = await signer.getAddress();
      const { usdcAmount, rate } = await ngnToUsdc(totalNgn);

      // Auto-mint MockUSDC if balance is insufficient (testnet only)
      const balance: bigint = await usdc.balanceOf(signerAddress);
      if (balance < usdcAmount) {
        const mintTx = await usdc.mint(signerAddress, usdcAmount * BigInt(10)); // mint 10x for buffer
        await mintTx.wait();
      }

      // Skip approve if allowance is already sufficient
      const existing: bigint = await usdc.allowance(signerAddress, ESCROW_ADDRESS);
      if (existing < usdcAmount) {
        const approveTx = await usdc.approve(ESCROW_ADDRESS, usdcAmount);
        await approveTx.wait();
      }

      const results: { productId: string; orderId: string; txHash: string; usdcAmount: bigint; rate: number }[] = [];

      // Create one escrow per unique farmer
      const farmerGroups = items.reduce((acc, item) => {
        if (!acc[item.farmerWallet]) acc[item.farmerWallet] = [];
        acc[item.farmerWallet].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      for (const [farmerWallet, farmerItems] of Object.entries(farmerGroups)) {
        const farmerNgn = farmerItems.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
        // Use same rate to avoid approval mismatch
        const farmerUsdc = BigInt(Math.round((farmerNgn / rate) * 1_000_000));
        const productId = farmerItems[0].productId;

        const orderIdBytes = await escrow.computeOrderId(supabaseOrderId, productId);

        const tx = await escrow.createEscrow(
          orderIdBytes,
          farmerWallet,
          farmerUsdc,
          BigInt(Math.round(farmerNgn))
        );
        const receipt = await tx.wait();

        results.push({
          productId,
          orderId: orderIdBytes,
          txHash: receipt.hash,
          usdcAmount: farmerUsdc,
          rate,
        });
      }

      return results;
    } catch (err: any) {
      const msg = err?.reason || err?.message || "Transaction failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async (escrowOrderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { escrow } = await getSignerAndContracts();
      // Verify escrow exists and is locked before sending tx
      const escrowData = await escrow.getEscrow(escrowOrderId);
      if (!escrowData || escrowData.buyer === "0x0000000000000000000000000000000000000000") {
        throw new Error("Escrow not found on-chain. The order ID may be incorrect.");
      }
      if (escrowData.status !== BigInt(0)) { // 0 = LOCKED
        throw new Error(`Escrow is not in LOCKED state (current status: ${["LOCKED","RELEASED","REFUNDED","DISPUTED"][Number(escrowData.status)] ?? escrowData.status})`);
      }
      const tx = await escrow.confirmDelivery(escrowOrderId);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError(err?.reason || err?.message || "Failed to confirm delivery");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const raiseDispute = async (escrowOrderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { escrow } = await getSignerAndContracts();
      const tx = await escrow.raiseDispute(escrowOrderId);
      await tx.wait();
      return true;
    } catch (err: any) {
      setError(err?.reason || err?.message || "Failed to raise dispute");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createEscrows, confirmDelivery, raiseDispute, loading, error };
}
