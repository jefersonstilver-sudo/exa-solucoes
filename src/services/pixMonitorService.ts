
/**
 * @deprecated Use the modular imports from 'services/payment' instead
 * This file is kept for backward compatibility
 */

import { usePixMonitor } from './payment/usePixMonitor';
import { PixMonitor } from './payment/PixMonitor';
import { PixPaymentStatus, PaymentLogData } from './payment/pixTypes';

// Re-export everything for backward compatibility
export { usePixMonitor, PixMonitor };
export type { PixPaymentStatus, PaymentLogData };

// If any component imports directly from this file, they'll still work but will get
// the functionality from the new modular structure
