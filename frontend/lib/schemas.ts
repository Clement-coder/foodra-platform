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

// Product listing schema
export const productListingSchema = z.object({
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
  quantity: z.number().positive("Quantity must be greater than 0").refine((val) => !isNaN(val), { message: "Please enter a valid number" }),
  pricePerUnit: z.number().positive("Price must be greater than 0").refine((val) => !isNaN(val), { message: "Please enter a valid number" }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.string().min(1, "Image is required"),
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
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,13}$/, "Phone number must be 10-13 digits, optionally starting with +")
    .optional(),
  location: z.string().min(2, "Location must be at least 2 characters"),
  accountType: z.enum(["Farmer", "Buyer"]),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
