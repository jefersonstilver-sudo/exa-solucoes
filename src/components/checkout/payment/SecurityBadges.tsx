
import { Lock } from "lucide-react";

const SecurityBadges = () => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center mb-3">
        <Lock className="h-4 w-4 text-gray-500 mr-2" />
        <span className="text-sm font-medium">Ambiente 100% Seguro com Mercado Pago</span>
      </div>
      <div className="flex flex-wrap gap-3 items-center justify-center">
        <img 
          src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icon-1024.png" 
          alt="Mercado Pago" 
          className="h-8"
        />
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        <img 
          src="https://logosmarcas.net/wp-content/uploads/2020/09/Mastercard-Logo.png" 
          alt="Mastercard" 
          className="h-6"
        />
        <img 
          src="https://logodownload.org/wp-content/uploads/2016/10/visa-logo-1.png" 
          alt="Visa" 
          className="h-6"
        />
        <img 
          src="https://logosmarcas.net/wp-content/uploads/2020/09/American-Express-Logo.png" 
          alt="American Express" 
          className="h-6"
        />
      </div>
    </div>
  );
};

export default SecurityBadges;
