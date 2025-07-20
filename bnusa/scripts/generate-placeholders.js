/**
 * Script to generate placeholder images for development and testing
 * Run with: node scripts/generate-placeholders.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../public/images/placeholders');
const SIZES = [
  { width: 1200, height: 630, name: 'hero' },  // Hero image
  { width: 600, height: 400, name: 'article' }, // Article thumbnail
  { width: 300, height: 300, name: 'square' },  // Square image
  { width: 100, height: 100, name: 'avatar' },  // Avatar image
  { width: 1920, height: 1080, name: 'banner' } // Banner image
];
const COLORS = [
  { bg: '#4F46E5', text: '#FFFFFF', name: 'primary' },
  { bg: '#F97316', text: '#FFFFFF', name: 'secondary' },
  { bg: '#F3F4F6', text: '#1F2937', name: 'light' },
  { bg: '#1F2937', text: '#F3F4F6', name: 'dark' },
  { bg: '#10B981', text: '#FFFFFF', name: 'success' }
];

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
}

/**
 * Generate a placeholder image with text
 * @param {number} width - Width of the image
 * @param {number} height - Height of the image
 * @param {string} bgColor - Background color
 * @param {string} textColor - Text color
 * @param {string} text - Text to display
 * @returns {Buffer} - Image buffer
 */
function generatePlaceholder(width, height, bgColor, textColor, text) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Add a border
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Add text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.max(16, Math.min(32, width / 10))}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toBuffer('image/png');
}

/**
 * Generate a placeholder image with a pattern
 * @param {number} width - Width of the image
 * @param {number} height - Height of the image
 * @param {string} primaryColor - Background color
 * @param {string} secondaryColor - Pattern color
 * @param {string} text - Text to display
 * @returns {Buffer} - Image buffer
 */
function generatePatternPlaceholder(width, height, primaryColor, secondaryColor, text) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, width, height);
  
  // Create a pattern
  const patternSize = Math.max(20, Math.min(50, width / 12));
  
  // Draw a grid pattern
  ctx.fillStyle = secondaryColor;
  for (let x = 0; x < width; x += patternSize) {
    for (let y = 0; y < height; y += patternSize) {
      if ((x + y) % (patternSize * 2) === 0) {
        ctx.fillRect(x, y, patternSize / 2, patternSize / 2);
      }
    }
  }
  
  // Add a border
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Add text with background
  const textWidth = ctx.measureText(text).width + 20;
  const textHeight = Math.max(16, Math.min(32, width / 10)) + 10;
  
  ctx.fillStyle = primaryColor;
  ctx.fillRect(width / 2 - textWidth / 2, height / 2 - textHeight / 2, textWidth, textHeight);
  
  ctx.fillStyle = secondaryColor;
  ctx.font = `bold ${Math.max(16, Math.min(32, width / 10))}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toBuffer('image/png');
}

/**
 * Generate an avatar placeholder with initials
 * @param {number} size - Size of the avatar
 * @param {string} bgColor - Background color
 * @param {string} textColor - Text color
 * @param {string} initials - Initials to display
 * @returns {Buffer} - Image buffer
 */
function generateAvatarPlaceholder(size, bgColor, textColor, initials) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Draw circular background
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Add initials
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size / 2.5}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials.substring(0, 2).toUpperCase(), size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
}

// Generate placeholder images for each size and color
let count = 0;

// Basic placeholders
for (const size of SIZES) {
  for (const color of COLORS) {
    const filename = `${size.name}-${color.name}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const text = `${size.width}×${size.height}`;
    
    const imageBuffer = generatePlaceholder(
      size.width, 
      size.height, 
      color.bg, 
      color.text, 
      text
    );
    
    fs.writeFileSync(filepath, imageBuffer);
    count++;
  }
}

// Pattern placeholders
for (const size of SIZES) {
  for (const color of COLORS) {
    const filename = `${size.name}-${color.name}-pattern.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const text = `${size.name}`;
    
    const imageBuffer = generatePatternPlaceholder(
      size.width, 
      size.height, 
      color.bg, 
      color.text, 
      text
    );
    
    fs.writeFileSync(filepath, imageBuffer);
    count++;
  }
}

// Avatar placeholders
const avatarSize = 100;
const avatarInitials = ['JD', 'AB', 'YZ', 'MK', 'TS'];

for (const color of COLORS) {
  for (const initials of avatarInitials) {
    const filename = `avatar-${initials.toLowerCase()}-${color.name}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    const imageBuffer = generateAvatarPlaceholder(
      avatarSize,
      color.bg,
      color.text,
      initials
    );
    
    fs.writeFileSync(filepath, imageBuffer);
    count++;
  }
}

console.log(`Generated ${count} placeholder images in ${OUTPUT_DIR}`);
console.log('');
console.log('To use these images in your Next.js app:');
console.log('1. Import them directly in your components:');
console.log('   import heroImage from "/public/images/placeholders/hero-primary.png"');
console.log('2. Or use them in your Image components:');
console.log('   <Image src="/images/placeholders/article-secondary.png" alt="Article image" width={600} height={400} />');
console.log('3. Or reference them in your CSS:');
console.log('   background-image: url("/images/placeholders/banner-dark.png")'); 