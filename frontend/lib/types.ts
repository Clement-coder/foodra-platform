// Core TypeScript interfaces and types for the Foodra app



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
}

export interface OrderItem {
  productId: string
  productName: string
  pricePerUnit: number
  quantity: number
  image: string
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  wallet: string
  createdAt: string
  location?: string
}


