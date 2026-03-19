import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigationService } from './NavigationService';

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    navigationService.setNavigate(navigate);
  }, [navigate]);

  return <>{children}</>;
};