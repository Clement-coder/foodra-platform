"use client";

import { Lock, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";

const config = {
  locked:   { label: "Payment Held",     icon: Lock,          className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  released: { label: "Payment Released", icon: CheckCircle,   className: "bg-green-500/10 text-green-600 border-green-500/30" },
  refunded: { label: "Refunded",         icon: RefreshCw,     className: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  disputed: { label: "Disputed",         icon: AlertTriangle, className: "bg-red-500/10 text-red-600 border-red-500/30" },
  none:     { label: "No Escrow",        icon: null,          className: "bg-muted text-muted-foreground" },
};

export function EscrowStatusBadge({ status }: { status?: string }) {
  const s = (status || "none") as keyof typeof config;
  const { label, icon: Icon, className } = config[s] ?? config.none;
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </div>
  );
}
