import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { register } = useAuth();
  const { colors } = useTheme();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await register(name.trim(), email.trim(), password);
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      let message = 'Falha ao criar conta. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Endereço de e-mail inválido.';
      } else if (error.code === 'auth/weak-password') {
        message = 'A senha é muito fraca.';
      }
      setErrorMessage(message);
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
        <View
          className="rounded-2xl p-6 shadow-md border"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
        >
          <View className="mb-6 items-center">
            <Text className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
              Criar Conta
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Ganhe 30 dias de teste grátis
            </Text>
          </View>

          {errorMessage ? (
            <View className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4">
              <Text className="text-red-600 text-sm text-center">⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
              Nome Completo
            </Text>
            <TextInput
              className="rounded-xl px-3.5 py-3 text-sm border"
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
              placeholder="Seu nome"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

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
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold mb-1.5" style={{ color: colors.textPrimary }}>
              Confirmar Senha
            </Text>
            <TextInput
              className="rounded-xl px-3.5 py-3 text-sm border"
              style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
              placeholder="Repita sua senha"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`bg-green-600 rounded-xl py-3.5 items-center mt-2 ${isSubmitting ? 'bg-green-300' : ''}`}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-bold">Cadastrar</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-5">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>Já possui uma conta? </Text>
            <Link href={"/(auth)/login" as any} className="text-blue-600 text-sm font-bold">
              Faça login
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
