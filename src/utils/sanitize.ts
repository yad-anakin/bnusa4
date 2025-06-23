/**
 * Utility functions for input sanitization and validation
 */

/**
 * Sanitizes a string by removing potentially harmful characters and HTML tags
 * @param input The input string to sanitize
 * @returns The sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script elements and attributes
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');
  
  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  return sanitized;
}

/**
 * Validates input to ensure it only contains safe characters
 * Allows Kurdish, Arabic, and Latin characters plus safe punctuation
 * @param input The input string to validate
 * @returns True if the input is safe, false otherwise
 */
export function validateInput(input: string): boolean {
  if (!input) return true;
  
  // This regex allows Kurdish, Arabic, and Latin characters plus numbers and basic punctuation
  const safePattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0030-\u0039\u0041-\u005A\u0061-\u007A\u00C0-\u00FF\s.,!?-]*$/;
  
  return safePattern.test(input);
}

/**
 * Safe truncation of a string to a maximum length
 * @param input The input string to truncate
 * @param maxLength Maximum allowed length
 * @returns The truncated string
 */
export function truncateInput(input: string, maxLength: number = 100): string {
  if (!input) return '';
  return input.substring(0, maxLength);
}

/**
 * Comprehensive sanitization function that combines validation, sanitization, and truncation
 * @param input The input string to process
 * @param maxLength Maximum allowed length
 * @returns The processed string or empty string if input is unsafe
 */
export function secureSanitize(input: string, maxLength: number = 100): string {
  if (!input) return '';
  
  // Validate input first
  if (!validateInput(input)) {
    console.warn('Potentially unsafe input detected and blocked');
    return '';
  }
  
  // Sanitize and truncate the input
  return truncateInput(sanitizeInput(input), maxLength);
} 