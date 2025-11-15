// Rate Limiting Utility for Edge Functions
// Provides in-memory rate limiting to prevent abuse

interface RateLimitRecord {
  attempts: number[];
  blocked: boolean;
  blockUntil?: number;
}

const rateLimits = new Map<string, RateLimitRecord>();

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimits.entries()) {
    // Remove entries older than 1 hour
    if (record.attempts.length === 0 || Math.max(...record.attempts) < now - 3600000) {
      rateLimits.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  resetAt?: number;
  blockUntil?: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const { maxAttempts, windowMs, blockDurationMs = 900000 } = config;

  // Get or create record for this identifier
  let record = rateLimits.get(identifier);
  if (!record) {
    record = { attempts: [], blocked: false };
    rateLimits.set(identifier, record);
  }

  // Check if currently blocked
  if (record.blocked && record.blockUntil) {
    if (now < record.blockUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        blockUntil: record.blockUntil
      };
    } else {
      // Block expired, reset
      record.blocked = false;
      record.blockUntil = undefined;
      record.attempts = [];
    }
  }

  // Remove attempts outside the time window
  record.attempts = record.attempts.filter(time => now - time < windowMs);

  // Check if limit exceeded
  if (record.attempts.length >= maxAttempts) {
    record.blocked = true;
    record.blockUntil = now + blockDurationMs;
    return {
      allowed: false,
      remainingAttempts: 0,
      blockUntil: record.blockUntil
    };
  }

  // Record this attempt
  record.attempts.push(now);
  rateLimits.set(identifier, record);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - record.attempts.length,
    resetAt: now + windowMs
  };
}

/**
 * Extract client identifier from request headers
 * @param req - Request object
 * @returns Client identifier (IP address or 'unknown')
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || realIp || 'unknown';
}

/**
 * Create rate limit error response
 * @param result - Rate limit result
 * @param corsHeaders - CORS headers to include
 * @returns Response object with 429 status
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  const resetTime = result.blockUntil || result.resetAt;
  const message = result.blockUntil 
    ? `Too many requests. Blocked until ${new Date(result.blockUntil).toISOString()}`
    : 'Rate limit exceeded. Please try again later.';

  return new Response(
    JSON.stringify({
      error: message,
      retryAfter: resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : undefined
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': resetTime ? String(Math.ceil((resetTime - Date.now()) / 1000)) : '60'
      }
    }
  );
}
