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
    const provider = new ethers.BrowserProvider(await wallet.getEthereumProvider());
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
      const { escrow, usdc } = await getSignerAndContracts();
      const { usdcAmount, rate } = await ngnToUsdc(totalNgn);

      // Approve total USDC for escrow contract
      const approveTx = await usdc.approve(ESCROW_ADDRESS, usdcAmount);
      await approveTx.wait();

      const results: { productId: string; orderId: string; txHash: string; usdcAmount: bigint; rate: number }[] = [];

      // Create one escrow per unique farmer
      const farmerGroups = items.reduce((acc, item) => {
        if (!acc[item.farmerWallet]) acc[item.farmerWallet] = [];
        acc[item.farmerWallet].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      for (const [farmerWallet, farmerItems] of Object.entries(farmerGroups)) {
        const farmerNgn = farmerItems.reduce((s, i) => s + i.pricePerUnit * i.quantity, 0);
        const { usdcAmount: farmerUsdc } = await ngnToUsdc(farmerNgn);
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
