
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CouponStepProps {
  couponCode: string;
  setCouponCode: (code: string) => void;
  validateCoupon: () => Promise<void>;
  isValidatingCoupon: boolean;
  couponMessage: string;
  couponValid: boolean;
}

const CouponStep: React.FC<CouponStepProps> = ({ 
  couponCode, 
  setCouponCode, 
  validateCoupon, 
  isValidatingCoupon, 
  couponMessage, 
  couponValid 
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Cupom de desconto</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div>
            <Label htmlFor="coupon">Cupom</Label>
            <Input
              id="coupon"
              placeholder="Digite seu cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="pt-6">
            <Button 
              onClick={validateCoupon}
              disabled={isValidatingCoupon || !couponCode.trim()}
            >
              {isValidatingCoupon ? "Validando..." : "Aplicar"}
            </Button>
          </div>
        </div>
        
        {couponMessage && (
          <div className={`text-sm p-2 rounded ${couponValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {couponMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponStep;
