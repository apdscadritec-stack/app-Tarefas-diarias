import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CardDetails, createStripeToken } from '../config/stripe';

interface StripeCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccessPayment: (stripeTokenId: string) => Promise<void>;
  amountText?: string;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  visible,
  onClose,
  onSuccessPayment,
  amountText = 'R$ 49,90',
}) => {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState(''); // MM/YY
  const [cvc, setCvc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const matches = cleaned.match(/.{1,4}/g);
    return matches ? matches.join(' ') : cleaned;
  };

  const formatExpDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    setCardNumber(formatCardNumber(text));
  };

  const handleExpDateChange = (text: string) => {
    setExpDate(formatExpDate(text));
  };

  const handleProcessPayment = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!cardName.trim()) {
      setErrorMessage('Por favor, digite o nome impresso no cartão.');
      return;
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 13) {
      setErrorMessage('Número do cartão inválido.');
      return;
    }

    const expParts = expDate.split('/');
    if (expParts.length !== 2 || !expParts[0] || !expParts[1]) {
      setErrorMessage('Informe a data de validade no formato MM/AA.');
      return;
    }

    if (!cvc.trim() || cvc.trim().length < 3) {
      setErrorMessage('Informe o código CVC de 3 ou 4 dígitos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cardPayload: CardDetails = {
        name: cardName.trim(),
        number: cleanCard,
        expMonth: expParts[0].trim(),
        expYear: expParts[1].trim(),
        cvc: cvc.trim(),
      };

      // Create Stripe Token via official Stripe API
      const result = await createStripeToken(cardPayload);

      if (!result.success || !result.tokenId) {
        setErrorMessage(result.error || 'Erro ao validar cartão na Stripe.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Pagamento autorizado na Stripe! Ativando assinatura...');

      // Notify parent context to update Firestore isPaid = true
      await onSuccessPayment(result.tokenId);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro no checkout Stripe:', err);
      setErrorMessage('Erro ao processar pagamento com a Stripe.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-slate-900/60 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="bg-white rounded-t-3xl p-5 max-h-[90%]">
          <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <View className="flex-row items-center gap-2">
              <Text className="text-xl font-black italic text-[#635BFF]">stripe</Text>
              <Text className="text-lg font-bold text-slate-900">Checkout de Assinatura</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1.5">
              <Text className="text-lg text-slate-500 font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="pb-6" keyboardShouldPersistTaps="handled">
            {/* Price Summary Card */}
            <View className="bg-slate-50 rounded-xl p-4 flex-row justify-between items-center mb-4 border border-slate-200">
              <View>
                <Text className="text-[15px] font-bold text-slate-900">Plano Premium Tarefas Diárias</Text>
                <Text className="text-xs text-slate-500 mt-0.5">Acesso total ilimitado a todos os recursos</Text>
              </View>
              <Text className="text-xl font-extrabold text-green-600">{amountText}</Text>
            </View>

            {errorMessage ? (
              <View className="bg-red-50 border border-red-300 p-3 rounded-lg mb-3.5">
                <Text className="text-red-600 text-[13px] font-semibold">⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View className="bg-green-50 border border-green-300 p-3 rounded-lg mb-3.5">
                <Text className="text-green-700 text-[13px] font-bold">✅ {successMessage}</Text>
              </View>
            ) : null}

            {/* Card Form */}
            <View className="mb-3.5">
              <Text className="text-[13px] font-semibold text-slate-700 mb-1.5">Nome no Cartão</Text>
              <TextInput
                className="bg-slate-50 rounded-lg px-3.5 py-3 text-[15px] text-slate-900 border border-slate-300"
                placeholder="Ex: JOAO S SILVA"
                placeholderTextColor="#94A3B8"
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="characters"
              />
            </View>

            <View className="mb-3.5">
              <Text className="text-[13px] font-semibold text-slate-700 mb-1.5">Número do Cartão</Text>
              <TextInput
                className="bg-slate-50 rounded-lg px-3.5 py-3 text-[15px] text-slate-900 border border-slate-300"
                placeholder="0000 0000 0000 0000"
                placeholderTextColor="#94A3B8"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 mb-3.5">
                <Text className="text-[13px] font-semibold text-slate-700 mb-1.5">Validade (MM/AA)</Text>
                <TextInput
                  className="bg-slate-50 rounded-lg px-3.5 py-3 text-[15px] text-slate-900 border border-slate-300"
                  placeholder="12/28"
                  placeholderTextColor="#94A3B8"
                  value={expDate}
                  onChangeText={handleExpDateChange}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View className="flex-1 mb-3.5">
                <Text className="text-[13px] font-semibold text-slate-700 mb-1.5">CVC</Text>
                <TextInput
                  className="bg-slate-50 rounded-lg px-3.5 py-3 text-[15px] text-slate-900 border border-slate-300"
                  placeholder="123"
                  placeholderTextColor="#94A3B8"
                  value={cvc}
                  onChangeText={setCvc}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>

            <View className="bg-slate-100 rounded-lg p-2.5 mb-4">
              <Text className="text-[11px] text-slate-500 text-center leading-4">
                🔒 Criptografia SSL de 256 bits. Seus dados de pagamento são transmitidos com total segurança via Stripe.
              </Text>
            </View>

            <TouchableOpacity
              className={`py-4 rounded-xl items-center ${isSubmitting ? 'bg-indigo-300' : 'bg-[#635BFF]'}`}
              onPress={handleProcessPayment}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-bold">💳 Pagar {amountText} com Stripe</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity className="mt-3 py-3 items-center" onPress={onClose} disabled={isSubmitting}>
              <Text className="text-slate-500 text-sm font-semibold">Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

