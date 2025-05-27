
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useLoginForm } from '@/components/auth/hooks/useLoginForm';
import { LoginFormFields } from '@/components/auth/LoginFormFields';
import { LoginFormActions } from '@/components/auth/LoginFormActions';

interface LoginFormProps {
  redirectPath: string;
  setIsResetMode: (isResetMode: boolean) => void;
}

export const LoginForm: React.FC<LoginFormProps> = memo(({ redirectPath, setIsResetMode }) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit
  } = useLoginForm(redirectPath);

  const handleQuickLogin = () => {
    // Quick login functionality can be implemented here
    console.log('Quick login not implemented yet');
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <LoginFormFields
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        error={error}
        setIsResetMode={setIsResetMode}
      />
      
      <LoginFormActions
        isLoading={isLoading}
        onQuickLogin={handleQuickLogin}
      />
    </motion.form>
  );
});

LoginForm.displayName = 'LoginForm';
