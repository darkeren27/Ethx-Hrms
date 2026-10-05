import React, { createContext, useContext, useState, useEffect } from 'react';
import { ERPNextCredentials } from '../types/auth';
import { frappeClient } from '../services/frappeClient';

interface ERPNextContextType {
  config: ERPNextCredentials;
  updateConfig: (newConfig: Partial<ERPNextCredentials>) => void;
  testConnection: () => Promise<{ success: boolean; message: string }>;
  isTesting: boolean;
}

const ERPNextContext = createContext<ERPNextContextType | undefined>(undefined);

export const ERPNextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ERPNextCredentials>(() => {
    const saved = localStorage.getItem('ethx_erpnext_config');
    return saved
      ? JSON.parse(saved)
      : {
          url: 'http://45.195.159.86:8280',
          username: 'Administrator',
          password: 'change-me-admin',
          connected: true,
          useMockFallback: true,
          version: 'Frappe v14 / ERPNext HRMS',
          siteName: 'ETHX Demo',
        };
  });

  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    localStorage.setItem('ethx_erpnext_config', JSON.stringify(config));
    frappeClient.setConfig(config);
  }, [config]);

  const updateConfig = (newConfig: Partial<ERPNextCredentials>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const res = await frappeClient.login(config.username || 'Administrator', config.password || 'change-me-admin');
      if (res.success) {
        updateConfig({ connected: true });
        setIsTesting(false);
        return { success: true, message: 'Successfully connected to Frappe / ERPNext server (http://45.195.159.86:8280)!' };
      }
      updateConfig({ connected: false });
      setIsTesting(false);
      return { success: false, message: 'Server reachable, but login failed. Using Enterprise Fallback mode.' };
    } catch {
      updateConfig({ connected: false });
      setIsTesting(false);
      return { success: false, message: 'Connection timed out. Operating in Offline Demo mode.' };
    }
  };

  return (
    <ERPNextContext.Provider value={{ config, updateConfig, testConnection, isTesting }}>
      {children}
    </ERPNextContext.Provider>
  );
};

export const useERPNext = () => {
  const context = useContext(ERPNextContext);
  if (!context) {
    throw new Error('useERPNext must be used within an ERPNextProvider');
  }
  return context;
};
