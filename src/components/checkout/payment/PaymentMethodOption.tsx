
import React, { useState } from "react";
import { formatCurrency } from '@/utils/priceUtils';

interface PaymentMethodProps {
  method: {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    installments?: boolean;
    totalValue: number;
    highlight?: boolean;
  };
  selectedMethod: string;
  onSelect: (method: string) => void;
  installments?: number;
  setInstallments?: (installments: number) => void;
  getInstallmentValue?: (installments: number) => number;
}

const PaymentMethodOption = ({ 
  method, 
  selectedMethod, 
  onSelect, 
  installments = 1,
  setInstallments,
  getInstallmentValue
}: PaymentMethodProps) => {
  const isSelected = method.id === selectedMethod;
  
  // Available installments
  const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <div 
      className={`
        border rounded-lg p-4 cursor-pointer transition-all 
        ${isSelected ? 
          'border-blue-500 bg-blue-50' : 
          'border-gray-200 hover:border-gray-300'
        }
        ${method.highlight && !isSelected ? 'border-green-300 bg-green-50' : ''}
      `}
      onClick={() => onSelect(method.id)}
    >
      <div className="flex items-center space-x-3">
        <div className={`
          w-5 h-5 rounded-full border flex items-center justify-center
          ${isSelected ? 'border-blue-500' : 'border-gray-300'}
        `}>
          {isSelected && <div className="w-3 h-3 rounded-full bg-blue-500"></div>}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-gray-600">{method.icon}</div>
          <span className="font-medium">{method.name}</span>
          {method.highlight && !isSelected && (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
              Recomendado
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-2 pl-8">
        <p className="text-sm text-gray-600">{method.description}</p>

        {/* Installments selection for credit card */}
        {method.installments && isSelected && setInstallments && getInstallmentValue && (
          <div className="mt-3 space-y-2">
            <label className="block text-sm text-gray-600">
              Parcelamento:
            </label>
            <select 
              className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
            >
              {installmentOptions.map((option) => (
                <option key={option} value={option}>
                  {option}x de {formatCurrency(getInstallmentValue(option) / option)}
                  {option > 1 && option < 4 ? ' (sem juros)' : option > 3 ? ` (${option}% a.m.)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* PIX discount highlight */}
        {method.id === 'pix' && isSelected && (
          <div className="mt-3 bg-green-50 border border-green-100 rounded-md p-2 text-sm text-green-700">
            Você economiza {formatCurrency(method.totalValue * 0.10)} pagando com PIX!
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodOption;
