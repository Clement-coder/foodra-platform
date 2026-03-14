import { z } from "zod"

// Helper for number fields with custom invalid type message
const numberWithMessage = (invalidMsg: string) =>
  z.number().refine((val) => !isNaN(val), { message: invalidMsg })

// Funding application schema
export const fundingApplicationSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,13}$/, "Phone number must be 10-13 digits, optionally starting with +"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  farmSize: z.number().positive("Farm size must be greater than 0").refine((val) => !isNaN(val), { message: "Please enter a valid number" }),
  farmType: z.string().min(2, "Farm type is required"),
  yearsOfExperience: z.number().min(0, "Years of experience cannot be negative").refine((val) => !isNaN(val), { message: "Please enter a valid number" }),
  amountRequested: z.number().min(1000, "Amount requested must be at least 1000").refine((val) => !isNaN(val), { message: "Please enter a valid number" }),
  expectedOutcome: z.string().min(10, "Expected outcome must be at least 10 characters"),
})

export type FundingApplicationFormData = z.infer<typeof fundingApplicationSchema>

// Category → allowed product keywords mapping
export const CATEGORY_PRODUCTS: Record<string, string[]> = {
  Vegetables: [
    "tomato", "pepper", "onion", "carrot", "cabbage", "spinach", "lettuce", "cucumber",
    "okra", "eggplant", "garden egg", "bitter leaf", "ugwu", "fluted pumpkin", "waterleaf",
    "scent leaf", "celery", "broccoli", "cauliflower", "kale", "leek", "garlic", "ginger",
    "green bean", "pea", "corn", "maize", "sweet corn", "zucchini", "pumpkin", "squash",
    "beetroot", "radish", "turnip", "asparagus", "artichoke", "chilli", "scotch bonnet",
    "tatashe", "shombo", "green pepper", "red pepper", "yellow pepper",
  ],
  Fruits: [
    "mango", "banana", "plantain", "orange", "pineapple", "watermelon", "pawpaw", "papaya",
    "avocado", "guava", "coconut", "lemon", "lime", "grape", "apple", "pear", "peach",
    "plum", "cherry", "strawberry", "blueberry", "passion fruit", "soursop", "breadfruit",
    "jackfruit", "fig", "date", "tamarind", "african star apple", "udara", "agbalumo",
    "tangerine", "grapefruit", "mandarin", "kiwi", "melon", "honeydew",
  ],
  Grains: [
    "rice", "wheat", "millet", "sorghum", "guinea corn", "oat", "barley", "rye",
    "maize", "corn", "fonio", "teff", "amaranth", "quinoa", "buckwheat",
    "ofada rice", "local rice", "brown rice", "white rice", "parboiled rice",
  ],
  Tubers: [
    "yam", "cassava", "potato", "sweet potato", "cocoyam", "taro", "arrowroot",
    "irish potato", "white yam", "water yam", "yellow yam", "puna yam",
    "garri", "fufu", "tapioca", "starch",
  ],
  Legumes: [
    "bean", "cowpea", "soybean", "groundnut", "peanut", "lentil", "chickpea",
    "black-eyed pea", "kidney bean", "pigeon pea", "bambara nut", "sesame",
    "melon seed", "egusi", "locust bean", "iru", "dawadawa",
  ],
  Poultry: [
    "chicken", "turkey", "duck", "goose", "quail", "guinea fowl", "broiler",
    "layer", "egg", "chicken egg", "turkey egg", "day old chick", "live chicken",
    "dressed chicken", "frozen chicken",
  ],
  Livestock: [
    "cow", "cattle", "goat", "sheep", "pig", "rabbit", "snail", "grasscutter",
    "beef", "mutton", "pork", "lamb", "goat meat", "cow leg", "tripe", "offal",
    "milk", "cow milk", "goat milk", "hide", "skin",
  ],
  Seafood: [
    "fish", "catfish", "tilapia", "mackerel", "tuna", "salmon", "sardine", "herring",
    "crayfish", "shrimp", "prawn", "crab", "lobster", "periwinkle", "snail",
    "smoked fish", "dried fish", "stockfish", "panla", "croaker", "bonga",
  ],
  Spices: [
    "pepper", "chilli", "ginger", "garlic", "turmeric", "cinnamon", "clove", "nutmeg",
    "thyme", "curry", "bay leaf", "rosemary", "basil", "oregano", "cumin", "coriander",
    "fenugreek", "cardamom", "anise", "fennel", "paprika", "suya spice", "uziza",
  ],
  Others: [], // accepts anything
}

// Product listing schema
export const productListingSchema = z
  .object({
    productName: z.string().min(2, "Product name must be at least 2 characters"),
    category: z.enum(
      Object.keys(CATEGORY_PRODUCTS) as [string, ...string[]],
      { errorMap: () => ({ message: "Please select a valid category" }) }
    ),
    quantity: z.number().positive("Quantity must be greater than 0").refine((val) => !isNaN(val), { message: "Please enter a valid number" }),
    pricePerUnit: z.number().positive("Price must be greater than 0").refine((val) => !isNaN(val), { message: "Please enter a valid number" }),
    description: z.string().min(10, "Description must be at least 10 characters"),
    image: z.string().min(1, "Product image is required"),
  })
  .superRefine((data, ctx) => {
    const { category, productName } = data
    const allowed = CATEGORY_PRODUCTS[category]
    // "Others" accepts anything; skip check
    if (!allowed || allowed.length === 0) return

    const nameLower = productName.toLowerCase()
    const matches = allowed.some((keyword) => nameLower.includes(keyword.toLowerCase()))

    if (!matches) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productName"],
        message: `"${productName}" doesn't match the "${category}" category. Please select the correct category or rename your product.`,
      })
    }
  })

export type ProductListingFormData = z.infer<typeof productListingSchema>

// Training registration schema
export const trainingRegistrationSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phoneNumber: z
    .string()
    .regex(/^\+?[0-9]{10,13}$/, "Phone number must be 10-13 digits, optionally starting with +"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  trainingId: z.string().min(1, "Training ID is required"),
})

export type TrainingRegistrationFormData = z.infer<typeof trainingRegistrationSchema>

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,13}$/, "Phone number must be 10-13 digits, optionally starting with +")
    .optional(),
  location: z.string().min(2, "Location must be at least 2 characters"),
  accountType: z.enum(["Farmer", "Buyer"]),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
