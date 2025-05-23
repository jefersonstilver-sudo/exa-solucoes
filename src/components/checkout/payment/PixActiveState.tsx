
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
}

const PixActiveState = ({ 
  qrCodeBase64,
  qrCodeText,
  status,
  isRefreshing,
  onRefreshStatus,
  onQrExpiration
}: PixActiveStateProps) => {
  // QR Code expiration time (5 minutes = 300 seconds)
  const QR_EXPIRATION_TIME = 300;
  
  return (
    <div className="flex flex-col items-center space-y-6">
      <PaymentStatusBadge status={status} />
      
      <div className="mt-4">
        <PixCountdownTimer
          initialSeconds={QR_EXPIRATION_TIME}
          onExpire={onQrExpiration}
          isActive={status !== 'approved'}
        />
      </div>
      
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
