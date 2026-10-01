import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Person, useAuth, UserLink } from '../context/AuthContext';

interface UserLinksModalProps {
  visible: boolean;
  onClose: () => void;
  userLinks: UserLink[];
  people: Person[];
  onUpdateLinkDetails: (
    linkId: string,
    name: string,
    assignedPersonId: string,
    assignedPersonName: string,
    logo: string
  ) => Promise<void>;
  onOpenPeopleModal: () => void;
}

const PRESET_LOGOS = ['🧒', '👤', '👨‍💼', '👩‍💼', '👨‍🦰', '👩‍🦰', '👩', '🙆‍♀️', '💁‍♀️', '🤦', '🤦‍♀️', '🏆'];

export const UserLinksModal: React.FC<UserLinksModalProps> = ({
  visible,
  onClose,
  userLinks,
  people,
  onUpdateLinkDetails,
  onOpenPeopleModal,
}) => {
  const { userData, toggleDeviceBlock } = useAuth();
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempPersonId, setTempPersonId] = useState('');
  const [tempLogo, setTempLogo] = useState('🙂');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleStartEdit = (link: UserLink) => {
    setEditingLinkId(link.id);
    setTempName(link.name);
    setTempPersonId(link.assignedPersonId || '');
    setTempLogo(link.logo || '🙂');
  };

  const handleSaveEdit = async (linkId: string) => {
    if (!tempName.trim()) return;

    const selectedPerson = people.find((p) => p.id === tempPersonId);
    const personName = selectedPerson ? selectedPerson.fullName : '';

    await onUpdateLinkDetails(linkId, tempName.trim(), tempPersonId, personName, tempLogo);
    setEditingLinkId(null);
  };

  const handleToggleBlock = async (link: UserLink) => {
    if (!userData?.uid) return;
    const nextState = !link.isDeviceBlocked;
    try {
      await toggleDeviceBlock(userData.uid, link.id, nextState);
    } catch (err) {
      console.error('Erro ao alternar status do bloqueio:', err);
      Alert.alert('Erro', 'Não foi possível alterar o status do bloqueio.');
    }
  };

  const handleCopyLink = (linkCode: string) => {
    setCopiedCode(linkCode);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-slate-900/50 justify-center p-4">
        <View className="bg-white rounded-2xl p-5 max-h-[90%]">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-lg font-bold text-slate-900">🔗 Links de Acesso</Text>
            <TouchableOpacity onPress={onClose} className="p-1.5">
              <Text className="text-lg text-slate-500 font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-[13px] text-slate-500 mb-3.5 leading-[18px]">
            Atribua cada link a um nome cadastrado, escolha uma logo e controle o bloqueio de celular.
          </Text>

          <ScrollView className="pb-3 gap-3">
            {userLinks.map((link, index) => {
              const fullUrl = `/link/${link.code}`;
              const isCopied = copiedCode === link.code;
              const isEditing = editingLinkId === link.id;
              const isBlocked = link.isDeviceBlocked ?? false;

              return (
                <View key={link.id} className={`bg-slate-50 rounded-xl p-3.5 border ${isBlocked ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                  <View className="flex-row justify-between items-center mb-1.5">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-[22px]">{link.logo || '🙂'}</Text>
                      <Text className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-md">Link #{index + 1}</Text>
                      {isBlocked ? (
                        <View className="bg-red-100 px-2 py-0.5 rounded-md">
                          <Text className="text-red-800 text-[11px] font-bold">🔒 Bloqueado</Text>
                        </View>
                      ) : null}
                    </View>

                    {isEditing ? (
                      <TouchableOpacity
                        onPress={() => handleSaveEdit(link.id)}
                        className="bg-green-600 px-2.5 py-1 rounded-md"
                      >
                        <Text className="text-white text-xs font-bold">Salvar Alterações</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleStartEdit(link)}
                        className="px-2 py-1"
                      >
                        <Text className="text-xs text-blue-600 font-semibold">✏️ Configurar</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isEditing ? (
                    <View className="bg-white rounded-lg p-2.5 border border-slate-300 mb-2">
                      <Text className="text-xs font-semibold text-slate-700 mb-1 mt-1">Nome do Link</Text>
                      <TextInput
                        className="bg-slate-50 rounded-md px-2.5 py-1.5 text-sm border border-blue-600 mb-2"
                        value={tempName}
                        onChangeText={setTempName}
                        placeholder="Ex: Link Dispositivo João"
                      />

                      <View className="flex-row justify-between items-center">
                        <Text className="text-xs font-semibold text-slate-700 mb-1 mt-1">Atribuir a um NOME (Pessoa):</Text>
                        <TouchableOpacity onPress={onOpenPeopleModal}>
                          <Text className="text-[11px] text-blue-600 font-bold">+ Cadastrar Nova Pessoa</Text>
                        </TouchableOpacity>
                      </View>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
                        <TouchableOpacity
                            className={`bg-slate-100 px-2.5 py-1.5 rounded-full mr-1.5 border ${tempPersonId === '' ? 'bg-blue-50 border-blue-600' : 'border-slate-200'}`}
                          onPress={() => setTempPersonId('')}
                        >
                          <Text className={`text-xs ${tempPersonId === '' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                            Sem Pessoa Atribuída
                          </Text>
                        </TouchableOpacity>

                        {people.map((p) => (
                          <TouchableOpacity
                            key={p.id}
                            className={`bg-slate-100 px-2.5 py-1.5 rounded-full mr-1.5 border ${tempPersonId === p.id ? 'bg-blue-50 border-blue-600' : 'border-slate-200'}`}
                            onPress={() => setTempPersonId(p.id)}
                          >
                            <Text className={`text-xs ${tempPersonId === p.id ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                              {p.gender === 'Feminino' ? '👩' : '👨'} {p.fullName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      <Text className="text-xs font-semibold text-slate-700 mb-1 mt-1">Escolha a Logo do Link:</Text>
                      <View className="flex-row flex-wrap gap-1.5 mt-1">
                        {PRESET_LOGOS.map((lg) => (
                          <TouchableOpacity
                            key={lg}
                            className={`w-[34px] h-[34px] rounded-lg justify-center items-center border ${tempLogo === lg ? 'bg-blue-100 border-2 border-blue-600' : 'bg-slate-100 border-slate-200'}`}
                            onPress={() => setTempLogo(lg)}
                          >
                            <Text className="text-lg">{lg}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View>
                      <Text className="text-base font-bold text-slate-800 mb-1">{link.name}</Text>
                      <View className="mb-2">
                        <Text className="text-xs text-slate-600">
                          👤 Atribuído a:{' '}
                          <Text style={{ fontWeight: '700' }}>
                            {link.assignedPersonName || 'Nenhuma pessoa associada'}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  )}

                  <View className="bg-white rounded-lg p-2 border border-slate-200 mb-2.5">
                    <Text className="text-[13px] font-bold text-slate-700" numberOfLines={1}>
                      Código: {link.code}
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                      {fullUrl}
                    </Text>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className={`flex-[2] rounded-lg py-2.5 items-center ${isCopied ? 'bg-green-600' : 'bg-blue-600'}`}
                      onPress={() => handleCopyLink(link.code)}
                    >
                      <Text className="text-white font-semibold text-[13px]">
                        {isCopied ? '✓ Código Copiado!' : '📋 Copiar Código'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`flex-1 py-2.5 rounded-lg items-center ${isBlocked ? 'bg-green-600' : 'bg-red-600'}`}
                      onPress={() => handleToggleBlock(link)}
                    >
                      <Text className="text-white font-bold text-[13px]">
                        {isBlocked ? '🔓 Desbloquear' : '🔒 Travar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity className="mt-3 bg-slate-100 py-3 rounded-lg items-center" onPress={onClose}>
            <Text className="text-slate-600 font-bold text-sm">Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

