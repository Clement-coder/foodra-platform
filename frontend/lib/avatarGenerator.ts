// frontend/lib/avatarGenerator.ts

export function generateAvatarUrl(seed: string): string {
  // Using DiceBear Avatars for anonymous, customizable avatars
  // The 'seed' can be the user's ID or a hash of it to ensure uniqueness
  // We can choose a specific style, e.g., 'pixel-art', 'bottts', 'identicon', 'avataaars'
  // For anonymity, 'identicon' or 'bottts' are good choices as they don't resemble human faces.
  // Let's use 'bottts' for a fun, anonymous robot look.
  return `https://api.dicebear.com/8.x/bottts/svg?seed=${seed}`;
}
