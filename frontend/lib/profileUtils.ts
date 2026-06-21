// frontend/lib/profileUtils.ts
import { User } from "./types";

export function calculateProfileCompletion(user: User): number {
  let completedFields = 0;
  const totalFields = 4; // name, phone, location, role

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
  if (user.role && (user.role === "buyer" || user.role === "admin" || user.role === "owner")) {
    completedFields++;
  }

  return Math.round((completedFields / totalFields) * 100);
}
