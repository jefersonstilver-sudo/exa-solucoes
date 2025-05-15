
import { ReactNode, useState } from "react";

interface PaymentInfoBoxProps {
  variant: 'info' | 'warning' | 'security';
  icon: ReactNode;
  title: string;
  children: ReactNode;
  highlighted?: boolean;
}

const PaymentInfoBox = ({ variant, icon, title, children, highlighted = false }: PaymentInfoBoxProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Cores mais suaves
  const variantStyles = {
    info: "bg-[#F1F0FB] border-[#D6BCFA] text-[#1A1F2C]", // Lilás suave
    warning: highlighted 
      ? "bg-yellow-50 border-yellow-200 text-yellow-800 shadow-md" 
      : "bg-orange-50 border-orange-100 text-orange-800",
    security: "bg-white border-gray-200 text-gray-800"
  };
  
  const iconClass = {
    info: "text-[#8E9196]", // Cinza neutro
    warning: highlighted ? "text-yellow-600" : "text-orange-500",
    security: "text-gray-500"
  };

  // Efeito de hover mais suave
  const getHoverClass = () => {
    if (variant === 'warning' && highlighted) {
      return "transform transition-transform duration-300 hover:scale-[1.01]";
    }
    return "";
  };

  return (
    <div 
      className={`
        border rounded-lg p-4 
        ${highlighted ? "animate-pulse" : ""} 
        ${variantStyles[variant]}
        ${getHoverClass()}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={`h-5 w-5 ${iconClass[variant]}`}>{icon}</div>
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${highlighted ? "font-bold" : ""}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${isHovered && highlighted ? "font-medium" : ""}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoBox;
