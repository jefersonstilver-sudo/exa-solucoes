
import React from 'react';
import { QRCodeDisplay } from './QRCodeDisplay';
import PixCodeCopyField from './PixCodeCopyField';
import PixCountdownTimer from './PixCountdownTimer';
import PaymentStatusBadge from './PaymentStatusBadge';
import RefreshStatusButton from './RefreshStatusButton';

interface PixActiveStateProps {
  qrCodeBase64: string;
  qrCodeText?: string;
  status: string;
  isRefreshing: boolean;
  onRefreshStatus: () => Promise<void>;
  onQrExpiration: () => void;
  createdAt?: string;
}

const PixActiveState = ({ 
  qrCodeBase64,
  qrCodeText,
  status,
  isRefreshing,
  onRefreshStatus,
  onQrExpiration,
  createdAt
}: PixActiveStateProps) => {
  // QR Code expiration time (10 minutes = 600 seconds)
  const QR_EXPIRATION_TIME = 600;
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <PaymentStatusBadge status={status} />
      
      {/* Timer só aparece para pagamentos pendentes */}
      {status === 'pending' && (
        <div className="w-full">
          <PixCountdownTimer
            initialSeconds={QR_EXPIRATION_TIME}
            onExpire={onQrExpiration}
            isActive={status === 'pending'}
            paymentStatus={status}
            createdAt={createdAt}
          />
        </div>
      )}
      
      {qrCodeBase64 && (
        <div className="flex flex-col items-center">
          <QRCodeDisplay qrCodeBase64={qrCodeBase64} />
        </div>
      )}
      
      {qrCodeText && (
        <div className="mt-4 w-full">
          <PixCodeCopyField code={qrCodeText} />
        </div>
      )}
      
      <RefreshStatusButton
        onClick={onRefreshStatus}
        isRefreshing={isRefreshing}
        status={status}
        className="mt-4"
      />
    </div>
  );
};

export default PixActiveState;
