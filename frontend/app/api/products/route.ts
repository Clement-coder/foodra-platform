
import { NextResponse } from "next/server";
import { sampleProducts } from "@/lib/sampleData";
import { Product } from "@/lib/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  let products: Product[] = sampleProducts;

  if (userId) {
    products = products.filter((p) => p.farmerId === userId);
  }

  return NextResponse.json(products);
}