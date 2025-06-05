
import { usePaymentOrderCreator } from './usePaymentOrderCreator';
import { usePaymentProcessor } from './usePaymentProcessor';
import { useOrderStorage } from './useOrderStorage';
import { useCampaignCreator } from './useCampaignCreator';

export const useOrderCreation = () => {
  const { createPaymentOrder } = usePaymentOrderCreator();
  const { processPaymentWithEdgeFunction } = usePaymentProcessor();
  const { storeCheckoutInfo } = useOrderStorage();
  const { createCampaignsAfterPayment } = useCampaignCreator();

  return {
    createPaymentOrder,
    processPaymentWithEdgeFunction,
    storeCheckoutInfo,
    createCampaignsAfterPayment
  };
};
