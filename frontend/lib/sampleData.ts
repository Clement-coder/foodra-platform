import type { Product, Training, User, Order } from "./types"
import { generateAvatarUrl } from "./avatarGenerator"

export const sampleUsers: User[] = [
  {
    id: "user_1",
    name: "John Okafor",
    phone: "+2348012345678",
    location: "Lagos",
    avatar: generateAvatarUrl("user_1"),
    email: "john.okafor@example.com",
    role: "farmer",
  },
  {
    id: "user_2",
    name: "Aisha Mohammed",
    phone: "+2348023456789",
    location: "Kano",
    avatar: generateAvatarUrl("user_2"),
    email: "aisha.mohammed@example.com",
    role: "buyer",
  },
  {
    id: "user_3",
    name: "Chioma Nwankwo",
    phone: "+2348034567890",
    location: "Ogun",
    avatar: generateAvatarUrl("user_3"),
    email: "chioma.nwankwo@example.com",
    role: "farmer",
  },
  {
    id: "user_4",
    name: "Ibrahim Yusuf",
    phone: "+2348045678901",
    location: "Plateau",
    avatar: generateAvatarUrl("user_4"),
    email: "ibrahim.yusuf@example.com",
    role: "buyer",
  },
  {
    id: "user_5",
    name: "Grace Adeyemi",
    phone: "+2348056789012",
    location: "Benue",
    avatar: generateAvatarUrl("user_5"),
    email: "grace.adeyemi@example.com",
    role: "farmer",
  },
  {
    id: "user_6",
    name: "Samuel Ojo",
    phone: "+2348067890123",
    location: "Ekiti",
    avatar: generateAvatarUrl("user_6"),
    email: "samuel.ojo@example.com",
    role: "buyer",
  },
  {
    id: "user_7",
    name: "Ngozi Eze",
    phone: "+2348078901234",
    location: "Enugu",
    avatar: generateAvatarUrl("user_7"),
    email: "ngozi.eze@example.com",
    role: "farmer",
  },
  {
    id: "user_8",
    name: "Tunde Bakare",
    phone: "+2348089012345",
    location: "Oyo",
    avatar: generateAvatarUrl("user_8"),
    email: "tunde.bakare@example.com",
    role: "buyer",
  },
  {
    id: "user_9",
    name: "Fatima Bello",
    phone: "+2348090123456",
    location: "Kaduna",
    avatar: generateAvatarUrl("user_9"),
    email: "fatima.bello@example.com",
    role: "farmer",
  },
  {
    id: "user_10",
    name: "Emeka Okoro",
    phone: "+2348101234567",
    location: "Imo",
    avatar: generateAvatarUrl("user_10"),
    email: "emeka.okoro@example.com",
    role: "buyer",
  },
]

export const sampleProducts: Product[] = [
  {
    id: "prod-1",
    productName: "Fresh Tomatoes",
    category: "Vegetables",
    quantity: 500,
    pricePerUnit: 250,
    description: "Organic fresh tomatoes grown without pesticides. Perfect for cooking and salads.",
    image: "https://picsum.photos/seed/tomatoes/800/600",
    location: "Lagos",
    farmerId: "user_1",
    farmerName: "John Okafor",
    farmerAvatar: generateAvatarUrl("user_1"),
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
    farmerId: "user_2",
    farmerName: "Aisha Mohammed",
    farmerAvatar: generateAvatarUrl("user_2"),
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
    farmerId: "user_3",
    farmerName: "Chioma Nwankwo",
    farmerAvatar: generateAvatarUrl("user_3"),
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
    farmerId: "user_4",
    farmerName: "Ibrahim Yusuf",
    farmerAvatar: generateAvatarUrl("user_4"),
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
    farmerId: "user_5",
    farmerName: "Grace Adeyemi",
    farmerAvatar: generateAvatarUrl("user_5"),
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
    farmerId: "user_6",
    farmerName: "Samuel Ojo",
    farmerAvatar: generateAvatarUrl("user_6"),
    createdAt: new Date().toISOString(),
  }

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




// Initialize localStorage with sample data if not present
export function initializeSampleData() {
  if (typeof window === "undefined") return

  const productsKey = "foodra_products"
  const trainingKey = "foodra_training"
  const applicationsKey = "foodra_applications"
  const enrollmentsKey = "foodra_enrollments"
  const cartKey = "foodra_cart"

  // Check and seed products
  if (!localStorage.getItem(productsKey)) {
    localStorage.setItem(productsKey, JSON.stringify(sampleProducts))
  }

  // Check and seed training
  if (!localStorage.getItem(trainingKey)) {
    localStorage.setItem(trainingKey, JSON.stringify(sampleTraining))
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
