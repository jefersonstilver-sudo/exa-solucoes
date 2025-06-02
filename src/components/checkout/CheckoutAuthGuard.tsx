
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CheckoutAuthGuardProps {
  isLoggedIn: boolean;
  isSessionLoading: boolean;
  userId?: string;
  children: React.ReactNode;
}

const CheckoutAuthGuard: React.FC<CheckoutAuthGuardProps> = ({
  isLoggedIn,
  isSessionLoading,
  userId,
  children
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      toast.error("Você precisa estar logado para continuar");
      navigate('/login?redirect=/checkout');
    }
  }, [isLoggedIn, isSessionLoading, navigate]);

  if (isSessionLoading) {
    return null;
  }

  if (!isLoggedIn || !userId) {
    return null;
  }

  return <>{children}</>;
};

export default CheckoutAuthGuard;
