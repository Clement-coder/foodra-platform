import type { Product, Training, User, Order } from "./types"

// Demo user object
export const demoUser: User = {
  id: "demo-1",
  name: "Demo User",
  phone: "+2348012345678",
  location: "Lagos",
  avatar: "/farmer-avatar.png",
  role: "farmer",
}

// Sample products for marketplace
export const sampleProducts: Product[] = [
  {
    id: "prod-1",
    productName: "Fresh Tomatoes",
    category: "Vegetables",
    quantity: 500,
    pricePerUnit: 250,
    description: "Organic fresh tomatoes grown without pesticides. Perfect for cooking and salads.",
    image: "data:image/jpeg;base64,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",
    location: "Lagos",
    farmerId: "farmer-1",
    farmerName: "John Okafor",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    productName: "Organic Rice",
    category: "Grains",
    quantity: 1000,
    pricePerUnit: 450,
    description: "Premium quality locally grown organic rice. Rich in nutrients and delicious.",
    image: "https://picsum.photos/seed/rice/800/600",
    location: "Kano",
    farmerId: "farmer-2",
    farmerName: "Aisha Mohammed",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    productName: "Fresh Chicken Eggs",
    category: "Poultry",
    quantity: 300,
    pricePerUnit: 80,
    description: "Farm-fresh eggs from free-range chickens. High protein and natural.",
    image: "https://picsum.photos/seed/eggs/800/600",
    location: "Ogun",
    farmerId: "farmer-3",
    farmerName: "Chioma Nwankwo",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    productName: "Sweet Corn",
    category: "Vegetables",
    quantity: 200,
    pricePerUnit: 150,
    description: "Sweet and tender corn freshly harvested. Great for grilling or boiling.",
    image: "https://picsum.photos/seed/corn/800/600",
    location: "Plateau",
    farmerId: "farmer-4",
    farmerName: "Ibrahim Yusuf",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    productName: "Fresh Yam Tubers",
    category: "Tubers",
    quantity: 400,
    pricePerUnit: 350,
    description: "Quality yam tubers perfect for pounding or frying. Freshly harvested.",
    image: "https://picsum.photos/seed/yam/800/600",
    location: "Benue",
    farmerId: "farmer-5",
    farmerName: "Grace Adeyemi",
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-6",
    productName: "Honey",
    category: "Others",
    quantity: 50,
    pricePerUnit: 2500,
    description: "Pure natural honey harvested from local beehives. Rich in antioxidants.",
    image: "https://picsum.photos/seed/honey/800/600",
    location: "Ekiti",
    farmerId: "farmer-6",
    farmerName: "Samuel Ojo",
    createdAt: new Date().toISOString(),
  },
]

// Sample training programs
export const sampleTraining: Training[] = [
  {
    id: "train-1",
    title: "Modern Farming Techniques",
    summary: "Learn the latest farming methods to increase your yield",
    description:
      "This comprehensive training covers modern farming techniques including precision agriculture, soil management, and pest control. Perfect for both new and experienced farmers looking to improve their productivity.",
    date: "2025-01-15T10:00:00",
    mode: "online",
    instructor: "Dr. Adewale Ogunleye",
    capacity: 100,
    enrolled: 45,
    image: "https://picsum.photos/seed/modern-farming/800/600",
  },
  {
    id: "train-2",
    title: "Organic Farming Practices",
    summary: "Sustainable agriculture without harmful chemicals",
    description:
      "Discover how to grow healthy crops using organic methods. Learn about composting, natural pest control, and soil enrichment techniques that are better for the environment and your customers.",
    date: "2025-01-20T14:00:00",
    mode: "offline",
    location: "Lagos Agricultural Center",
    instructor: "Mrs. Blessing Okonkwo",
    capacity: 50,
    enrolled: 32,
    image: "https://picsum.photos/seed/organic-farming/800/600",
  },
  {
    id: "train-3",
    title: "Financial Management for Farmers",
    summary: "Manage your farm finances effectively",
    description:
      "Learn essential financial skills including budgeting, record-keeping, and accessing funding opportunities. This training will help you make your farm more profitable and sustainable.",
    date: "2025-01-25T09:00:00",
    mode: "online",
    instructor: "Mr. Emeka Nnamdi",
    capacity: 75,
    enrolled: 28,
    image: "https://picsum.photos/seed/financial-planning/800/600",
  },
  {
    id: "train-4",
    title: "Poultry Farming Essentials",
    summary: "Start and manage a successful poultry business",
    description:
      "Everything you need to know about raising chickens for eggs and meat. Covers housing, feeding, disease prevention, and marketing your poultry products.",
    date: "2025-02-01T11:00:00",
    mode: "offline",
    location: "Ibadan Training Center",
    instructor: "Dr. Funke Adesina",
    capacity: 40,
    enrolled: 35,
    image: "https://picsum.photos/seed/poultry/800/600",
  },
]

