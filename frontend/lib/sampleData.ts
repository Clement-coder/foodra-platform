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
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Healthy_Red_Tomatoes_are_Wet_and_Organic.png",
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
