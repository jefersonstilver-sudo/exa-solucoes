
import { ReactNode } from "react";

interface PaymentInfoBoxProps {
  variant: 'info' | 'warning' | 'security';
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

const PaymentInfoBox = ({ variant, icon, title, children }: PaymentInfoBoxProps) => {
  const variantStyles = {
    info: "bg-blue-50 border-blue-100 text-blue-800",
    warning: "bg-orange-50 border-orange-100 text-orange-800",
    security: "bg-white border-gray-200 text-gray-800"
  };
  
  const iconClass = {
    info: "text-blue-500",
    warning: "text-orange-500",
    security: "text-gray-500"
  };

  return (
    <div className={`border rounded-lg p-4 ${variantStyles[variant]}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={`h-5 w-5 ${iconClass[variant]}`}>{icon}</div>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">
            {title}
          </h3>
          <div className="mt-2 text-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoBox;
