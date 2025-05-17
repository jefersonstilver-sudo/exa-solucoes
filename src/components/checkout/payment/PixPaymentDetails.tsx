
import { motion } from 'framer-motion';
import QRCodeDisplay from './QRCodeDisplay';
import PixCodeCopyField from './PixCodeCopyField';
import PaymentStatusBadge from './PaymentStatusBadge';
import RefreshStatusButton from './RefreshStatusButton';

interface PixPaymentDetailsProps {
  qrCodeBase64: string;
  qrCodeText: string;
  status: string;
  paymentId: string;
  onRefreshStatus: () => Promise<void>;
}

const PixPaymentDetails = ({
  qrCodeBase64,
  qrCodeText,
  status,
  paymentId,
  onRefreshStatus
}: PixPaymentDetailsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center space-y-6 p-4 border rounded-lg bg-white shadow-sm"
    >
      {/* Payment Status */}
      <PaymentStatusBadge status={status} />
      
      {/* QR Code */}
      <QRCodeDisplay qrCodeBase64={qrCodeBase64} />
      
      {/* PIX Copy Code */}
      <PixCodeCopyField qrCodeText={qrCodeText} />
      
      {/* Refresh button */}
      <RefreshStatusButton status={status} onRefresh={onRefreshStatus} />
    </motion.div>
  );
};

export default PixPaymentDetails;
