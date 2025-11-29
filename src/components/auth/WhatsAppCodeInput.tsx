import React from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from '@/lib/utils';

interface WhatsAppCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const WhatsAppCodeInput: React.FC<WhatsAppCodeInputProps> = ({
  value,
  onChange,
  disabled = false,
  className
}) => {
  return (
    <div className={cn("flex justify-center", className)}>
      <InputOTP 
        maxLength={6} 
        value={value} 
        onChange={onChange}
        disabled={disabled}
      >
        <InputOTPGroup className="gap-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot
              key={index}
              index={index}
              className={cn(
                "w-12 h-14 text-2xl font-semibold rounded-xl border-2",
                "transition-all duration-200",
                "border-gray-200 focus:border-[#9C1E1E] focus:ring-2 focus:ring-[#9C1E1E]/20",
                "data-[active=true]:border-[#9C1E1E] data-[active=true]:ring-2 data-[active=true]:ring-[#9C1E1E]/20",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
};
