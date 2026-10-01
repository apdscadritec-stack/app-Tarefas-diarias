import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Painel Principal' }} />
      <Stack.Screen name="blocked" options={{ title: 'Acesso Expirado' }} />
    </Stack>
  );
}
