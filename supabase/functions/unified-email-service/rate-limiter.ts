
export class RateLimiter {
  private static attempts = new Map<string, number[]>();

  static checkLimit(email: string, maxAttempts: number = 3, windowMs: number = 300000): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(email) || [];
    
    // Remove attempts outside window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(email, recentAttempts);
    return true;
  }
}
