/**
 * Cart Security Utility
 * 
 * Provides cart signing and verification to prevent localStorage manipulation.
 * The signature is generated client-side for basic tamper detection,
 * but the real validation happens server-side in the Edge Function.
 */

import { LegacyCartItem } from '@/services/cartStorageService';

export interface SignedCart {
  items: LegacyCartItem[];
  signature: string;
  timestamp: number;
  version: number;
}

const CART_VERSION = 1;
const MAX_CART_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a client-side hash for basic tamper detection
 * Note: This is NOT cryptographically secure - real validation happens server-side
 */
async function generateClientHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a canonical string representation of cart items for hashing
 */
function canonicalizeCart(items: LegacyCartItem[]): string {
  const sortedItems = [...items].sort((a, b) => {
    const idA = a.panel?.id || '';
    const idB = b.panel?.id || '';
    return idA.localeCompare(idB);
  });
  
  const simplified = sortedItems.map(item => ({
    panelId: item.panel?.id,
    buildingId: item.panel?.buildings?.id,
    precoBase: item.panel?.buildings?.preco_base,
    duration: item.duration
  }));
  
  return JSON.stringify(simplified);
}

/**
 * Sign a cart with a client-side hash
 */
export async function signCart(items: LegacyCartItem[]): Promise<SignedCart> {
  const timestamp = Date.now();
  const canonicalData = canonicalizeCart(items);
  const dataToSign = `${canonicalData}:${timestamp}:${CART_VERSION}`;
  const signature = await generateClientHash(dataToSign);
  
  console.log('🔐 [CartSecurity] Cart signed:', {
    itemCount: items.length,
    timestamp,
    signaturePrefix: signature.substring(0, 16) + '...'
  });
  
  return {
    items,
    signature,
    timestamp,
    version: CART_VERSION
  };
}

/**
 * Verify a signed cart's integrity
 * Returns true if the cart appears unmodified
 */
export async function verifyCartSignature(signedCart: SignedCart): Promise<boolean> {
  try {
    const { items, signature, timestamp, version } = signedCart;
    
    // Check version compatibility
    if (version !== CART_VERSION) {
      console.warn('⚠️ [CartSecurity] Version mismatch:', { expected: CART_VERSION, got: version });
      return false;
    }
    
    // Check if cart is too old
    const age = Date.now() - timestamp;
    if (age > MAX_CART_AGE_MS) {
      console.warn('⚠️ [CartSecurity] Cart too old:', { ageHours: age / (60 * 60 * 1000) });
      return false;
    }
    
    // Check if cart is from the future (clock manipulation)
    if (timestamp > Date.now() + 60000) { // Allow 1 minute for clock drift
      console.warn('⚠️ [CartSecurity] Cart timestamp in future');
      return false;
    }
    
    // Regenerate signature and compare
    const canonicalData = canonicalizeCart(items);
    const dataToSign = `${canonicalData}:${timestamp}:${version}`;
    const expectedSignature = await generateClientHash(dataToSign);
    
    const isValid = signature === expectedSignature;
    
    if (!isValid) {
      console.error('❌ [CartSecurity] Signature mismatch - cart may have been tampered');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ [CartSecurity] Verification error:', error);
    return false;
  }
}

/**
 * Check if a cart has been tampered with
 */
export async function isCartTampered(signedCart: SignedCart): Promise<boolean> {
  return !(await verifyCartSignature(signedCart));
}

/**
 * Extract building IDs from cart items for server validation
 */
export function extractBuildingIds(items: LegacyCartItem[]): string[] {
  return items
    .map(item => item.panel?.buildings?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/**
 * Validate that all required cart item properties exist
 */
export function validateCartItemsIntegrity(items: LegacyCartItem[]): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!items || !Array.isArray(items)) {
    issues.push('Cart items is not a valid array');
    return { isValid: false, issues };
  }
  
  if (items.length === 0) {
    issues.push('Cart is empty');
    return { isValid: false, issues };
  }
  
  items.forEach((item, index) => {
    if (!item.panel) {
      issues.push(`Item ${index}: missing panel data`);
      return;
    }
    
    if (!item.panel.id) {
      issues.push(`Item ${index}: missing panel ID`);
    }
    
    if (!item.panel.buildings) {
      issues.push(`Item ${index}: missing building data`);
    } else {
      if (!item.panel.buildings.id) {
        issues.push(`Item ${index}: missing building ID`);
      }
      if (typeof item.panel.buildings.preco_base !== 'number' || item.panel.buildings.preco_base <= 0) {
        issues.push(`Item ${index}: invalid base price`);
      }
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Prepare cart data for server-side validation
 */
export function prepareCartForValidation(
  signedCart: SignedCart,
  planMonths: number,
  couponCode?: string,
  clientPrice?: number
) {
  const buildingIds = extractBuildingIds(signedCart.items);
  
  return {
    buildingIds,
    planMonths,
    couponCode: couponCode || null,
    clientPrice: clientPrice || 0,
    cartSignature: signedCart.signature,
    cartTimestamp: signedCart.timestamp,
    cartVersion: signedCart.version
  };
}
