import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const [loginMode, setLoginMode] = useState<'email' | 'link'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, getTaskOwnerByLinkCode } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLoginEmail = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (error: any) {
      console.error('Erro no login:', error);
      let message = 'Falha ao realizar login. Verifique suas credenciais.';
      if (error.code === 'auth/invalid-email') {
        message = 'Endereço de e-mail inválido.';
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        message = 'E-mail ou senha incorretos.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas malsucedidas. Tente novamente mais tarde.';
      }
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginLink = async () => {
    if (!linkCode.trim()) {
      setErrorMessage('Por favor, digite o código do link.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const cleanCode = linkCode.trim();
      const result = await getTaskOwnerByLinkCode(cleanCode);

      if (!result) {
        setErrorMessage('Código de link não encontrado. Verifique e tente novamente.');
        setIsSubmitting(false);
        return;
      }

      router.push(`/link/${cleanCode}` as any);
    } catch (error) {
      console.error('Erro ao acessar por código de link:', error);
      setErrorMessage('Erro ao conectar ao servidor do link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={isDarkMode
            ? require('../../assets/images/logo_black.png')
            : require('../../assets/images/logo_white.png')}
          className="self-center mb-4"
          style={{ width: 180, height: 90 }}
          resizeMode="contain"
        />
        <View className="items-end mb-3">
          <TouchableOpacity
            className="bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-full"
            onPress={toggleTheme}
          >
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {isDarkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          className="rounded-2xl p-6 shadow-md border"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
        >
          <View className="mb-5 items-center">
            <Text className="text-xs text-center" style={{ color: colors.textSecondary }}>
              Escolha como deseja se conectar ao sistema
            </Text>
          </View>

          {/* Login Mode Selector Tabs */}
          <View className="flex-row bg-slate-200 dark:bg-slate-700 p-1 rounded-xl mb-5">
            <TouchableOpacity
              className={`flex-1 py-2.5 items-center rounded-lg ${loginMode === 'email' ? 'bg-white dark:bg-slate-800' : ''}`}
              onPress={() => {
                setLoginMode('email');
                setErrorMessage('');
              }}
            >
              <Text className={`text-xs font-semibold ${loginMode === 'email' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'}`}>
                📧 E-mail e Senha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-2.5 items-center rounded-lg ${loginMode === 'link' ? 'bg-white dark:bg-slate-800' : ''}`}
              onPress={() => {
                setLoginMode('link');
                setErrorMessage('');
              }}
            >
              <Text className={`text-xs font-semibold ${loginMode === 'link' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500'}`}>
                🔗 Código do Link
              </Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
              <Text className="text-red-600 text-sm text-center">⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          {loginMode === 'email' ? (
            <View>
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                  E-mail
                </Text>
                <TextInput
                  className="rounded-xl px-3.5 py-3 text-sm border"
                  style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                  placeholder="seu@email.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                  Senha
                </Text>
                <TextInput
                  className="rounded-xl px-3.5 py-3 text-sm border"
                  style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                  placeholder="Sua senha"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                className={`bg-blue-600 rounded-xl py-3.5 items-center mt-2 ${isSubmitting ? 'bg-blue-300' : ''}`}
                onPress={handleLoginEmail}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-bold">Entrar com Conta</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row justify-center mt-5">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Ainda não tem uma conta? </Text>
                <Link href={"/(auth)/register" as any} className="text-blue-600 text-sm font-bold">
                  Cadastre-se
                </Link>
              </View>
            </View>
          ) : (
            <View>
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
                  Código do Link
                </Text>
                <TextInput
                  className="rounded-xl px-3.5 py-3 text-sm border"
                  style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                  placeholder="Digite seu código de link (Ex: abc123_l1)"
                  placeholderTextColor="#94A3B8"
                  value={linkCode}
                  onChangeText={setLinkCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                className={`bg-green-600 rounded-xl py-3.5 items-center mt-2 ${isSubmitting ? 'bg-green-300' : ''}`}
                onPress={handleLoginLink}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-base font-bold">🚀 Acessar pelo Link</Text>
                )}
              </TouchableOpacity>

              <Text className="text-xs text-slate-500 text-center mt-3.5 leading-5">
                Ao entrar pelo código do link, você acessa diretamente as tarefas atribuídas àquele link neste celular.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
