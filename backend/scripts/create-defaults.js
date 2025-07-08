/**
 * Helper script to create default images for the application
 * Run this if your default images are missing
 */

const fs = require('fs');
const path = require('path');

// Directories to check and create
const directories = [
  '../public/images/patterns',
  '../public/images/placeholders'
];

// Ensure directories exist
directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${fullPath}`);
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Create default SVG patterns if they don't exist
const patterns = {
  'pattern-dots.svg': `<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
  <circle cx="2" cy="2" r="1" fill="currentColor" />
  <circle cx="10" cy="2" r="1" fill="currentColor" />
  <circle cx="18" cy="2" r="1" fill="currentColor" />
  <circle cx="6" cy="6" r="1" fill="currentColor" />
  <circle cx="14" cy="6" r="1" fill="currentColor" />
  <circle cx="2" cy="10" r="1" fill="currentColor" />
  <circle cx="10" cy="10" r="1" fill="currentColor" />
  <circle cx="18" cy="10" r="1" fill="currentColor" />
  <circle cx="6" cy="14" r="1" fill="currentColor" />
  <circle cx="14" cy="14" r="1" fill="currentColor" />
  <circle cx="2" cy="18" r="1" fill="currentColor" />
  <circle cx="10" cy="18" r="1" fill="currentColor" />
  <circle cx="18" cy="18" r="1" fill="currentColor" />
</svg>`,
  'pattern-geo.svg': `<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
  <!-- Hexagons -->
  <path d="M20,0 L40,10 L40,30 L20,40 L0,30 L0,10 Z" fill="none" stroke="currentColor" stroke-width="1" />
  <path d="M60,0 L80,10 L80,30 L60,40 L40,30 L40,10 Z" fill="none" stroke="currentColor" stroke-width="1" />
  <path d="M20,40 L40,50 L40,70 L20,80 L0,70 L0,50 Z" fill="none" stroke="currentColor" stroke-width="1" />
  <path d="M60,40 L80,50 L80,70 L60,80 L40,70 L40,50 Z" fill="none" stroke="currentColor" stroke-width="1" />
  
  <!-- Circles -->
  <circle cx="20" cy="20" r="5" fill="none" stroke="currentColor" stroke-width="1" />
  <circle cx="60" cy="20" r="5" fill="none" stroke="currentColor" stroke-width="1" />
  <circle cx="20" cy="60" r="5" fill="none" stroke="currentColor" stroke-width="1" />
  <circle cx="60" cy="60" r="5" fill="none" stroke="currentColor" stroke-width="1" />
  
  <!-- Triangles -->
  <path d="M15,15 L25,15 L20,7 Z" fill="none" stroke="currentColor" stroke-width="1" />
  <path d="M55,15 L65,15 L60,7 Z" fill="none" stroke="currentColor" stroke-width="1" />
  <path d="M15,55 L25,55 L20,47 Z" fill="none" stroke="currentColor" stroke-width="1" />
  <path d="M55,55 L65,55 L60,47 Z" fill="none" stroke="currentColor" stroke-width="1" />
</svg>`
};

// Write pattern files
Object.entries(patterns).forEach(([filename, content]) => {
  const fullPath = path.join(__dirname, '../public/images/patterns', filename);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating pattern file: ${fullPath}`);
    fs.writeFileSync(fullPath, content);
  }
});

// Ensure banner primary exists by copying from banner-primary.png
const bannerSource = path.join(__dirname, '../public/images/placeholders/banner-primary.png');
const bannerTarget = path.join(__dirname, '../public/images/placeholders/profile-banner-primary.jpg');

// Check if source exists
if (fs.existsSync(bannerSource)) {
  console.log(`Copying from ${bannerSource} to ${bannerTarget}`);
  fs.copyFileSync(bannerSource, bannerTarget);
} else {
  console.log(`Source banner image not found: ${bannerSource}`);
  // Create a placeholder banner with text
  try {
    const { createCanvas } = require('canvas');
    
    // Create a gradient banner (fallback if canvas is not available)
    const width = 1200;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#4F46E5'); // --primary color
    gradient.addColorStop(1, '#F97316'); // --secondary color
    
    // Fill with gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add pattern dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let x = 10; x < width; x += 20) {
      for (let y = 10; y < height; y += 20) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Add text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Default Banner', width / 2, height / 2);
    
    // Save to file
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(bannerTarget, buffer);
    console.log(`Created banner image: ${bannerTarget}`);
  } catch (error) {
    console.error('Failed to create banner with canvas:', error);
    // We can't create the image programmatically, so just notify user
    console.log('Please create a banner image manually at:', bannerTarget);
  }
}

console.log('Default resources setup complete!'); 