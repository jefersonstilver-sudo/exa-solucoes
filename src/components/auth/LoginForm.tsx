
import React from 'react';
import { motion } from 'framer-motion';
import { useLoginForm } from './hooks/useLoginForm';
import { LoginFormFields } from './LoginFormFields';
import { LoginFormActions } from './LoginFormActions';

interface LoginFormProps {
  redirectPath: string;
  setIsResetMode: (value: boolean) => void;
}

export const LoginForm = ({ redirectPath, setIsResetMode }: LoginFormProps) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleLogin,
    setQuickLogin
  } = useLoginForm(redirectPath);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleLogin} className="space-y-4">
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
          onQuickLogin={setQuickLogin}
        />
      </form>
    </motion.div>
  );
};
