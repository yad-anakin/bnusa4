import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Hash a password using bcrypt
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // Higher is more secure but slower
  return bcrypt.hash(password, saltRounds);
}

/**
 * Generate a secure random token
 * @param length Length of the token to generate
 * @returns Secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a CSRF token for form protection
 * @returns CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(16);
}

/**
 * Validate CSRF token
 * @param providedToken Token provided in request
 * @param storedToken Token stored in session
 * @returns Boolean indicating if tokens match
 */
export function validateCSRFToken(providedToken: string, storedToken: string): boolean {
  if (!providedToken || !storedToken) return false;
  return crypto.timingSafeEqual(
    Buffer.from(providedToken),
    Buffer.from(storedToken)
  );
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input User input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Create a secure hash of data
 * @param data Data to hash
 * @param salt Salt to use (optional)
 * @returns Hashed data
 */
export function secureHash(data: string, salt?: string): string {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', useSalt)
    .update(data)
    .digest('hex');
  return `${useSalt}:${hash}`;
}

/**
 * Verify a secure hash
 * @param data Data to verify
 * @param hashedData Previously hashed data (salt:hash format)
 * @returns Boolean indicating if data matches hash
 */
export function verifySecureHash(data: string, hashedData: string): boolean {
  const [salt, storedHash] = hashedData.split(':');
  if (!salt || !storedHash) return false;
  
  const hash = crypto.createHmac('sha256', salt)
    .update(data)
    .digest('hex');
  
  return storedHash === hash;
}

/**
 * Generate a nonce for Content Security Policy (CSP)
 * @returns A random nonce for CSP
 */
export function generateCSPNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Generate a Content Security Policy
 * @param nonce Optional nonce for script-src
 * @returns CSP header value
 */
export function generateCSP(nonce?: string): string {
  // Allow unsafe-eval in development mode for Next.js hot reloading
  const isDev = process.env.NODE_ENV !== 'production';
  
  const scriptSrc = nonce 
    ? `'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} 'nonce-${nonce}'` 
    : `'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''}`;
  
  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://localhost:* http://localhost:*`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`
  ].join('; ');
}

/**
 * Validate if a string contains SQL injection patterns
 * @param input String to check
 * @returns Whether the string might contain SQL injection
 */
export function hasSQLInjection(input: string): boolean {
  if (!input) return false;
  
  // Check for common SQL injection patterns
  const sqlPatterns = [
    /(\b|')SELECT(\b|')/i,
    /(\b|')INSERT(\b|')/i,
    /(\b|')UPDATE(\b|')/i,
    /(\b|')DELETE(\b|')/i,
    /(\b|')DROP(\b|')/i,
    /(\b|')TABLE(\b|')/i,
    /(\b|')FROM(\b|')/i,
    /(\b|')WHERE(\b|')/i,
    /(\b|')OR(\b|') .* =.*/i,
    /(\b|')AND(\b|') .* =.*/i,
    /--/,
    /;.*/,
    /\/\*.*\*\//
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
} 