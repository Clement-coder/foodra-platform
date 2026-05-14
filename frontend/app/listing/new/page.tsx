"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/toast";
import { authFetch } from "@/lib/authFetch";
import withAuth from "@/components/withAuth";

const CATEGORIES = [
  "Vegetables", "Fruits", "Grains", "Tubers",
  "Legumes", "Poultry", "Livestock", "Seafood", "Spices", "Others",
];

const UNITS = ["kg", "g", "lb", "ton", "bag", "crate", "dozen", "piece", "litre", "unit"];

const schema = z.object({
  productName: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().positive("Must be positive"),
  unit: z.string().min(1, "Unit is required"),
  pricePerUnit: z.coerce.number().positive("Must be positive"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
});

type FormData = z.infer<typeof schema>;

function NewListingPage() {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

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
      let imageUrl = "";
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

      const res = await authFetch(getAccessToken, "/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, image: imageUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to list product");
      }

      const product = await res.json();
      toast.success("Product listed successfully!");
      router.push(`/marketplace/${product.id}`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h1 className="text-2xl font-bold text-foreground mb-1">List a Product</h1>
      <p className="text-muted-foreground text-sm mb-8">Add your farm produce to the marketplace</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Product Image</label>
          {imagePreview ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setImageBase64(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#118C4C]/40 rounded-xl cursor-pointer hover:bg-[#118C4C]/5 transition-colors">
              <Upload className="h-8 w-8 text-[#118C4C]/60 mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload image</span>
              <span className="text-xs text-muted-foreground mt-1">JPEG, PNG, WEBP · max 5MB</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input {...register("productName")} placeholder="e.g. Fresh Tomatoes" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40" />
          {errors.productName && <p className="text-xs text-red-500 mt-1">{errors.productName.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            {...register("category")}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40"
          >
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
        </div>

        {/* Quantity + Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input {...register("quantity")} type="number" min="0" step="any" placeholder="e.g. 50" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40" />
            {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unit</label>
            <select
              {...register("unit")}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40"
            >
              <option value="">Select unit</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>}
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-1">Price per Unit (₦)</label>
          <input {...register("pricePerUnit")} type="number" min="0" step="any" placeholder="e.g. 500" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40" />
          {errors.pricePerUnit && <p className="text-xs text-red-500 mt-1">{errors.pricePerUnit.message}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input {...register("location")} placeholder="e.g. Lagos, Nigeria" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40" />
          {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="Describe your product — freshness, harvest date, farming method..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C4C]/40 resize-none"
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#118C4C] hover:bg-[#0d6d3a] text-white shadow-lg shadow-[#118C4C]/20"
        >
          {submitting ? "Listing..." : "List Product"}
        </Button>
      </form>
    </div>
  );
}

export default withAuth(NewListingPage);
