/**
 * Utility functions for generating placeholder images
 * These can be used for testing and development purposes
 */

/**
 * Generates a colored placeholder image with optional text
 * @param width Width of the placeholder image
 * @param height Height of the placeholder image
 * @param backgroundColor Background color of the placeholder
 * @param textColor Text color for the placeholder
 * @param text Optional text to display on the placeholder (defaults to dimensions)
 * @returns Data URL for the placeholder image
 */
export function generatePlaceholder(
  width: number = 300,
  height: number = 200,
  backgroundColor: string = '#e2e8f0',
  textColor: string = '#64748b',
  text?: string
): string {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Get the drawing context
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Fill the background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
  
  // Add a slight border
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Add text
  const displayText = text || `${width}×${height}`;
  ctx.fillStyle = textColor;
  ctx.font = `${Math.max(12, Math.min(32, width / 10))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayText, width / 2, height / 2);
  
  // Return the data URL
  return canvas.toDataURL('image/png');
}

/**
 * Generates a placeholder image with a simple pattern
 * @param width Width of the placeholder image
 * @param height Height of the placeholder image
 * @param primaryColor Primary color for the pattern
 * @param secondaryColor Secondary color for the pattern
 * @returns Data URL for the placeholder image
 */
export function generatePatternPlaceholder(
  width: number = 300,
  height: number = 200,
  primaryColor: string = '#e2e8f0',
  secondaryColor: string = '#94a3b8'
): string {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Get the drawing context
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Fill the background
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, width, height);
  
  // Create a pattern
  const patternSize = Math.max(20, Math.min(50, width / 10));
  
  // Draw diagonal stripes
  ctx.fillStyle = secondaryColor;
  for (let x = 0; x < width + height; x += patternSize * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - height, height);
    ctx.lineTo(x - height + patternSize, height);
    ctx.lineTo(x + patternSize, 0);
    ctx.closePath();
    ctx.fill();
  }
  
  // Add a border
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Return the data URL
  return canvas.toDataURL('image/png');
}

/**
 * Creates a placeholder avatar image with initials
 * @param initials Initials to display (1-2 characters recommended)
 * @param size Size of the avatar image
 * @param backgroundColor Background color for the avatar
 * @param textColor Text color for the initials
 * @returns Data URL for the avatar image
 */
export function generateAvatarPlaceholder(
  initials: string,
  size: number = 100,
  backgroundColor: string = '#3b82f6',
  textColor: string = '#ffffff'
): string {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  // Get the drawing context
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Draw circular background
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Add initials
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size / 2.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials.substring(0, 2).toUpperCase(), size / 2, size / 2);
  
  // Return the data URL
  return canvas.toDataURL('image/png');
}

/**
 * Generates a placeholder image on the server side for SSR
 * @param width Width of the placeholder
 * @param height Height of the placeholder
 * @param text Optional text to display
 * @returns Path to the placeholder image
 */
export function getServerPlaceholder(
  width: number = 300,
  height: number = 200,
  text?: string
): string {
  const displayText = encodeURIComponent(text || `${width}×${height}`);
  return `/images/placeholders/placeholder-${width}x${height}-${displayText}.png`;
}

/**
 * Generates a random color in hex format
 * @returns Random hex color code
 */
export function getRandomColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * Gets a placeholder image URL from a third-party service
 * @param width Width of the image
 * @param height Height of the image
 * @returns URL to the placeholder image
 */
export function getPlaceholderUrl(
  width: number = 300,
  height: number = 200
): string {
  return `https://placehold.co/${width}x${height}.png`;
} 