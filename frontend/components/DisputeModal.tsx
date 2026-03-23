"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const DISPUTE_REASONS = [
  "Item not received",
  "Item received but damaged",
  "Item does not match description",
  "Wrong item delivered",
  "Partial delivery",
  "Other",
];

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onConfirm: (reason: string, details: string) => Promise<void>;
  loading: boolean;
}

export function DisputeModal({ isOpen, onClose, orderId, onConfirm, loading }: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason."); return; }
    if (details.trim().length < 20) { setError("Please provide at least 20 characters of detail."); return; }
    setError("");
    await onConfirm(reason, details);
  };

  const handleClose = () => {
    setReason("");
    setDetails("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : handleClose} title="Raise a Dispute">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">
            Raising a dispute will freeze the escrow funds. Our team will review your case and resolve it within 3–5 business days.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          Order <span className="font-mono font-medium">#{orderId.slice(-6)}</span>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="dispute-reason">Reason for dispute <span className="text-red-500">*</span></Label>
          <select
            id="dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:ring-offset-2 disabled:opacity-50"
          >
            <option value="">Select a reason...</option>
            {DISPUTE_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <Label htmlFor="dispute-details">
            Additional details <span className="text-red-500">*</span>
            <span className="text-muted-foreground font-normal ml-1">(min. 20 characters)</span>
          </Label>
          <textarea
            id="dispute-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={loading}
            rows={4}
            placeholder="Describe the issue in detail — what you ordered, what happened, and any relevant information..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:ring-offset-2 resize-none disabled:opacity-50 placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground text-right">{details.length} characters</p>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {loading ? "Submitting..." : "Submit Dispute"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
