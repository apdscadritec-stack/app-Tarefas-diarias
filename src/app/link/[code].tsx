import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../config/firebase';
import { useAuth, UserData, UserLink } from '../../context/AuthContext';

interface Task {
  id: string;
  title: string;
  date: string;
  color?: string;
  icon?: string;
  linkId?: string;
  linkName?: string;
  status: 'Aguardando' | 'Concluida';
}

export default function SharedLinkScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { getTaskOwnerByLinkCode, toggleDeviceBlock } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState<UserData | null>(null);
  const [targetLink, setTargetLink] = useState<UserLink | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isBlockingAction, setIsBlockingAction] = useState(false);

  useEffect(() => {
    if (!code) return;

    let unsubscribeTasks: (() => void) | null = null;
    let unsubscribeOwner: (() => void) | null = null;

    const fetchOwnerAndTasks = async () => {
      setLoading(true);
      setErrorMsg('');

      try {
        const result = await getTaskOwnerByLinkCode(code);
        if (!result) {
          setErrorMsg('Link não encontrado ou expirado.');
          setLoading(false);
          return;
        }

        setOwnerData(result.userData);
        setTargetLink(result.targetLink);

        // Listen for user profile & targetLink changes (including device block state)
        const userDocRef = doc(db, 'users', result.userData.uid);
        unsubscribeOwner = onSnapshot(userDocRef, (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data() as UserData;
            setOwnerData(data);
            const updatedLink = (data.userLinks || []).find((l) => l.code === code);
            if (updatedLink) {
              setTargetLink(updatedLink);
            }
          }
        });

        // Listen for tasks assigned to this linkId
        const tasksRef = collection(db, 'users', result.userData.uid, 'tasks');
        const q = query(tasksRef, where('linkId', '==', result.targetLink.id));

        unsubscribeTasks = onSnapshot(q, (snapshot) => {
          const loadedTasks: Task[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            title: docSnap.data().title,
            date: docSnap.data().date,
            color: docSnap.data().color,
            icon: docSnap.data().icon,
            linkId: docSnap.data().linkId,
            linkName: docSnap.data().linkName,
            status: docSnap.data().status || (docSnap.data().completed ? 'Concluida' : 'Aguardando'),
          }));
          setTasks(loadedTasks);
          setLoading(false);
        });
      } catch (err) {
        console.error('Erro ao carregar link:', err);
        setErrorMsg('Erro ao conectar ao servidor.');
        setLoading(false);
      }
    };

    fetchOwnerAndTasks();

    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeOwner) unsubscribeOwner();
    };
  }, [code]);

  // Task Completion Calculations
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'Concluida').length;
  const pendingCount = tasks.filter((t) => t.status === 'Aguardando').length;
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const handleToggleTaskStatus = async (task: Task) => {
    if (!ownerData?.uid) return;
    const newStatus = task.status === 'Concluida' ? 'Aguardando' : 'Concluida';

    try {
      const taskRef = doc(db, 'users', ownerData.uid, 'tasks', task.id);
      await updateDoc(taskRef, {
        status: newStatus,
        completed: newStatus === 'Concluida',
      });
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err);
      Alert.alert('Erro', 'Não foi possível atualizar o status da tarefa.');
    }
  };

  const handleLockDevice = async () => {
    if (!ownerData || !targetLink) return;

    // Rule Check: If 75% or more of tasks are completed, blocking is NOT allowed!
    if (completionRate >= 75) {
      Alert.alert(
        'Bloqueio Não Permitido 🚫',
        `Não é possível realizar o bloqueio do celular pois ${completionRate.toFixed(0)}% das tarefas já estão concluídas (máximo permitido para bloqueio: < 75%).`
      );
      return;
    }

    if (pendingCount === 0) {
      Alert.alert(
        'Bloqueio Não Permitido ℹ️',
        'O bloqueio requer que haja tarefas com o status "Aguardando".'
      );
      return;
    }

    setIsBlockingAction(true);
    try {
      await toggleDeviceBlock(ownerData.uid, targetLink.id, true);
      Alert.alert('Dispositivo Bloqueado 🔒', 'O celular foi bloqueado com sucesso.');
    } catch (err) {
      console.error('Erro ao bloquear dispositivo:', err);
      Alert.alert('Erro', 'Não foi possível efetuar o bloqueio do celular.');
    } finally {
      setIsBlockingAction(false);
    }
  };

  const handleLoginAsOwner = () => {
    router.replace('/(auth)/login' as any);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-3 text-[15px] text-slate-500">Carregando link de tarefas...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg || !ownerData || !targetLink) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 p-4">
        <View className="bg-white rounded-2xl p-6 items-center mt-10">
          <Text className="text-[40px] mb-3">⚠️</Text>
          <Text className="text-xl font-bold text-slate-900 mb-2">Link Inválido</Text>
          <Text className="text-sm text-slate-500 text-center mb-4">{errorMsg || 'Não foi possível carregar as tarefas.'}</Text>
          <TouchableOpacity className="bg-blue-600 px-4 py-2.5 rounded-lg" onPress={handleLoginAsOwner}>
            <Text className="text-white font-semibold">Ir para Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Device Blocked Overlay
  if (targetLink.isDeviceBlocked) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center p-6">
        <View className="bg-slate-800 rounded-3xl p-8 items-center border border-slate-700 w-full">
          <Text className="text-[56px] mb-4">🔒</Text>
          <Text className="text-2xl font-bold text-slate-50 mb-3">Celular Bloqueado</Text>
          <Text className="text-[15px] text-slate-400 text-center leading-[22px] mb-5">
            Este celular foi bloqueado através do sistema por possuir tarefas pendentes.
          </Text>
          <View className="bg-slate-900 rounded-xl p-3.5 w-full items-center border border-slate-700">
            <Text className="text-blue-400 text-[13px] font-bold mb-1.5">
              📊 Progresso Atual das Tarefas: {completionRate.toFixed(0)}% concluídas ({completedCount}/{totalTasks})
            </Text>
            <Text className="text-slate-500 text-xs text-center">
              O bloqueio só pode ser removido pelo aplicativo principal.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View className="flex-1 p-4">
        {/* Header with Logo, Assigned Person & Lock Button */}
        <View className="bg-white rounded-2xl p-3.5 mb-2.5 border border-slate-200 flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <Text className="text-[28px] mr-2.5">{targetLink.logo || '🏢'}</Text>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900">{targetLink.name}</Text>
              {targetLink.assignedPersonName ? (
                <Text className="text-xs text-blue-600 mt-0.5">
                  👤 Atribuído a: <Text style={{ fontWeight: '700' }}>{targetLink.assignedPersonName}</Text>
                </Text>
              ) : (
                <Text className="text-xs text-slate-500 mt-0.5">Cadastro: {ownerData.name}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            className={`px-2.5 py-2 rounded-lg ${completionRate >= 75 ? 'bg-slate-400' : 'bg-red-600'}`}
            onPress={handleLockDevice}
            disabled={isBlockingAction}
          >
            <Text className="text-white font-bold text-xs">🔒 Bloquear Celular</Text>
          </TouchableOpacity>
        </View>

        {/* Progress & Validation Stats Bar */}
        <View className="bg-white rounded-xl p-3 mb-3 border border-slate-200">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-xs font-semibold text-slate-600">Progresso de Conclusão:</Text>
            <Text className="text-xs font-bold text-slate-900">{completionRate.toFixed(0)}% ({completedCount}/{totalTasks})</Text>
          </View>

          <View className="h-2 bg-slate-200 rounded overflow-hidden mb-1.5">
            <View
              className={`h-full rounded ${completionRate >= 75 ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${Math.min(100, completionRate)}%` }}
            />
          </View>

          <Text className="text-[11px] text-slate-500 font-medium">
            {completionRate >= 75
              ? '🚫 Bloqueio desativado (75% ou mais das tarefas concluídas).'
              : `✅ Bloqueio permitido (${pendingCount} ${pendingCount === 1 ? 'tarefa aguardando' : 'tarefas aguardando'}).`}
          </Text>
        </View>

        <View className="mb-2.5">
          <Text className="text-base font-bold text-slate-800">Tarefas Atribuídas ({tasks.length})</Text>
        </View>

        {/* Task List */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20, gap: 10 }}
          renderItem={({ item }) => {
            const cardBg = item.color || '#3B82F6';
            const isCompleted = item.status === 'Concluida';

            return (
              <View className="bg-white rounded-xl p-3.5 border-l-[6px] border border-slate-100 shadow-sm" style={{ borderLeftColor: cardBg }}>
                <View className="flex-row items-start mb-2.5">
                  <View className="flex-row items-center flex-1">
                    <Text className="text-[26px] mr-2.5">{item.icon || '📝'}</Text>
                    <View className="flex-1">
                      <Text className={`text-[15px] font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {item.title}
                      </Text>
                      <Text className="text-xs text-slate-500 mt-0.5">📅 Data: {item.date}</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row justify-between items-center pt-2 border-t border-slate-50">
                  <View className={`px-2.5 py-1 rounded-md ${isCompleted ? 'bg-green-100' : 'bg-amber-100'}`}>
                    <Text
                      className={`text-xs font-bold ${isCompleted ? 'text-green-700' : 'text-amber-700'}`}
                    >
                      {isCompleted ? '✓ Concluída' : '⏳ Aguardando'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    className={`px-3 py-2 rounded-lg ${isCompleted ? 'bg-slate-200' : 'bg-green-600'}`}
                    onPress={() => handleToggleTaskStatus(item)}
                  >
                    <Text className="text-white font-bold text-[13px]">
                      {isCompleted ? 'Marcar como Aguardando' : '✓ Marcar Concluída'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="bg-white rounded-xl p-8 items-center">
              <Text className="text-4xl mb-2">📭</Text>
              <Text className="text-sm text-slate-400">Nenhuma tarefa atribuída a este link.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

