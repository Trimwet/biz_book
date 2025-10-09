/**
 * Utility function to merge class names
 * Handles conditional classes, undefined values, and duplicates
 */
export function cn(...inputs) {
  return inputs
    .filter(Boolean)
    .join(' ')
    .trim();
}