// Sample orders
export const sampleOrders: Order[] = [
  {
    id: "order-1",
    userId: "demo-1",
    items: [
      { productId: "prod-1", productName: "Fresh Tomatoes", pricePerUnit: 250, quantity: 2, image: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Healthy_Red_Tomatoes_are_Wet_and_Organic.png" },
      { productId: "prod-3", productName: "Fresh Chicken Eggs", pricePerUnit: 80, quantity: 12, image: "https://picsum.photos/seed/eggs/800/600" },
    ],
    totalAmount: 1460,
    status: "Delivered",
    createdAt: "2025-11-20T10:00:00Z",
    updatedAt: "2025-11-22T12:00:00Z",
  },
  {
    id: "order-2",
    userId: "demo-1",
    items: [
      { productId: "prod-2", productName: "Organic Rice", pricePerUnit: 450, quantity: 5, image: "https://picsum.photos/seed/rice/800/600" },
    ],
    totalAmount: 2250,
    status: "Shipped",
    createdAt: "2025-12-01T14:30:00Z",
    updatedAt: "2025-12-02T09:00:00Z",
  },
  {
    id: "order-3",
    userId: "demo-1",
    items: [
      { productId: "prod-5", productName: "Fresh Yam Tubers", pricePerUnit: 350, quantity: 10, image: "https://picsum.photos/seed/yam/800/600" },
      { productId: "prod-6", productName: "Honey", pricePerUnit: 2500, quantity: 1, image: "https://picsum.photos/seed/honey/800/600" },
    ],
    totalAmount: 6000,
    status: "Processing",
    createdAt: "2025-12-10T11:00:00Z",
    updatedAt: "2025-12-10T11:00:00Z",
  },
]


// Initialize localStorage with sample data if not present
export function initializeSampleData() {
  if (typeof window === "undefined") return

  const productsKey = "foodra_products"
  const trainingKey = "foodra_training"
  const applicationsKey = "foodra_applications"
  const enrollmentsKey = "foodra_enrollments"
  const cartKey = "foodra_cart"
  const ordersKey = "foodra_orders"

  // Check and seed products
  if (!localStorage.getItem(productsKey)) {
    localStorage.setItem(productsKey, JSON.stringify(sampleProducts))
  }

  // Check and seed training
  if (!localStorage.getItem(trainingKey)) {
    localStorage.setItem(trainingKey, JSON.stringify(sampleTraining))
  }

  // Check and seed orders
  if (!localStorage.getItem(ordersKey)) {
    localStorage.setItem(ordersKey, JSON.stringify(sampleOrders))
  }

  // Initialize empty arrays for applications, enrollments, and cart if not present
  if (!localStorage.getItem(applicationsKey)) {
    localStorage.setItem(applicationsKey, JSON.stringify([]))
  }

  if (!localStorage.getItem(enrollmentsKey)) {
    localStorage.setItem(enrollmentsKey, JSON.stringify([]))
  }

  if (!localStorage.getItem(cartKey)) {
    localStorage.setItem(cartKey, JSON.stringify([]))
  }
}
