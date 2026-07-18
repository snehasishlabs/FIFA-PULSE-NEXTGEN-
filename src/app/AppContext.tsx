import React, { createContext, useContext, useState, useTransition } from 'react';
import { useRealTimeData } from '../hooks/useRealTimeData';

type AppContextType = ReturnType<typeof useRealTimeData> & {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  textSize: 'normal' | 'large' | 'extra-large';
  setTextSize: (v: 'normal' | 'large' | 'extra-large') => void;
  activeTab: 'dashboard' | 'intelligence' | 'assistant' | 'simulator' | 'logistics' | 'accessibility' | 'notifications';
  setActiveTab: (tab: 'dashboard' | 'intelligence' | 'assistant' | 'simulator' | 'logistics' | 'accessibility' | 'notifications') => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const data = useRealTimeData();
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'extra-large'>('normal');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'intelligence' | 'assistant' | 'simulator' | 'logistics' | 'accessibility' | 'notifications'>('dashboard');

  const [, startTransition] = useTransition();

  const handleSetTab = (tab: typeof activeTab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  return (
    <AppContext.Provider value={{
      ...data,
      highContrast,
      setHighContrast,
      textSize,
      setTextSize,
      activeTab,
      setActiveTab: handleSetTab
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
