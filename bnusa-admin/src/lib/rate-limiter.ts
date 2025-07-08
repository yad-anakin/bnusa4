/**
 * Simple in-memory rate limiter to protect API endpoints
 * In production, consider using Redis for distributed rate limiting
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// Map to store rate limit entries by IP/identifier
const rateLimitMap = new Map<string, RateLimitEntry>();

// Default rate limit settings
const DEFAULT_MAX_REQUESTS = 100; // Maximum requests per window
const DEFAULT_TIME_WINDOW = 60 * 1000; // 1 minute in milliseconds

/**
 * Clean up expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupRateLimitEntries(): void {
  const now = Date.now();
  // Use Array.from to avoid iterator issues
  Array.from(rateLimitMap.keys()).forEach(key => {
    const entry = rateLimitMap.get(key);
    if (entry && now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  });
}

// Set up automatic cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitEntries, 10 * 60 * 1000);
}

/**
 * Check if a request should be rate limited
 * @param identifier Unique identifier for the requester (IP, user ID, etc.)
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param timeWindow Time window in milliseconds
 * @returns Object with isLimited flag and reset time
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
  timeWindow: number = DEFAULT_TIME_WINDOW
): { isLimited: boolean; resetTime: number; remainingRequests: number } {
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitMap.get(identifier);
  
  // If entry doesn't exist or has expired, create a new one
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + timeWindow
    };
    rateLimitMap.set(identifier, entry);
    
    return {
      isLimited: false,
      resetTime: entry.resetTime,
      remainingRequests: maxRequests - 1
    };
  }
  
  // Increment count
  entry.count++;
  
  // Check if rate limit exceeded
  if (entry.count > maxRequests) {
    return {
      isLimited: true,
      resetTime: entry.resetTime,
      remainingRequests: 0
    };
  }
  
  return {
    isLimited: false,
    resetTime: entry.resetTime,
    remainingRequests: maxRequests - entry.count
  };
}

/**
 * Reset rate limit for an identifier
 * @param identifier Unique identifier for the requester
 */
export function resetRateLimit(identifier: string): void {
  rateLimitMap.delete(identifier);
} 