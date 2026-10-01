import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Person } from '../context/AuthContext';

interface PeopleModalProps {
  visible: boolean;
  onClose: () => void;
  people: Person[];
  onAddPerson: (fullName: string, birthDate: string, gender: 'Masculino' | 'Feminino') => Promise<void>;
  onUpdatePerson: (personId: string, fullName: string, birthDate: string, gender: 'Masculino' | 'Feminino') => Promise<void>;
  onDeletePerson: (personId: string) => Promise<void>;
}

export const PeopleModal: React.FC<PeopleModalProps> = ({
  visible,
  onClose,
  people,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
}) => {
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Masculino' | 'Feminino'>('Masculino');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleStartEdit = (person: Person) => {
    setEditingPerson(person);
    setFullName(person.fullName);
    setBirthDate(person.birthDate);
    setGender(person.gender);
    setError('');
  };

  const handleResetForm = () => {
    setEditingPerson(null);
    setFullName('');
    setBirthDate('');
    setGender('Masculino');
    setError('');
  };

  const handleSave = async () => {
    if (!fullName.trim() || !birthDate.trim()) {
      setError('Preencha o Nome Completo e a Data de Nascimento.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingPerson) {
        await onUpdatePerson(editingPerson.id, fullName.trim(), birthDate.trim(), gender);
      } else {
        await onAddPerson(fullName.trim(), birthDate.trim(), gender);
      }
      handleResetForm();
    } catch (err) {
      console.error('Erro ao salvar pessoa:', err);
      setError('Falha ao salvar pessoa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-slate-900/50 justify-center p-4">
        <View className="bg-white rounded-2xl p-5 max-h-[85%]">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-slate-900">👥 Cadastro de Pessoas</Text>
            <TouchableOpacity onPress={onClose} className="p-1.5">
              <Text className="text-lg text-slate-500 font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="pb-4" keyboardShouldPersistTaps="handled">
            {/* Form Section */}
            <View className="bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-200">
              <Text className="text-[15px] font-bold text-slate-800 mb-2.5">
                {editingPerson ? 'Editar Pessoa' : 'Cadastrar Nova Pessoa'}
              </Text>

              {error ? (
                <View className="bg-red-50 border border-red-300 p-2 rounded-md mb-2.5">
                  <Text className="text-red-600 text-[13px] text-center">{error}</Text>
                </View>
              ) : null}

              {/* Nome Completo */}
              <View className="mb-2.5">
                <Text className="text-[13px] font-semibold text-slate-700 mb-1">Nome Completo</Text>
                <TextInput
                  className="bg-white rounded-lg px-3 py-2.5 text-sm text-slate-900 border border-slate-300"
                  placeholder="Ex: Maria das Dores Silva"
                  placeholderTextColor="#94A3B8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Data de Nascimento */}
              <View className="mb-2.5">
                <Text className="text-[13px] font-semibold text-slate-700 mb-1">Data de Nascimento</Text>
                <TextInput
                  className="bg-white rounded-lg px-3 py-2.5 text-sm text-slate-900 border border-slate-300"
                  placeholder="Ex: 15/08/1995"
                  placeholderTextColor="#94A3B8"
                  value={birthDate}
                  onChangeText={setBirthDate}
                />
              </View>

              {/* Sexo (2 opções: Masculino / Feminino) */}
              <View className="mb-2.5">
                <Text className="text-[13px] font-semibold text-slate-700 mb-1">Sexo</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`flex-1 bg-white py-2.5 rounded-lg items-center border ${gender === 'Masculino' ? 'bg-blue-50 border-2 border-blue-600' : 'border-slate-300'}`}
                    onPress={() => setGender('Masculino')}
                  >
                    <Text className={`text-[13px] ${gender === 'Masculino' ? 'text-blue-700 font-bold' : 'text-slate-600 font-medium'}`}>
                      👨 Masculino
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 bg-white py-2.5 rounded-lg items-center border ${gender === 'Feminino' ? 'bg-blue-50 border-2 border-blue-600' : 'border-slate-300'}`}
                    onPress={() => setGender('Feminino')}
                  >
                    <Text className={`text-[13px] ${gender === 'Feminino' ? 'text-blue-700 font-bold' : 'text-slate-600 font-medium'}`}>
                      👩 Feminino
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2 mt-1.5">
                {editingPerson ? (
                  <TouchableOpacity className="flex-1 bg-slate-200 py-2.5 rounded-lg items-center" onPress={handleResetForm}>
                    <Text className="text-slate-600 font-semibold text-[13px]">Cancelar</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  className={`flex-[2] py-2.5 rounded-lg items-center ${isSubmitting ? 'bg-blue-300' : 'bg-blue-600'}`}
                  onPress={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-sm">
                      {editingPerson ? 'Salvar Alterações' : '+ Cadastrar'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* List of Registered People */}
            <View className="mt-1">
              <Text className="text-[15px] font-bold text-slate-800 mb-2.5">Pessoas Cadastradas ({people.length})</Text>

              {people.map((person) => (
                <View key={person.id} className="bg-white rounded-lg p-3 mb-2 flex-row justify-between items-center border border-slate-100">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      {person.gender === 'Feminino' ? '👩' : '👨'} {person.fullName}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Nascimento: {person.birthDate} | Sexo: {person.gender}
                    </Text>
                  </View>

                  <View className="flex-row gap-1">
                    <TouchableOpacity onPress={() => handleStartEdit(person)} className="p-1">
                      <Text className="text-sm">✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDeletePerson(person.id)} className="p-1">
                      <Text className="text-sm">🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {people.length === 0 ? (
                <Text className="text-center text-slate-400 text-[13px] mt-2">Nenhuma pessoa cadastrada ainda.</Text>
              ) : null}
            </View>
          </ScrollView>

          <TouchableOpacity className="mt-3 bg-slate-100 py-3 rounded-lg items-center" onPress={onClose}>
            <Text className="text-slate-600 font-bold text-sm">Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

