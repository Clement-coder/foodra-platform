export interface User {
  id: string
  name: string
  email: string
  avatar: string
  wallet: string
  createdAt: string
  phone?: string
  location?: string
  role?: "buyer" | "admin" | "owner"
  isVerified?: boolean
  linked_accounts?: Array<{ type: string }>
  termsAcceptedAt?: string | null
}

export interface Product {
  id: string
  productName: string
  category: string
  quantity: number
  unit: string
  pricePerUnit: number
  description: string
  image: string
  location: string
  farmerId: string
  farmerName: string
  farmerAvatar: string
  farmerIsVerified?: boolean
  viewCount?: number
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
  price?: number | null
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
  farmers?: Array<{ id: string; name: string; email: string; phone: string; avatar: string; location: string }>
  buyerName?: string
  buyerPhone?: string
  buyerEmail?: string
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
}
