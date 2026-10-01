import { useState } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StripeCheckoutModal } from '../../components/StripeCheckoutModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';


export default function BlockedScreen() {
  const { userData, logout, processStripePayment } = useAuth();
  const { colors } = useTheme();
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleStripeSuccess = async (stripeTokenId: string) => {
    try {
      await processStripePayment(stripeTokenId);
      setFeedback('Pagamento confirmado via Stripe! Redirecionando...');
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      setFeedback('Erro ao registrar confirmação. Tente novamente.');
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgPrimary }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}>
        {/* Top Header */}
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
            {userData?.name || 'Usuário'}
          </Text>
          <TouchableOpacity onPress={logout} className="bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
            <Text className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Expiration Card */}
        <View
          className="rounded-3xl p-7 items-center shadow-lg border"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
        >
          <View className="w-18 h-18 rounded-full bg-red-100 justify-center items-center mb-4 p-4">
            <Text className="text-4xl">🔒</Text>
          </View>

          <Text className="text-2xl font-bold text-center mb-3" style={{ color: colors.textPrimary }}>
            Período de Teste Expirado
          </Text>

          <View className="bg-red-100 px-3.5 py-1.5 rounded-full mb-4">
            <Text className="text-red-800 text-xs font-bold">Status: Aguardando Pagamento</Text>
          </View>

          {/* Core User Message */}
          <Text className="text-sm text-center leading-6 mb-6" style={{ color: colors.textSecondary }}>
            Seus 30 dias de acesso gratuito terminaram. Para voltar a utilizar o aplicativo Tarefas Diárias e ter acesso total a todos os seus recursos, por favor efetue o pagamento da sua assinatura.
          </Text>

          {feedback ? (
            <View className="bg-green-50 border border-green-300 p-3 rounded-lg mb-4 w-full">
              <Text className="text-green-800 text-sm text-center font-semibold">{feedback}</Text>
            </View>
          ) : null}

          {/* Pay Button using Stripe */}
          <TouchableOpacity
            className="bg-indigo-600 w-full py-4 rounded-xl items-center shadow-md active:bg-indigo-700"
            onPress={() => setIsStripeModalOpen(true)}
            activeOpacity={0.85}
          >
            <Text className="text-white text-base font-bold">💳 Pagar R$ 29,90 com Stripe</Text>
          </TouchableOpacity>

          <Text className="text-xs text-slate-400 text-center mt-3.5">
            Pagamento 100% seguro processado via criptografia SSL do Stripe.
          </Text>
        </View>

        {/* Stripe Modal */}
        <StripeCheckoutModal
          visible={isStripeModalOpen}
          onClose={() => setIsStripeModalOpen(false)}
          onSuccessPayment={handleStripeSuccess}
          amountText="R$ 29,90"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
