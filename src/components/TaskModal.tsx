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
import { TASK_COLORS, TASK_ICONS } from '../constants/taskOptions';
import { UserLink } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    date: string;
    color: string;
    icon: string;
    linkId: string;
    linkName: string;
    repeatDays: number;
  }) => Promise<void>;
  initialDate: string;
  userLinks: UserLink[];
  editingTask?: {
    id: string;
    title: string;
    date: string;
    color: string;
    icon: string;
    linkId: string;
    linkName: string;
  } | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate,
  userLinks,
  editingTask,
}) => (
  <TaskModalForm
    key={`${visible}:${initialDate}:${JSON.stringify(editingTask)}:${JSON.stringify(userLinks)}`}
    visible={visible}
    onClose={onClose}
    onSave={onSave}
    initialDate={initialDate}
    userLinks={userLinks}
    editingTask={editingTask}
  />
);

const TaskModalForm: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDate,
  userLinks,
  editingTask,
}) => {
  const [title, setTitle] = useState(editingTask?.title || '');
  const date = editingTask?.date || initialDate;
  const [selectedColor, setSelectedColor] = useState(editingTask?.color || TASK_COLORS[0].hex);
  const [selectedIcon, setSelectedIcon] = useState(editingTask?.icon || TASK_ICONS[0].symbol);
  const [selectedLinkId, setSelectedLinkId] = useState(editingTask?.linkId || userLinks[0]?.id || 'link_1');
  const [repeatDays, setRepeatDays] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { colors } = useTheme();

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Por favor, informe o título da tarefa.');
      return;
    }

    const assignedLink = (userLinks && userLinks.length > 0)
      ? (userLinks.find((l) => l.id === selectedLinkId) || userLinks[0])
      : { id: 'link_1', name: 'Link 1 (Principal)', code: 'link_1' };

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        title: title.trim(),
        date,
        color: selectedColor,
        icon: selectedIcon,
        linkId: assignedLink.id,
        linkName: assignedLink.name,
        repeatDays: editingTask ? 1 : repeatDays,
      });
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar tarefa:', err);
      setError('Falha ao salvar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-slate-900/50 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="rounded-t-3xl p-5 max-h-[90%]" style={{ backgroundColor: colors.cardBg }}>
          <View className="flex-row justify-between items-center mb-4 pb-3 border-b" style={{ borderBottomColor: colors.borderColor }}>
            <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-1.5">
              <Text className="text-lg font-bold" style={{ color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {error ? (
              <View className="bg-red-50 border border-red-300 p-2.5 rounded-lg mb-3.5">
                <Text className="text-red-600 text-xs text-center">{error}</Text>
              </View>
            ) : null}

            {/* Title Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Título da Tarefa</Text>
              <TextInput
                className="rounded-xl px-3.5 py-3 text-base border"
                style={{ backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.borderColor }}
                placeholder="Ex: Reunião de alinhamento"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Date Indicator */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Data Inicial</Text>
              <View className="self-start bg-blue-50 dark:bg-blue-950/50 px-3 py-1.5 rounded-lg">
                <Text className="text-blue-600 dark:text-blue-400 font-semibold text-sm">📅 {date}</Text>
              </View>
            </View>

            {/* Task Recurrence Options (Only for new tasks) */}
            {!editingTask ? (
              <View className="mb-4">
                <Text className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                  🔄 Repetir Atividade (evita cadastrar manualmente dia a dia)
                </Text>
                <View className="flex-row gap-1.5 flex-wrap">
                  {[
                    { days: 1, label: 'Não repetir' },
                    { days: 7, label: '7 dias' },
                    { days: 14, label: '14 dias' },
                    { days: 30, label: '30 dias' },
                  ].map((opt) => {
                    const isSelected = repeatDays === opt.days;
                    return (
                      <TouchableOpacity
                        key={opt.days}
                        className={`px-3 py-2 rounded-xl border ${isSelected ? 'bg-blue-600 border-blue-600' : ''}`}
                        style={!isSelected ? { backgroundColor: colors.inputBg, borderColor: colors.borderColor } : undefined}
                        onPress={() => setRepeatDays(opt.days)}
                      >
                        <Text
                          className={`text-xs ${isSelected ? 'text-white font-bold' : 'font-semibold'}`}
                          style={!isSelected ? { color: colors.textSecondary } : undefined}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* 10 Color Picker */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Escolha a Cor</Text>
              <View className="flex-row flex-wrap gap-2">
                {TASK_COLORS.map((col) => {
                  const isSelected = selectedColor === col.hex;
                  return (
                    <TouchableOpacity
                      key={col.id}
                      className={`w-9 h-9 rounded-full justify-center items-center ${isSelected ? 'border-2 border-slate-900 dark:border-white' : ''}`}
                      style={{ backgroundColor: col.hex }}
                      onPress={() => setSelectedColor(col.hex)}
                      activeOpacity={0.8}
                    >
                      {isSelected ? <Text className="text-white font-bold text-base">✓</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 10 Icon Picker */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Escolha o Ícone</Text>
              <View className="flex-row flex-wrap gap-2">
                {TASK_ICONS.map((ico) => {
                  const isSelected = selectedIcon === ico.symbol;
                  return (
                    <TouchableOpacity
                      key={ico.id}
                      className={`w-11 h-11 rounded-xl justify-center items-center border ${isSelected ? 'bg-blue-100 dark:bg-blue-950 border-2 border-blue-600' : ''}`}
                      style={!isSelected ? { backgroundColor: colors.inputBg, borderColor: colors.borderColor } : undefined}
                      onPress={() => setSelectedIcon(ico.symbol)}
                      activeOpacity={0.8}
                    >
                      <Text className="text-xl">{ico.symbol}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* User Links Selector (Max 4 Links) */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Link Executor</Text>
              <View className="gap-2">
                {userLinks.map((link) => {
                  const isSelected = selectedLinkId === link.id;
                  return (
                    <TouchableOpacity
                      key={link.id}
                      className={`flex-row items-center rounded-xl p-3 border ${isSelected ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600' : ''}`}
                      style={!isSelected ? { backgroundColor: colors.inputBg, borderColor: colors.borderColor } : undefined}
                      onPress={() => setSelectedLinkId(link.id)}
                      activeOpacity={0.8}
                    >
                      <View className={`w-4 h-4 rounded-full border-2 mr-2.5 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-400'}`} />
                      <Text 
                        className={`text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300 font-bold' : 'font-medium'}`}
                        style={!isSelected ? { color: colors.textPrimary } : undefined}
                      >
                        {link.logo || '😊'} {link.name} ({link.code})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3 mt-2.5">
              <TouchableOpacity className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 items-center" onPress={onClose}>
                <Text className="text-slate-600 dark:text-slate-300 font-semibold text-sm">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-[2] py-3.5 rounded-xl items-center ${isSubmitting ? 'bg-blue-300 dark:bg-blue-800' : 'bg-blue-600'}`}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-bold text-sm">
                    {repeatDays > 1 ? `Criar em ${repeatDays} Dias` : 'Salvar Tarefa'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
