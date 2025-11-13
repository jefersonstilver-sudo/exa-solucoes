
import { usePaymentOrderCreator } from './usePaymentOrderCreator';
import { useOrderStorage } from './useOrderStorage';
import { useCampaignCreator } from './useCampaignCreator';

export const useOrderCreation = () => {
  const { createPaymentOrder } = usePaymentOrderCreator();
  const { storeCheckoutInfo } = useOrderStorage();
  const { createCampaignsAfterPayment } = useCampaignCreator();

  return {
    createPaymentOrder,
    storeCheckoutInfo,
    createCampaignsAfterPayment
  };
};
