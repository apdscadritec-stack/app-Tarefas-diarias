import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import '../global.css';

function InitialLayout() {
  const { user, loading, subscriptionLoading, isExpired } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || subscriptionLoading) return;

    const routePath = segments.join('/');
    const inAuthGroup = routePath.startsWith('(auth)');
    const isSharedLink = routePath.startsWith('link');
    const isBlockedScreen = routePath.includes('blocked');

    if (isSharedLink) return;

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login' as any);
      }
    } else {
      if (isExpired) {
        if (!isBlockedScreen) {
          router.replace('/(app)/blocked' as any);
        }
      } else {
        if (inAuthGroup || isBlockedScreen) {
          router.replace('/(app)' as any);
        }
      }
    }
  }, [user, loading, subscriptionLoading, isExpired, segments]);

  if (loading || subscriptionLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.bgPrimary }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text
          className="mt-3 text-base font-medium"
          style={{ color: colors.textSecondary }}
        >
          Carregando sistema...
        </Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
