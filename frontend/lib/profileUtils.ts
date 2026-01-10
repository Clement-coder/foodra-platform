// frontend/lib/profileUtils.ts
import { User } from "./types";

export function calculateProfileCompletion(user: User): number {
  let completedFields = 0;
  const totalFields = 6; // name, email, phone, location, accountType, avatar

  // Name field
  if (user.name && user.name.trim() !== "") {
    completedFields++;
  }

  // Email field
  if (user.email) {
    completedFields++;
  }

  // Phone field
  if (user.phone) {
    completedFields++;
  }

  // Location field
  if (user.location && user.location.trim() !== "") {
    completedFields++;
  }

  // Account type field (assuming it's always set to 'farmer' by default, but can be changed)
  if (user.role && (user.role === "farmer" || user.role === "buyer")) { // Assuming role is equivalent to accountType for completion purposes
    completedFields++;
  }

  // Avatar field
  if (user.avatar) {
    completedFields++;
  }

  return Math.round((completedFields / totalFields) * 100);
}
