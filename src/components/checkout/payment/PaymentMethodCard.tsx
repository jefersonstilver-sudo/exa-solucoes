
import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Landmark, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PaymentMethodCardProps {
  id: string;
  title: string;
  description: string;
  originalAmount: number;
  finalAmount: number;
  discount?: number;
  icon: 'pix' | 'credit_card';
  selected: boolean;
  onSelect: (id: string) => void;
  highlight?: boolean;
}

const PaymentMethodCard = ({
  id,
  title,
  description,
  originalAmount,
  finalAmount,
  discount,
  icon,
  selected,
  onSelect,
  highlight = false
}: PaymentMethodCardProps) => {
  const IconComponent = icon === 'pix' ? Landmark : CreditCard;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`
          cursor-pointer transition-all duration-300 border-2
          ${selected 
            ? 'border-[#1E1B4B] bg-blue-50 shadow-lg' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
          ${highlight ? 'ring-2 ring-green-500 ring-opacity-20' : ''}
        `}
        onClick={() => onSelect(id)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon */}
              <div className={`
                p-3 rounded-full
                ${icon === 'pix' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-blue-100 text-blue-600'
                }
              `}>
                {icon === 'pix' ? (
                  <svg 
                    viewBox="0 0 512 512" 
                    className="h-6 w-6" 
                    fill="currentColor"
                  >
                    <path d="M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 294.4C300.7 284.5 300.7 268.5 310.6 258.6L407.7 161.5H392.6C372.6 161.5 353.7 169.3 339.5 183.5L262.5 260.5C257.1 265.9 247.8 265.9 242.4 260.5L165.4 183.5C151.2 169.3 132.3 161.5 112.3 161.5H97.2L194.3 258.6C204.2 268.5 204.2 284.5 194.3 294.4L97.2 391.5H112.3C132.3 391.5 151.2 383.7 165.4 369.5L242.4 292.5z"/>
                  </svg>
                ) : (
                  <CreditCard className="h-6 w-6" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                  {highlight && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      DESCONTO
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{description}</p>
                
                {discount && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    {discount}% de desconto
                  </p>
                )}
              </div>
            </div>
            
            {/* Price and selection */}
            <div className="text-right flex items-center space-x-4">
              <div>
                {discount && (
                  <p className="text-sm text-gray-400 line-through">
                    R$ {originalAmount.toFixed(2)}
                  </p>
                )}
                <p className={`text-lg font-bold ${
                  discount ? 'text-green-600' : 'text-gray-900'
                }`}>
                  R$ {finalAmount.toFixed(2)}
                </p>
              </div>
              
              {/* Selection indicator */}
              <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${selected 
                  ? 'border-[#1E1B4B] bg-[#1E1B4B]' 
                  : 'border-gray-300'
                }
              `}>
                {selected && <Check className="h-4 w-4 text-white" />}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PaymentMethodCard;
