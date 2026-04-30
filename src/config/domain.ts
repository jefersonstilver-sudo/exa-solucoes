/**
 * Domain configuration for public URLs
 * This ensures all building links use the correct custom domain
 */

// Your custom domain - update this to match your production domain
export const PRIMARY_DOMAIN = 'https://www.examidia.com.br';

// Fallback to current domain in development/testing if needed
export const FORCE_CUSTOM_DOMAIN = true;

/**
 * Get the public domain to use for generating links
 */
export const getPublicDomain = (): string => {
  if (FORCE_CUSTOM_DOMAIN) {
    return PRIMARY_DOMAIN;
  }
  
  // Fallback to current origin if custom domain is not forced
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return PRIMARY_DOMAIN;
};

/**
 * Generate a full public URL from a path
 * @param path - The path to append to the domain (should start with /)
 */
export const generatePublicUrl = (path: string): string => {
  const domain = getPublicDomain();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${domain}${cleanPath}`;
};
