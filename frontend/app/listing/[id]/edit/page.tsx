"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { authFetch } from "@/lib/authFetch";
import withAuth from "@/components/withAuth";
import { CustomSelect } from "@/components/CustomSelect";

const CATEGORIES = [
  "Vegetables", "Fruits", "Grains", "Tubers",
  "Legumes", "Poultry", "Livestock", "Seafood", "Spices", "Others",
];
const UNITS = ["kg", "g", "lb", "ton", "bag", "crate", "dozen", "piece", "litre", "unit"];
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

const schema = z.object({
  productName: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().positive("Must be positive"),
  unit: z.string().min(1, "Unit is required"),
  pricePerUnit: z.coerce.number().positive("Must be positive"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
});

type FormData = z.infer<typeof schema>;
const inputClass = "w-full h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40";

function EditListingPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { getAccessToken } = usePrivy();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "", unit: "", location: "" },
  });

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(p => {
        reset({
          productName: p.productName,
          category: p.category,
          quantity: p.quantity,
          unit: p.unit,
          pricePerUnit: p.pricePerUnit,
          description: p.description,
          location: p.location,
        });
        if (p.image) setImagePreview(p.image);
      })
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoadingProduct(false));
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (imageBase64) {
        const uploadRes = await authFetch(getAccessToken, "/api/storage/product-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: imageBase64, fileName: imageName }),
        });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const { imageUrl: url } = await uploadRes.json();
        imageUrl = url;
      }

      const res = await authFetch(getAccessToken, `/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...(imageUrl ? { image: imageUrl } : {}) }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update product");
      }

      toast.success("Product updated!");
      router.push(`/marketplace/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProduct) return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-4 animate-pulse">
        {[...Array(6)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-muted" />)}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-1">Edit Product</h1>
      <p className="text-muted-foreground text-sm mb-8">Update your product listing</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Product Image</label>
          {imagePreview ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => { setImagePreview(null); setImageBase64(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#118C4C]/40 rounded-xl cursor-pointer hover:bg-[#118C4C]/5 transition-colors">
              <Upload className="h-8 w-8 text-[#118C4C]/60 mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload new image</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input {...register("productName")} className={inputClass} />
          {errors.productName && <p className="text-xs text-red-500 mt-1">{errors.productName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Controller name="category" control={control} render={({ field }) => (
            <CustomSelect value={field.value} onChange={field.onChange}
              options={[{ value: "", label: "Select category" }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} />
          )} />
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input {...register("quantity")} type="number" min="0" step="any" className={inputClass} />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <Controller name="unit" control={control} render={({ field }) => (
              <CustomSelect value={field.value} onChange={field.onChange}
                options={[{ value: "", label: "Select unit" }, ...UNITS.map(u => ({ value: u, label: u }))]} />
            )} />
            {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price per Unit (₦)</label>
          <input {...register("pricePerUnit")} type="number" min="0" step="any" className={inputClass} />
          {errors.pricePerUnit && <p className="text-xs text-red-500 mt-1">{errors.pricePerUnit.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location (State)</label>
          <Controller name="location" control={control} render={({ field }) => (
            <CustomSelect value={field.value} onChange={field.onChange}
              options={[{ value: "", label: "Select state" }, ...NIGERIAN_STATES.map(s => ({ value: s, label: s }))]} />
          )} />
          {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea {...register("description")} rows={4}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40 resize-none" />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        <Button type="submit" disabled={submitting} className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white shadow-lg shadow-[#118C4C]/20">
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}

export default withAuth(EditListingPage);
