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
    
    if (cortesiaSuccessId && !hasShownModalRef.current && orders && !loading) {
      const order = orders.find((o: any) => o.id === cortesiaSuccessId);
      
      if (order) {
        setOrderData(order);
        setShowModal(true);
        hasShownModalRef.current = true;
        
        // Remove the parameter from URL
        searchParams.delete('cortesia_success');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams, orders, loading]);

  // Detect new 'ativo' orders (cortesia)
  useEffect(() => {
    if (!orders || loading || hasShownModalRef.current) return;

    const activeOrders = orders.filter((order: any) => order.status === 'ativo');
    const currentOrderIds = activeOrders.map((order: any) => order.id);
    
    // Find new orders that weren't in the previous list
    const newActiveOrders = activeOrders.filter(
      (order: any) => !previousOrdersRef.current.includes(order.id)
    );

    // If there's a new active order and we've already loaded once (not initial load)
    if (newActiveOrders.length > 0 && previousOrdersRef.current.length > 0) {
      const latestOrder = newActiveOrders[0];
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
