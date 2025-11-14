import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

interface CortesiaOrder {
  id: string;
  status: string;
  selected_buildings?: Array<{
    nome: string;
    endereco: string;
    bairro: string;
  }>;
  lista_paineis?: string[];
  nomes_predios?: string[];
}

interface UseCortesiaSuccessDetectionResult {
  showModal: boolean;
  orderData: CortesiaOrder | null;
  closeModal: () => void;
}

/**
 * Hook to detect newly created cortesia orders and show success modal
 * Detects via:
 * 1. URL parameter ?cortesia_success=pedidoId
 * 2. New 'ativo' status orders in the list
 */
export const useCortesiaSuccessDetection = (
  orders: any[] | undefined,
  loading: boolean
): UseCortesiaSuccessDetectionResult => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [orderData, setOrderData] = useState<CortesiaOrder | null>(null);
  const previousOrdersRef = useRef<string[]>([]);
  const hasShownModalRef = useRef(false);

  // Check URL parameter for cortesia success
  useEffect(() => {
    const cortesiaSuccessId = searchParams.get('cortesia_success');
    
    console.log('🎁 [CORTESIA DETECTION] Checking URL parameter:', cortesiaSuccessId);
    
    if (cortesiaSuccessId && !hasShownModalRef.current && orders && !loading) {
      console.log('🎁 [CORTESIA DETECTION] Found success parameter, searching for order...');
      const order = orders.find((o: any) => o.id === cortesiaSuccessId);
      
      if (order) {
        console.log('✅ [CORTESIA DETECTION] Order found, showing modal:', order);
        setOrderData(order);
        setShowModal(true);
        hasShownModalRef.current = true;
        
        // Remove the parameter from URL
        searchParams.delete('cortesia_success');
        setSearchParams(searchParams, { replace: true });
      } else {
        console.warn('⚠️ [CORTESIA DETECTION] Order not found in list:', cortesiaSuccessId);
      }
    }
  }, [searchParams, setSearchParams, orders, loading]);

  // Detect new 'ativo' orders (cortesia)
  useEffect(() => {
    if (!orders || loading || hasShownModalRef.current) return;

    console.log('🎁 [CORTESIA DETECTION] Checking for new active orders...');
    
    const activeOrders = orders.filter((order: any) => order.status === 'ativo');
    const currentOrderIds = activeOrders.map((order: any) => order.id);
    
    console.log('🎁 [CORTESIA DETECTION] Active orders:', activeOrders.length);
    console.log('🎁 [CORTESIA DETECTION] Previous orders:', previousOrdersRef.current.length);
    
    // Find new orders that weren't in the previous list
    const newActiveOrders = activeOrders.filter(
      (order: any) => !previousOrdersRef.current.includes(order.id)
    );

    // If there's a new active order and we've already loaded once (not initial load)
    if (newActiveOrders.length > 0 && previousOrdersRef.current.length > 0) {
      const latestOrder = newActiveOrders[0];
      console.log('✅ [CORTESIA DETECTION] New active order detected, showing modal:', latestOrder);
      setOrderData(latestOrder);
      setShowModal(true);
      hasShownModalRef.current = true;
    }

    // Update the ref with current order IDs
    previousOrdersRef.current = currentOrderIds;
  }, [orders, loading]);

  const closeModal = () => {
    setShowModal(false);
    setOrderData(null);
  };

  return {
    showModal,
    orderData,
    closeModal
  };
};
