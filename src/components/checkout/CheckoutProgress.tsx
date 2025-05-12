
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface CheckoutProgressProps {
  currentStep: number;
}

const CheckoutProgress = ({ currentStep }: CheckoutProgressProps) => {
  const steps = [
    { name: "Revisão", description: "Revisar itens" },
    { name: "Plano", description: "Escolher plano" },
    { name: "Cupom", description: "Aplicar cupom" },
    { name: "Pagamento", description: "Finalizar compra" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={index} className="relative flex flex-col items-center">
            {/* Circle with step number or check icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ 
                scale: currentStep >= index ? 1 : 0.8,
                opacity: currentStep >= index ? 1 : 0.5
              }}
              transition={{ duration: 0.3 }}
              className={`flex items-center justify-center rounded-full border-2 h-10 w-10 
                ${currentStep > index 
                  ? "bg-indexa-purple text-white border-indexa-purple" 
                  : currentStep === index 
                    ? "bg-white text-indexa-purple border-indexa-purple" 
                    : "bg-white text-gray-300 border-gray-300"}`}
            >
              {currentStep > index ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </motion.div>
            
            {/* Step name */}
            <div className="mt-2 text-center">
              <p className={`text-sm font-medium mb-0.5 
                ${currentStep >= index ? "text-indexa-purple" : "text-gray-400"}`}>
                {step.name}
              </p>
              <p className={`text-[11px] 
                ${currentStep >= index ? "text-gray-600" : "text-gray-400"}`}>
                {step.description}
              </p>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="hidden sm:block absolute top-5 left-10 w-full h-[2px] -z-10">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: currentStep > index ? "100%" : "0%",
                    backgroundColor: currentStep > index ? "#4A0968" : "#E5E7EB"
                  }}
                  className="h-full bg-gray-300"
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckoutProgress;
