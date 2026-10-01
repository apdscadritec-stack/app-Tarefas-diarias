/* eslint-disable react/no-unescaped-entities */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarView } from '../../components/CalendarView';
import { PeopleModal } from '../../components/PeopleModal';
import { TaskModal } from '../../components/TaskModal';
import { UserLinksModal } from '../../components/UserLinksModal';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export interface Task {
  id: string;
  title: string;
  date: string;
  color: string;
  icon: string;
  linkId: string;
  linkName: string;
  status: 'Aguardando' | 'Concluida';
  createdAt?: any;
}

export default function DashboardScreen() {
  const { 
    userData, 
    people,
    isPaid, 
    daysRemaining, 
    logout, 
    simulateTrialExpiry, 
    addPerson,
    updatePerson,
    deletePerson,
    updateLinkDetails 
  } = useAuth();
  
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const now = new Date();
  const todayFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const [selectedDate, setSelectedDate] = useState<string>(todayFormatted);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'Aguardando' | 'Concluida'>('todos');
  
  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTestingAction, setIsTestingAction] = useState(false);

  // Subscribe to user's tasks in Firestore
  useEffect(() => {
    if (!userData?.uid) return;

    const tasksRef = collection(db, 'users', userData.uid, 'tasks');
    const q = query(tasksRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList: Task[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          date: data.date || todayFormatted,
          color: data.color || '#3B82F6',
          icon: data.icon || '📝',
          linkId: data.linkId || 'link_1',
          linkName: data.linkName || 'Link 1',
          status: data.status || (data.completed ? 'Concluida' : 'Aguardando'),
          createdAt: data.createdAt,
        };
      });

      // Sort by createdAt descending locally
      taskList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setTasks(taskList);
    }, (error) => {
      console.error("Erro ao carregar tarefas:", error);
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  const taskDatesSet = useMemo(() => {
    return new Set(tasks.map((t) => t.date));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesDate = t.date === selectedDate;
      const matchesStatus = filterStatus === 'todos' || t.status === filterStatus;
      return matchesDate && matchesStatus;
    });
  }, [tasks, selectedDate, filterStatus]);

  const handleSaveTask = async (taskData: {
    title: string;
    date: string;
    color: string;
    icon: string;
    linkId: string;
    linkName: string;
    repeatDays: number;
  }) => {
    if (!userData?.uid) {
      Alert.alert('Aviso', 'Sessão do usuário não identificada. Tente fazer login novamente.');
      return;
    }

    const isoDate = new Date().toISOString();

    try {
      if (editingTask) {
        const taskRef = doc(db, 'users', userData.uid, 'tasks', editingTask.id);
        await updateDoc(taskRef, {
          title: taskData.title,
          date: taskData.date,
          color: taskData.color,
          icon: taskData.icon,
          linkId: taskData.linkId,
          linkName: taskData.linkName,
          updatedAt: isoDate,
        });
      } else {
        const tasksRef = collection(db, 'users', userData.uid, 'tasks');
        const count = taskData.repeatDays || 1;

        // Base date calculation
        const baseParts = taskData.date.split('-');
        const year = parseInt(baseParts[0], 10);
        const month = parseInt(baseParts[1], 10) - 1;
        const day = parseInt(baseParts[2], 10);

        const startDate = new Date(year, month, day, 12, 0, 0);

        for (let i = 0; i < count; i++) {
          const nextDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          const yyyy = nextDate.getFullYear();
          const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
          const dd = String(nextDate.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          await addDoc(tasksRef, {
            title: taskData.title,
            date: dateStr,
            color: taskData.color,
            icon: taskData.icon,
            linkId: taskData.linkId,
            linkName: taskData.linkName,
            status: 'Aguardando',
            completed: false,
            createdAt: isoDate,
          });
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar tarefa no Firestore:', err);
      Alert.alert('Erro', 'Não foi possível salvar a tarefa no banco de dados.');
      throw err;
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (!userData?.uid) return;
    const nextStatus = task.status === 'Concluida' ? 'Aguardando' : 'Concluida';
    try {
      const taskRef = doc(db, 'users', userData.uid, 'tasks', task.id);
      await updateDoc(taskRef, {
        status: nextStatus,
        completed: nextStatus === 'Concluida',
      });
    } catch (error) {
      console.error('Erro ao alternar status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!userData?.uid) return;
    try {
      const taskRef = doc(db, 'users', userData.uid, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleSimulateExpiry = async () => {
    setIsTestingAction(true);
    try {
      await simulateTrialExpiry();
    } catch (error) {
      console.error('Erro ao simular expiração:', error);
    } finally {
      setIsTestingAction(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <View className="flex-1 p-4">
        {/* Top User & Subscription Card */}
        <View 
          className="rounded-2xl p-4 mb-3.5 border shadow-sm"
          style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Olá, {userData?.name || 'Usuário'} 👋
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{userData?.email}</Text>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1.5 rounded-lg" onPress={toggleTheme}>
                <Text className="text-base">{isDarkMode ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>

              <TouchableOpacity className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg" onPress={logout}>
                <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sair</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Subscription Status Badge */}
          <View className="mt-2">
            {isPaid ? (
              <View className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
                <Text className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  ✅ Assinatura Ativa (Acesso Total Liberado)
                </Text>
              </View>
            ) : (
              <View className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <Text className="text-blue-700 dark:text-blue-400 font-bold text-xs">
                  ⏳ Período: {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                </Text>
              </View>
            )}
          </View>

          {/* Management Buttons Row */}
          <View className="flex-row gap-2 mt-2.5">
            <TouchableOpacity
              className="flex-1 border rounded-xl py-2.5 items-center"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.borderColor }}
              onPress={() => setIsPeopleModalOpen(true)}
            >
              <Text className="font-bold text-xs" style={{ color: colors.textPrimary }}>👥 Pessoas ({people.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-xl py-2.5 items-center"
              onPress={() => setIsLinksModalOpen(true)}
            >
              <Text className="text-white font-bold text-xs">🔗 Links</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Calendar */}
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          taskDates={taskDatesSet}
        />

        {/* Action Header & Date Filter */}
        <View className="flex-row justify-between items-center mb-2.5">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>Tarefas de {selectedDate}</Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>({filteredTasks.length} tarefas)</Text>
          </View>

          <TouchableOpacity className="bg-emerald-600 px-3.5 py-2 rounded-xl" onPress={handleOpenNew}>
            <Text className="text-white font-bold text-xs">+ Nova Tarefa</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Tabs */}
        <View className="flex-row rounded-xl p-1 mb-3" style={{ backgroundColor: colors.inputBg }}>
          <TouchableOpacity
            className={`flex-1 py-1.5 items-center rounded-lg ${filterStatus === 'todos' ? 'bg-white dark:bg-slate-800' : ''}`}
            onPress={() => setFilterStatus('todos')}
          >
            <Text 
              className={`text-xs ${filterStatus === 'todos' ? 'font-bold' : 'font-semibold'}`}
              style={{ color: filterStatus === 'todos' ? colors.textPrimary : colors.textSecondary }}
            >
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-1.5 items-center rounded-lg ${filterStatus === 'Aguardando' ? 'bg-white dark:bg-slate-800' : ''}`}
            onPress={() => setFilterStatus('Aguardando')}
          >
            <Text 
              className={`text-xs ${filterStatus === 'Aguardando' ? 'font-bold' : 'font-semibold'}`}
              style={{ color: filterStatus === 'Aguardando' ? colors.textPrimary : colors.textSecondary }}
            >
              ⏳ Aguardando
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-1.5 items-center rounded-lg ${filterStatus === 'Concluida' ? 'bg-white dark:bg-slate-800' : ''}`}
            onPress={() => setFilterStatus('Concluida')}
          >
            <Text 
              className={`text-xs ${filterStatus === 'Concluida' ? 'font-bold' : 'font-semibold'}`}
              style={{ color: filterStatus === 'Concluida' ? colors.textPrimary : colors.textSecondary }}
            >
              ✓ Concluídas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Task Cards List */}
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 16, gap: 10 }}
          renderItem={({ item }) => {
            const isDone = item.status === 'Concluida';
            const assignedLink = userData?.userLinks?.find((l) => l.id === item.linkId);

            return (
              <View 
                className="rounded-2xl p-3.5 border-l-4 border shadow-sm"
                style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor, borderLeftColor: item.color || '#3B82F6' }}
              >
                <View className="flex-row items-start mb-2.5">
                  <Text className="text-2xl mr-3">{item.icon || '📝'}</Text>
                  
                  <View className="flex-1">
                    <Text 
                      className={`text-sm font-bold mb-1.5 ${isDone ? 'line-through text-slate-400' : ''}`}
                      style={{ color: isDone ? undefined : colors.textPrimary }}
                    >
                      {item.title}
                    </Text>

                    <View className="flex-row items-center gap-2 flex-wrap">
                      <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.inputBg }}>
                        <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                          {assignedLink?.logo || '🏢'} {item.linkName}
                          {assignedLink?.assignedPersonName ? ` (${assignedLink.assignedPersonName})` : ''}
                        </Text>
                      </View>

                      <View className={`px-2 py-0.5 rounded-md ${isDone ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-amber-100 dark:bg-amber-950/50'}`}>
                        <Text className={`text-[11px] font-bold ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                          {isDone ? '✓ Concluída' : '⏳ Aguardando'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Card Control Buttons */}
                <View className="flex-row items-center justify-end gap-2 pt-2 border-t" style={{ borderTopColor: colors.borderColor }}>
                  <TouchableOpacity
                    className={`px-3 py-1.5 rounded-lg ${isDone ? 'bg-slate-200 dark:bg-slate-700' : 'bg-emerald-600'}`}
                    onPress={() => handleToggleStatus(item)}
                  >
                    <Text className="text-white text-xs font-bold">
                      {isDone ? 'Marcar Aguardando' : '✓ Concluir'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: colors.inputBg }}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Text className="text-sm">✏️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: colors.inputBg }}
                    onPress={() => handleDeleteTask(item.id)}
                  >
                    <Text className="text-sm">🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="p-8 items-center rounded-2xl border" style={{ backgroundColor: colors.cardBg, borderColor: colors.borderColor }}>
              <Text className="text-4xl mb-2">📅</Text>
              <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>Nenhuma tarefa cadastrada para este dia.</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Clique em "+ Nova Tarefa" para adicionar.</Text>
            </View>
          }
        />

        {/* Testing Controls Panel */}
        <View className="mt-2">
          <TouchableOpacity
            className="bg-amber-600 py-2 rounded-lg items-center"
            onPress={handleSimulateExpiry}
            disabled={isTestingAction}
          >
            <Text className="text-white text-xs font-semibold">
              ⚡ Expiração dos 30 Dias (Bloqueio)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <TaskModal
        visible={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialDate={selectedDate}
        userLinks={userData?.userLinks || []}
        editingTask={editingTask}
      />

      <UserLinksModal
        visible={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        userLinks={userData?.userLinks || []}
        people={people}
        onUpdateLinkDetails={updateLinkDetails}
        onOpenPeopleModal={() => {
          setIsLinksModalOpen(false);
          setIsPeopleModalOpen(true);
        }}
      />

      <PeopleModal
        visible={isPeopleModalOpen}
        onClose={() => setIsPeopleModalOpen(false)}
        people={people}
        onAddPerson={addPerson}
        onUpdatePerson={updatePerson}
        onDeletePerson={deletePerson}
      />
    </SafeAreaView>
  );
}
