/**
 * Utility functions for generating profile images
 */

// Color palette for background colors (soft, professional colors)
const BACKGROUND_COLOR = '#5540e6'; // Fixed purple background to match the provided image

/**
 * Generate a hash code from a string
 * This is used to consistently assign the same color to the same name
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get initials from a name
 * Returns up to 2 characters for the initials
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate a Data URL for an SVG with a user icon
 * This creates an SVG with a person icon on a purple background
 */
export function generateAvatarWithIcon(size = 200): string {
  // User icon SVG path (simplified person icon)
  const iconPath = `
    <circle cx="${size/2}" cy="${size/2.5}" r="${size/6}" fill="white" />
    <path d="M${size*0.33} ${size*0.7} 
             C${size*0.33} ${size*0.63}, ${size*0.4} ${size*0.58}, ${size*0.5} ${size*0.58} 
             C${size*0.6} ${size*0.58}, ${size*0.67} ${size*0.63}, ${size*0.67} ${size*0.7}
             L${size*0.67} ${size*0.78}
             C${size*0.67} ${size*0.84}, ${size*0.6} ${size*0.9}, ${size*0.5} ${size*0.9}
             C${size*0.4} ${size*0.9}, ${size*0.33} ${size*0.84}, ${size*0.33} ${size*0.78}
             Z" 
          fill="white" />
  `;
  
  // Create SVG with user icon
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${BACKGROUND_COLOR}" />
      ${iconPath}
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="none" stroke="white" stroke-opacity="0.15" stroke-width="2" />
    </svg>
  `;
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  return dataUrl;
}

/**
 * Generate a consistent profile image URL for a new user
 * @returns A Data URL of an SVG image with a user icon
 */
export function generateProfileImage(): string {
  return generateAvatarWithIcon();
}

export default {
  generateProfileImage,
  getInitials,
  generateAvatarWithIcon
}; 