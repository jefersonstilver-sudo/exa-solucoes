
import { motion } from "framer-motion";
import React from "react";

interface PaymentInfoBoxProps {
  variant: "info" | "warning" | "success" | "error";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  highlighted?: boolean;
}

const PaymentInfoBox = ({
  variant,
  icon,
  title,
  children,
  highlighted = false
}: PaymentInfoBoxProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "info":
        return {
          bg: "bg-blue-50",
          border: "border-blue-100",
          title: "text-blue-800",
          icon: "bg-blue-100 text-blue-600",
        };
      case "warning":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-100",
          title: "text-yellow-800",
          icon: "bg-yellow-100 text-yellow-600",
        };
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-100",
          title: "text-green-800",
          icon: "bg-green-100 text-green-600",
        };
      case "error":
        return {
          bg: "bg-red-50",
          border: "border-red-100",
          title: "text-red-800",
          icon: "bg-red-100 text-red-600",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-100",
          title: "text-gray-800",
          icon: "bg-gray-100 text-gray-600",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        ${styles.bg} ${styles.border} border rounded-lg p-4
        ${highlighted ? "ring-2 ring-yellow-300" : ""}
      `}
    >
      <div className="flex">
        <div className={`flex-shrink-0 ${styles.icon} p-1.5 rounded-full`}>
          {icon}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
          <div className="mt-2 text-sm">{children}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentInfoBox;
