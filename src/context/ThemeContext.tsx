import { colorScheme } from 'nativewind';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';

export interface ThemeColors {
  bgPrimary: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
  inputBg: string;
  headerBg: string;
}

export const lightColors: ThemeColors = {
  bgPrimary: '#F8FAFC',
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  borderColor: '#E2E8F0',
  inputBg: '#F1F5F9',
  headerBg: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  bgPrimary: '#0F172A',
  cardBg: '#1E293B',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  borderColor: '#334155',
  inputBg: '#0F172A',
  headerBg: '#1E293B',
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    colorScheme.set(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      <View className={`flex-1 ${isDarkMode ? 'dark' : ''}`}>{children}</View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
