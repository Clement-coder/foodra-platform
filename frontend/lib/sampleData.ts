import type { Product, Training, User, Order } from "./types"
import { generateAvatarUrl } from "./avatarGenerator"

export const sampleUsers: User[] = [
  {
    id: "user-1",
    name: "John Okafor",
    phone: "+2348012345678",
    location: "Lagos",
    avatar: generateAvatarUrl("user-1"),
    email: "john.okafor@example.com",
    role: "farmer",
  },
  {
    id: "user-2",
    name: "Aisha Mohammed",
    phone: "+2348023456789",
    location: "Kano",
    avatar: generateAvatarUrl("user-2"),
    email: "aisha.mohammed@example.com",
    role: "buyer",
  },
  {
    id: "user-3",
    name: "Chioma Nwankwo",
    phone: "+2348034567890",
    location: "Ogun",
    avatar: generateAvatarUrl("user-3"),
    email: "chioma.nwankwo@example.com",
    role: "farmer",
  },
  {
    id: "user-4",
    name: "Ibrahim Yusuf",
    phone: "+2348045678901",
    location: "Plateau",
    avatar: generateAvatarUrl("user-4"),
    email: "ibrahim.yusuf@example.com",
    role: "buyer",
  },
  {
    id: "user-5",
    name: "Grace Adeyemi",
    phone: "+2348056789012",
    location: "Benue",
    avatar: generateAvatarUrl("user-5"),
    email: "grace.adeyemi@example.com",
    role: "farmer",
  },
  {
    id: "user-6",
    name: "Samuel Ojo",
    phone: "+2348067890123",
    location: "Ekiti",
    avatar: generateAvatarUrl("user-6"),
    email: "samuel.ojo@example.com",
    role: "buyer",
  },
  {
    id: "user-7",
    name: "Ngozi Eze",
    phone: "+2348078901234",
    location: "Enugu",
    avatar: generateAvatarUrl("user-7"),
    email: "ngozi.eze@example.com",
    role: "farmer",
  },
  {
    id: "user-8",
    name: "Tunde Bakare",
    phone: "+2348089012345",
    location: "Oyo",
    avatar: generateAvatarUrl("user-8"),
    email: "tunde.bakare@example.com",
    role: "buyer",
  },
  {
    id: "user-9",
    name: "Fatima Bello",
    phone: "+2348090123456",
    location: "Kaduna",
    avatar: generateAvatarUrl("user-9"),
    email: "fatima.bello@example.com",
    role: "farmer",
  },
  {
    id: "user-10",
    name: "Emeka Okoro",
    phone: "+2348101234567",
    location: "Imo",
    avatar: generateAvatarUrl("user-10"),
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
    image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIALcAwQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAAFBgADBAcCAf/EAEAQAAIBAwMBBQUGAwYFBQAAAAECAwAEEQUSITEGEyJURQyYXGRQlKBobHRI8HwFSRUYpLhFjNTVfE0Q4KTwv/EABsBAAMBAQEBAQAAAAAAAAAAAAIDBAEFAAYH/8QAMREAAgIBAwMCBAUDBQAAAAAAAQIAAxESITEEE0FRYRQikfAycYGh0SNSwQUVM0Lx/9oADAMBAAIRAxEAPwDHo2sW9vdwyzIhCnOD6Z5ovrDPrd/JcW6m3ilwR4ck4pNlhV9fi7yNokLbyD54HFOb3CyWG6Pk5GQOoH7V882FG0/QbF/qdwDfjM8WfYeRz7RFqUUcvVVlA8Xw4qzW9Kdo1t71MToPA4xgj4YxW7u5pLSO4Q5Qj3vSsl1dPKhtrx2ZD7rHqlHqGMEEGSo1rPktn/E5/dW91HcrDAwd3bbg84p/0TT49NtUWIhp8AvJjJJpCN0bLX2id9+QdjHzH9A/SnXRdbgMWybk48J+NebOwMosVnUld8cibr+8nMDpM+9CCNkgyD+FKljcQ2800UeF3SGQLn+vT86K6pqCyo6qcDnmlyDQ77VLkTxOsCL9sg5b8KHGrYnaMrUU15KxyTtC62TRbVOECqfhS/NfyySMd3nVUum6hbRld6zYHoR/OgR1GT242qwskw67hjaK8A1nnOIaiincf9prmuLk6qvssLuEHJX1rXdX9yMG4R0IH2ucUY0PThDHuZfGefnReOxtLlZDdNtQHBUR5LfWvA5wAJjXCsnO859dXbXMUiIwLFSAT60e7J9n9I7jbqVrLdT4yW74oqn4BefqTRGbspoblvZbi8t3JyN+xk+gGfzono9kICyzSKqbciTPDD4U0llwK5HYyWgswII45gXUdFt4VY2LvET0SR9w+p5oz2bttP0xTIyreXoA3Oy8IcdBnp6ev8g+vX9ut4kcUmQB1/Cr9GvIlIkflCcORSldlMfZU1lG5P5Rkkuby9l7lIjJk8Rg9PxofrGgtG6XGnPbxXP24i/BP4edXR33tMLLHhUY846n51TInBx1ozYMb7yStGRttseP5ih2h1DUYCE1LemeVzyG+R86N9nr1GaNJHADHgmqu0KDVNLn02cFiuWtiDyG8sH6/WvfZXs1bW+mxS6vdyTuy5EUHAX03N6/L868yoQGz9Y97So0uu2NsRg1OSzgj5mBJUkBeaSNSu5biaO3sYpZip5Eak+H44pj1DQrSe0d7S8kgmHurJlgR8c8j51XpGlvp6HvbiIzEZYoS2R9KFtOc4mUsiIcHf3E96NYX93YGclYBEOVcc8eozxXu5nt5LKNhIDLKMCNRytW3czQRlbhd8co6o36EfpSvBMy6jMgLPyEhx1IP8z0oCABxDrRnYsTt4hvuLz7p/1VKx95qP8Ah5v9JqUGW9I3SfUfWX6r2cuLnxQX0Tv5ZQqQfrWHRZr/AEPVgupQhwUO37SuT5fDj1pruIWVN21qVO0khjjcqSCOQRTTnGkiLpJtyrHaGLbUTaae0KynxfZ8qE6jfsyk7vKgEeqyTOkSKGk6ADzNMln2de5hD3b53clN3SsbK7NHqaEy2YDjsINUjdyqmaJjsfPOMD/f61hmlm0xyJyCg6MOop3axttPtSIECEea/wA6SddaWaYxGLcx6KOhFMRgxx4i9RwXWe7G+OsX8Vtaq0u5sssfiwPwrpdjbSRW4E6LHtAxG... [truncated]",
    location: "Lagos",
    farmerId: "farmer-1",
    farmerName: "John Okafor",
    farmerAvatar: generateAvatarUrl("farmer-1"),
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
    farmerAvatar: generateAvatarUrl("farmer-2"),
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
    farmerAvatar: generateAvatarUrl("farmer-3"),
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
    farmerAvatar: generateAvatarUrl("farmer-4"),
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
    farmerAvatar: generateAvatarUrl("farmer-5"),
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
    farmerAvatar: generateAvatarUrl("farmer-6"),
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