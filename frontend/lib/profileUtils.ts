// frontend/lib/profileUtils.ts
import { User } from "./types";

export function calculateProfileCompletion(user: User): number {
  let completedFields = 0;
  const totalFields = 5; // name, phone, location, role, avatar (email is immutable and empty for phone-auth users)

  // Name field
  if (user.name && user.name.trim() !== "") {
    completedFields++;
  }

  // Phone field
  if (user.phone && user.phone.trim() !== "") {
    completedFields++;
  }

  // Location field
  if (user.location && user.location.trim() !== "") {
    completedFields++;
  }

  // Account type field
  if (user.role && (user.role === "farmer" || user.role === "buyer" || user.role === "admin")) {
    completedFields++;
  }

  // Avatar field
  if (user.avatar) {
    completedFields++;
  }

  return Math.round((completedFields / totalFields) * 100);
}
