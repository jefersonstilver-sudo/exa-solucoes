import React from 'react';
import { useAuth } from '@/hooks/useAuth';
const DashboardGreeting: React.FC = () => {
  const {
    userProfile
  } = useAuth();
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  };
  const getUserName = (): string => {
    // Try nome first, then name, then email prefix
    if (userProfile?.nome) {
      return userProfile.nome.split(' ')[0];
    }
    if (userProfile?.name) {
      return userProfile.name.split(' ')[0];
    }
    if (userProfile?.email) {
      return userProfile.email.split('@')[0];
    }
    return 'Admin';
  };
  return <div className="mb-2 md:hidden">
      <h1 className="text-xl font-bold text-gray-900">
        {getGreeting()}, <span className="text-[hsl(var(--exa-red))]">{getUserName()}</span> 👋
      </h1>
    </div>;
};
export default DashboardGreeting;