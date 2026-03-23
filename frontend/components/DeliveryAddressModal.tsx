"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, User, ChevronDown, Plus, CheckCircle2, Loader2, Globe } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DeliveryAddress } from "@/lib/types";

interface Country { name: string; code: string; }
interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  prefill?: { fullName?: string; phone?: string; country?: string };
  onConfirm: (address: DeliveryAddress) => void;
}

const EMPTY_FORM = { fullName: "", phone: "", addressLine: "", streetLine2: "", landmark: "", city: "", state: "", country: "Nigeria", countryCode: "NG", isDefault: false };

export function DeliveryAddressModal({ isOpen, onClose, userId, prefill, onConfirm }: Props) {
  const [saved, setSaved] = useState<DeliveryAddress[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);

  // Load countries once
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,cca2")
      .then((r) => r.json())
      .then((data: any[]) => {
        const sorted = data
          .map((c) => ({ name: c.name.common, code: c.cca2 }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(sorted);
      })
      .catch(() => setCountries([{ name: "Nigeria", code: "NG" }]));
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (!form.country) return;
    setLoadingStates(true);
    setStates([]);
    setForm((f) => ({ ...f, state: "" }));
    fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: form.country }),
    })
      .then((r) => r.json())
      .then((data) => {
        const list: string[] = data?.data?.states?.map((s: any) => s.name) ?? [];
        setStates(list.sort());
      })
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, [form.country]);

  // Load saved addresses + pre-fill form from user profile
  useEffect(() => {
    if (!isOpen) return;
    setLoadingAddresses(true);
    fetch(`/api/delivery-addresses?userId=${userId}`)
      .then((r) => r.json())
      .then((data: DeliveryAddress[]) => {
        setSaved(data);
        const def = data.find((a) => a.isDefault) ?? data[0];
        if (def) { setSelected(def.id); setShowForm(false); }
        else {
          setShowForm(true);
          setForm((f) => ({
            ...f,
            fullName: prefill?.fullName || f.fullName,
            phone: prefill?.phone || f.phone,
            country: prefill?.country || f.country,
          }));
        }
      })
      .finally(() => setLoadingAddresses(false));
  }, [isOpen, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof typeof form, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.addressLine.trim()) e.addressLine = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state) e.state = "Required";
    if (!form.country) e.country = "Required";
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

  const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C] focus:ring-offset-2 disabled:opacity-50 placeholder:text-muted-foreground";
  const selectCls = `${inputCls} appearance-none`;

  const Field = ({ id, label, placeholder, type = "text", optional = false }: { id: keyof typeof form; label: string; placeholder: string; type?: string; optional?: boolean }) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {optional && <span className="text-muted-foreground font-normal">(optional)</span>}
        {!optional && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <input id={id} type={type} value={form[id] as string} onChange={(e) => set(id, e.target.value)} placeholder={placeholder} disabled={saving} className={inputCls} />
      {errors[id] && <p className="text-xs text-red-500">{errors[id]}</p>}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} title="Delivery Address">
      <div className="space-y-4">
        <div className="flex gap-2 p-3 rounded-lg bg-[#118C4C]/5 border border-[#118C4C]/20 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-[#118C4C] flex-shrink-0 mt-0.5" />
          <p>Where should we deliver your order? This will be shared with the farmer.</p>
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
            {/* Saved addresses list */}
            {saved.length > 0 && !showForm && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Saved addresses</p>
                <AnimatePresence>
                  {saved.map((addr) => (
                    <motion.button
                      key={addr.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelected(addr.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selected === addr.id ? "border-[#118C4C] bg-[#118C4C]/5" : "border-border hover:border-[#118C4C]/40"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-[#118C4C]" />
                            <span className="font-semibold text-sm">{addr.fullName}</span>
                            {addr.isDefault && <span className="text-xs bg-[#118C4C]/10 text-[#118C4C] px-1.5 py-0.5 rounded-full font-medium">Default</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />{addr.phone}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {addr.addressLine}{addr.streetLine2 ? `, ${addr.streetLine2}` : ""}, {addr.city}, {addr.state}, {addr.country}
                          </p>
                          {addr.landmark && <p className="text-xs text-muted-foreground italic">Near: {addr.landmark}</p>}
                        </div>
                        {selected === addr.id && <CheckCircle2 className="h-5 w-5 text-[#118C4C] flex-shrink-0" />}
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
                <button onClick={() => { setShowForm(true); setForm({ ...EMPTY_FORM, fullName: prefill?.fullName || "", phone: prefill?.phone || "", country: prefill?.country || "Nigeria" }); }} className="flex items-center gap-2 text-sm text-[#118C4C] hover:underline mt-1">
                  <Plus className="h-4 w-4" /> Add new address
                </button>
              </div>
            )}

            {/* New address form */}
            {showForm && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {saved.length > 0 && (
                  <button onClick={() => setShowForm(false)} className="text-sm text-[#118C4C] hover:underline">← Back to saved addresses</button>
                )}

                <Field id="fullName" label="Full Name" placeholder="John Doe" />
                <Field id="phone" label="Phone Number" placeholder="+234 801 234 5678" type="tel" />

                {/* Country */}
                <div className="space-y-1">
                  <Label htmlFor="country" className="text-sm font-medium">Country <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <select
                      id="country"
                      value={form.country}
                      onChange={(e) => {
                        const selected = countries.find((c) => c.name === e.target.value);
                        setForm((f) => ({ ...f, country: e.target.value, countryCode: selected?.code || "", state: "" }));
                      }}
                      disabled={saving || countries.length === 0}
                      className={`${selectCls} pl-9`}
                    >
                      <option value="">Select country</option>
                      {countries.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
                </div>

                <Field id="addressLine" label="Street Address" placeholder="12 Farm Road" />
                <Field id="streetLine2" label="Apartment / Suite / Floor" placeholder="Flat 3B, Block A" optional />
                <Field id="landmark" label="Landmark" placeholder="Near Shoprite, opposite Total filling station" optional />

                <div className="grid grid-cols-2 gap-3">
                  <Field id="city" label="City / Town" placeholder="Lagos" />
                  {/* State */}
                  <div className="space-y-1">
                    <Label htmlFor="state" className="text-sm font-medium">State / Region <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      {loadingStates ? (
                        <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
                        </div>
                      ) : (
                        <>
                          <select
                            id="state"
                            value={form.state}
                            onChange={(e) => set("state", e.target.value)}
                            disabled={saving || states.length === 0}
                            className={selectCls}
                          >
                            <option value="">{states.length === 0 ? "Select country first" : "Select state"}</option>
                            {states.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </>
                      )}
                    </div>
                    {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="rounded border-input accent-[#118C4C]" />
                  Save as default address
                </label>

                <Button onClick={handleSaveNew} disabled={saving} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Address"}
                </Button>
              </motion.div>
            )}

            {!showForm && selected && (
              <Button onClick={handleConfirm} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white gap-2 mt-2" size="lg">
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
