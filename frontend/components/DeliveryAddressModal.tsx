"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, User, ChevronDown, Plus, CheckCircle2, Loader2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DeliveryAddress } from "@/lib/types";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onConfirm: (address: DeliveryAddress) => void;
}

export function DeliveryAddressModal({ isOpen, onClose, userId, onConfirm }: Props) {
  const [saved, setSaved] = useState<DeliveryAddress[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", addressLine: "", city: "", state: "", isDefault: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setLoadingAddresses(true);
    fetch(`/api/delivery-addresses?userId=${userId}`)
      .then((r) => r.json())
      .then((data: DeliveryAddress[]) => {
        setSaved(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        if (def) { setSelected(def.id); setShowForm(false); }
        else setShowForm(true);
      })
      .finally(() => setLoadingAddresses(false));
  }, [isOpen, userId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!/^[0-9]{10,11}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Enter a valid Nigerian phone number";
    if (!form.addressLine.trim()) e.addressLine = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state) e.state = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveNew = async () => {
    if (!validate()) return;
    setSaving(true);
    const res = await fetch("/api/delivery-addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...form }),
    });
    const newAddr: DeliveryAddress = await res.json();
    setSaved((prev) => [newAddr, ...prev]);
    setSelected(newAddr.id);
    setShowForm(false);
    setSaving(false);
  };

  const handleConfirm = () => {
    const addr = saved.find((a) => a.id === selected);
    if (addr) onConfirm(addr);
  };

  const field = (key: keyof typeof form, label: string, placeholder: string, type = "text") => (
    <div className="space-y-1">
      <Label htmlFor={key} className="text-sm font-medium">{label}</Label>
      <input
        id={key}
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        disabled={saving}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:ring-offset-2 disabled:opacity-50 placeholder:text-muted-foreground"
      />
      {errors[key] && <p className="text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} title="Delivery Address">
      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex gap-2 p-3 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-[#118C4C] flex-shrink-0 mt-0.5" />
          <p>Where should we deliver your order? Your address will be shared with the farmer for delivery.</p>
        </div>

        {loadingAddresses ? (
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="relative w-10 h-10">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-full h-full">
                <div className="w-full h-full rounded-full border-4 border-transparent border-t-[#118C4C] border-r-[#118C4C]" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-[#118C4C] animate-spin" />
              </div>
            </div>
            <span className="text-sm text-muted-foreground">Loading addresses...</span>
          </div>
        ) : (
          <>
            {/* Saved addresses */}
            {saved.length > 0 && !showForm && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Saved addresses</p>
                <AnimatePresence>
                  {saved.map((addr) => (
                    <motion.button
                      key={addr.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelected(addr.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selected === addr.id
                          ? "border-[#118C4C] bg-[#118C4C]/5"
                          : "border-border hover:border-[#118C4C]/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-[#118C4C]" />
                            <span className="font-semibold text-sm">{addr.fullName}</span>
                            {addr.isDefault && (
                              <span className="text-xs bg-[#118C4C]/10 text-[#118C4C] px-1.5 py-0.5 rounded-full font-medium">Default</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {addr.phone}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {addr.addressLine}, {addr.city}, {addr.state}
                          </p>
                        </div>
                        {selected === addr.id && (
                          <CheckCircle2 className="h-5 w-5 text-[#118C4C] flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 text-sm text-[#118C4C] hover:underline mt-1"
                >
                  <Plus className="h-4 w-4" /> Add new address
                </button>
              </div>
            )}

            {/* New address form */}
            {showForm && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {saved.length > 0 && (
                  <button onClick={() => setShowForm(false)} className="text-sm text-[#118C4C] hover:underline">
                    ← Back to saved addresses
                  </button>
                )}
                {field("fullName", "Full Name", "John Doe")}
                {field("phone", "Phone Number", "08012345678", "tel")}
                {field("addressLine", "Street Address", "12 Farm Road, Ikeja")}
                <div className="grid grid-cols-2 gap-3">
                  {field("city", "City", "Lagos")}
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-sm font-medium">State</Label>
                    <div className="relative">
                      <select
                        id="state"
                        value={form.state}
                        onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                        disabled={saving}
                        className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:ring-offset-2 disabled:opacity-50"
                      >
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="rounded border-input accent-[#118C4C]"
                  />
                  Save as default address
                </label>
                <Button
                  onClick={handleSaveNew}
                  disabled={saving}
                  className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Address"}
                </Button>
              </motion.div>
            )}

            {/* Confirm button */}
            {!showForm && selected && (
              <Button
                onClick={handleConfirm}
                className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 mt-2"
                size="lg"
              >
                <CheckCircle2 className="h-4 w-4" />
                Deliver to this address
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
