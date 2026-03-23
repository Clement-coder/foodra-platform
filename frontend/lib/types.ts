export interface User {
  id: string
  name: string
  email: string
  avatar: string
  wallet: string
  createdAt: string
  phone?: string
  location?: string
  role?: "farmer" | "buyer" | "admin"
  linked_accounts?: Array<{ type: string }>
}

export interface Product {
  id: string
  productName: string
  category: string
  quantity: number
  pricePerUnit: number
  description: string
  image: string
  location: string
  farmerId: string
  farmerName: string
  farmerAvatar: string
  createdAt: string
}

export interface Training {
  id: string
  title: string
  summary: string
  description: string
  date: string
  mode: "online" | "offline"
  location?: string
  instructor: string
  capacity: number
  enrolled: number
  image: string
}

export interface FundingApplication {
  id: string
  userId: string
  fullName: string
  phoneNumber: string
  location: string
  farmSize: number
  farmType: string
  yearsOfExperience: number
  amountRequested: number
  expectedOutcome: string
  status: "Pending" | "Approved" | "Rejected"
  submittedAt: string
}

export interface Enrollment {
  id: string
  userId: string
  trainingId: string
  fullName: string
  phoneNumber: string
  location: string
  enrolledAt: string
}

export interface CartItem {
  productId: string
  productName: string
  pricePerUnit: number
  quantity: number
  image: string
  farmerWallet?: string
}

export interface DeliveryAddress {
  id: string
  userId: string
  fullName: string
  phone: string
  addressLine: string
  streetLine2?: string
  landmark?: string
  city: string
  state: string
  country: string
  countryCode: string
  isDefault: boolean
  createdAt: string
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
  createdAt: string
  updatedAt: string
  escrowTxHash?: string
  escrowStatus?: "none" | "locked" | "released" | "refunded" | "disputed"
  usdcAmount?: number
  // Buyer info (visible to farmer)
  buyerName?: string
  buyerPhone?: string
  buyerEmail?: string
  // Delivery address snapshot
  deliveryFullName?: string
  deliveryPhone?: string
  deliveryAddress?: string
  deliveryStreet2?: string
  deliveryLandmark?: string
  deliveryCity?: string
  deliveryState?: string
  deliveryCountry?: string
}

export interface OrderItem {
  productId: string
  productName: string
  pricePerUnit: number
  quantity: number
  image: string
  escrowOrderId?: string
  farmerWallet?: string
  escrowStatus?: "none" | "locked" | "released" | "refunded" | "disputed"
}
