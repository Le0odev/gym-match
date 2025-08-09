import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomInput, LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { chatService } from '../services/chatService';
import { getSocket } from '../services/api';
import { eventBus } from '../services/eventBus';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import locationService from '../services/locationService';
import { useLocation } from '../hooks/useLocation';

const Chat = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [match, setMatch] = useState(null);
  const flatListRef = useRef(null);
  const { user } = useAuth();
  const { matchId, matchData } = route.params || {};
  const didInitialScrollRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const scrollScheduledRef = useRef(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteType, setInviteType] = useState('musculacao');
  const [inviteDate, setInviteDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [inviteTime, setInviteTime] = useState(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mi}`;
  });
  const [inviteLocation, setInviteLocation] = useState('');
  const [inviteGymId, setInviteGymId] = useState(undefined);
  const [nearbyGyms, setNearbyGyms] = useState([]);
  const [inviteError, setInviteError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { location: currentLocation } = useLocation();

  // Lazy require DateTimePicker to avoid hard dependency if not installed
  let DateTimePicker = null;
  try {
    // eslint-disable-next-line global-require
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    DateTimePicker = null;
  }

  // Normaliza o objeto de match para sempre ter `otherUser`
  const normalizeMatch = (m) => {
    if (!m) return m;
    if (m.otherUser || !m.user) return m;
    return { ...m, otherUser: m.user };
  };

  // Garante que a lista de mensagens não tenha duplicatas por id
  const dedupeById = (arr) => {
    const seen = new Set();
    const out = [];
    for (const msg of arr) {
      const key = msg?.id ?? `${msg?.senderId}-${msg?.createdAt}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(msg);
      }
    }
    return out;
  };

  // Scroll coalescido para o fim
  const scheduleScrollToEnd = (animated = false, delayMs = 50) => {
    if (scrollScheduledRef.current) return;
    scrollScheduledRef.current = true;
    setTimeout(() => {
      scrollScheduledRef.current = false;
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated });
      });
    }, delayMs);
  };

  // Helpers de UI (pt-BR)
  const getStatusChip = (status) => {
    const map = {
      accepted: { text: 'Aceito', bg: '#22c55e33', fg: '#16a34a', icon: 'checkmark-circle' },
      rejected: { text: 'Recusado', bg: '#ef444433', fg: '#b91c1c', icon: 'close-circle' },
      canceled: { text: 'Cancelado', bg: colors.gray[200], fg: colors.gray[700], icon: 'ban' },
      pending:  { text: 'Pendente', bg: '#f59e0b33', fg: '#b45309', icon: 'time' },
    };
    return map[status] || map.pending;
  };

  const getWorkoutTypeLabel = (t) => {
    const map = {
      musculacao: 'Musculação',
      cardio: 'Cardio',
      funcional: 'Funcional',
      hiit: 'HIIT',
      cross: 'Cross',
      outro: 'Outro',
    };
    return map[t] || t;
  };

  const formatInviteDateTime = (dateStr, timeStr) => {
    try {
      if (!dateStr || !timeStr) return '';
      const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
      const [hh, mm] = timeStr.split(':').map((n) => parseInt(n, 10));
      const dt = new Date(Date.UTC(y, m - 1, d, hh, mm));
      // Mostrar no timezone local
      const local = new Date(dt.getTime());
      const optsDate = { day: '2-digit', month: '2-digit', year: 'numeric' };
      const optsTime = { hour: '2-digit', minute: '2-digit' };
      return `${local.toLocaleDateString('pt-BR', optsDate)} ${local.toLocaleTimeString('pt-BR', optsTime)}`;
    } catch (_) {
      return `${dateStr} ${timeStr}`;
    }
  };

  useEffect(() => {
    if (matchData) {
      setMatch(normalizeMatch(matchData));
    }
    // Carrega mensagens imediatamente
    loadMessages();
    // E marca como lidas após um pequeno atraso para garantir entrega
    const t = setTimeout(() => {
      markMessagesAsRead();
    }, 150);
    // Socket listener para novas mensagens
    let cleanup;
    (async () => {
      const socket = await getSocket();
      // registra user na sala
      if (user?.id) socket.emit('register', user.id);
      const handler = (msg) => {
        if (msg.matchId === matchId) {
          setMessages((prev) => dedupeById([...prev, msg]));
          // Ao receber, garantir visibilidade da última mensagem
          scheduleScrollToEnd(true, 40);
        }
      };
      const onInviteNew = ({ invite, message }) => {
        if (message?.matchId === matchId) {
          setMessages((prev) => dedupeById([...prev, message]));
          scheduleScrollToEnd(true, 40);
        }
      };
      const onInviteUpdate = ({ invite, message }) => {
        // Atualiza o status localmente sem recarregar tudo
        setMessages((prev) => {
          let found = false;
          const updated = prev.map((m) => {
            if ((m.type === 'WORKOUT_INVITE' || m.type === 'workout_invite') && m.metadata?.inviteId === invite.id) {
              found = true;
              return { ...m, metadata: { ...m.metadata, status: invite.status } };
            }
            return m;
          });
          if (!found && message) {
            return dedupeById([...updated, message]);
          }
          return updated;
        });
      };
      socket.on('message:new', handler);
      socket.on('invite:new', onInviteNew);
      socket.on('invite:update', onInviteUpdate);
      cleanup = () => {
        socket.off('message:new', handler);
        socket.off('invite:new', onInviteNew);
        socket.off('invite:update', onInviteUpdate);
      };
    })();
    return () => { clearTimeout(t); if (cleanup) cleanup(); };
  }, [matchId]);

  // Load nearby gyms when opening invite modal
  useEffect(() => {
    const loadGyms = async () => {
      if (!inviteModalVisible) return;
      try {
        const res = await chatService.getNearbyGyms(matchId, { radius: 5000, limit: 5 });
        setNearbyGyms(res.gyms || []);
      } catch (_) {
        setNearbyGyms([]);
      }
    };
    loadGyms();
  }, [inviteModalVisible, matchId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await chatService.getMatchMessages(matchId, {
        limit: 50,
        offset: 0,
      });
      // chatService já normaliza para array cronológico (mais antigo -> mais novo)
      // Garantir ordem: se vier invertido, detectamos por createdAt
      const normalized = Array.isArray(messagesData) ? messagesData : [];
      setMessages(dedupeById(normalized));
      // Após carregar, rolar para o fim para exibir a última mensagem
      scheduleScrollToEnd(false, 60);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Erro', 'Não foi possível carregar as mensagens');
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await chatService.markAllMessagesAsRead(matchId);
      // Notificar outras telas para atualizar contadores
      eventBus.emit('match:read', { matchId });
      // Limpar badge global (notificações) assim que usuário visualizar chat
      try {
        await notificationService.markAllAsRead();
      } catch {}
      eventBus.emit('badge:clear');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Otimista: adiciona imediatamente
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        matchId,
        senderId: user?.id,
        recipientId: null,
        content: newMessage.trim(),
        type: 'text',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => dedupeById([...prev, optimisticMessage]));
      setNewMessage('');
      scheduleScrollToEnd(true, 30);

      // Envia ao backend
      const sentMessage = await chatService.sendMessage({
        matchId,
        content: optimisticMessage.content,
        type: 'text',
      });

      // Reconciliar: substitui a otimista pela real
      setMessages(prev => {
        const withoutOptimistic = prev.filter(m => m.id !== tempId);
        return dedupeById([...withoutOptimistic, sentMessage]);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    } finally {
      // não mostra spinner; fluxo contínuo
    }
  };

  const sendWorkoutInvite = () => {
    Alert.alert(
      'Convite para Treino',
      'Deseja convidar este usuário para treinar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Enviar Convite', 
          onPress: async () => {
            try {
              const now = new Date();
              const pad = (n) => String(n).padStart(2, '0');
              const inviteData = {
                matchId,
                workoutType: 'Treino livre',
                date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
                time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
                message: 'Que tal treinarmos juntos?',
              };

              await chatService.sendWorkoutInvite(inviteData);
              Alert.alert('Sucesso', 'Convite enviado!');
              loadMessages(); // Recarregar mensagens
            } catch (error) {
              console.error('Error sending workout invite:', error);
              Alert.alert('Erro', 'Não foi possível enviar o convite');
            }
          }
        },
      ]
    );
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const renderMessage = useCallback(({ item }) => {
    const isMyMessage = item.senderId === user?.id;
    const isInvite = item.type === 'WORKOUT_INVITE' || item.type === 'workout_invite';
    const meta = item.metadata || {};
    
    return (
      <View style={getMessageContainerStyle(isMyMessage)}>
        <View style={getMessageBubbleStyle(isMyMessage)}>
          {isInvite ? (
            <View>
              <View style={[getWorkoutInviteStyle(), { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="fitness" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={getWorkoutInviteTextStyle()}>
                    Convite para treino
                  </Text>
                </View>
                {meta.status ? (() => { const st = getStatusChip(meta.status); return (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, backgroundColor: st.bg, marginLeft: 8 }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, lineHeight: 14, color: st.fg }}>{st.text}</Text>
                  </View>
                ); })() : null}
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', color: isMyMessage ? colors.white : colors.gray[800], marginTop: 6 }}>
                {meta.workoutType ? `${getWorkoutTypeLabel(meta.workoutType)}` : ''}
                {meta.date && meta.time ? ` — ${formatInviteDateTime(meta.date, meta.time)}` : ''}
              </Text>
              {meta.address ? (
                <Text style={{ fontFamily: 'Inter-Regular', color: isMyMessage ? colors.white : colors.gray[700], marginTop: 2 }}>
                  Local: {meta.address}
                </Text>
              ) : null}

              {/* Ações */}
              {!meta.status || meta.status === 'pending' ? (
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  {isMyMessage ? (
                    <TouchableOpacity onPress={async () => {
                      try {
                        if (!meta.inviteId) return;
                        // otimista
                        updateInviteStatusLocally(meta.inviteId, 'canceled');
                        await chatService.cancelWorkoutInvite(meta.inviteId);
                      } catch (e) {
                        Alert.alert('Erro', 'Não foi possível cancelar');
                      }
                    }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.white + '20', borderWidth: isMyMessage ? 0 : 1, borderColor: colors.gray[200] }}>
                      <Text style={{ color: isMyMessage ? colors.white : colors.gray[800] }}>Cancelar</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity onPress={async () => {
                        try {
                          if (!meta.inviteId) return;
                          updateInviteStatusLocally(meta.inviteId, 'accepted');
                          await chatService.acceptWorkoutInvite(meta.inviteId);
                        } catch (e) {
                          Alert.alert('Erro', 'Não foi possível aceitar');
                        }
                      }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.primary, marginRight: 8 }}>
                        <Text style={{ color: colors.white }}>Aceitar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={async () => {
                        try {
                          if (!meta.inviteId) return;
                          updateInviteStatusLocally(meta.inviteId, 'rejected');
                          await chatService.rejectWorkoutInvite(meta.inviteId);
                        } catch (e) {
                          Alert.alert('Erro', 'Não foi possível recusar');
                        }
                      }} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.gray[300] }}>
                        <Text style={{ color: isMyMessage ? colors.white : colors.gray[800] }}>Recusar</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ) : null}
              {meta.status && meta.status !== 'pending' ? (() => { const st = getStatusChip(meta.status); return (
                <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={st.icon} size={16} color={st.fg} style={{ marginRight: 6 }} />
                  <Text style={{ fontFamily: 'Inter-Medium', color: st.fg }}>{st.text === 'Aceito' ? 'Confirmado' : st.text}</Text>
                </View>
              ); })() : null}
            </View>
          ) : (
            <Text style={getMessageTextStyle(isMyMessage)}>
              {item.content}
            </Text>
          )}
          
          <View style={getMessageFooterStyle()}>
            <Text style={getMessageTimeStyle(isMyMessage)}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isMyMessage && (
              <Ionicons
                name={item.readAt ? "checkmark-done" : "checkmark"}
                size={16}
                color={item.readAt ? colors.primary : colors.gray[400]}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  }, [user?.id]);

  const updateInviteStatusLocally = (inviteId, newStatus) => {
    setMessages((prev) => prev.map((m) => {
      if ((m.type === 'WORKOUT_INVITE' || m.type === 'workout_invite') && m.metadata?.inviteId === inviteId) {
        return { ...m, metadata: { ...m.metadata, status: newStatus } };
      }
      return m;
    }));
  };

  const getContainerStyle = () => ({
    flex: 1,
    backgroundColor: colors.background,
  });

  const getHeaderStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  });

  const getBackButtonStyle = () => ({
    padding: 8,
    marginRight: 12,
  });

  const getHeaderInfoStyle = () => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  });

  const getAvatarStyle = () => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  });

  const getHeaderTextStyle = () => ({
    flex: 1,
  });

  const getHeaderNameStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[900],
  });

  const getHeaderStatusStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray[500],
  });

  const getHeaderActionsStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
  });

  const getActionButtonStyle = () => ({
    padding: 8,
    marginLeft: 8,
  });

  const getMessagesContainerStyle = () => ({
    flex: 1,
    paddingHorizontal: 16,
  });

  const getMessageContainerStyle = (isMyMessage) => ({
    flexDirection: 'row',
    justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
    marginVertical: 4,
  });

  const getMessageBubbleStyle = (isMyMessage) => ({
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: isMyMessage ? colors.primary : colors.white,
    borderWidth: isMyMessage ? 0 : 1,
    borderColor: colors.gray[200],
  });

  const getMessageTextStyle = (isMyMessage) => ({
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: isMyMessage ? colors.white : colors.gray[900],
  });

  const getMessageFooterStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  });

  const getMessageTimeStyle = (isMyMessage) => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: isMyMessage ? colors.white + '80' : colors.gray[500],
  });

  const getWorkoutInviteStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  });

  const getWorkoutInviteTextStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  });

  const getInputContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  });

  const getInputStyle = () => ({
    flex: 1,
    marginRight: 12,
  });

  const getSendButtonStyle = () => ({
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  });

  const getSendButtonDisabledStyle = () => ({
    ...getSendButtonStyle(),
    backgroundColor: colors.gray[300],
  });

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingSpinner visible={true} text="Carregando chat..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={getContainerStyle()}>
      {/* Header */}
      <View style={getHeaderStyle()}>
        <TouchableOpacity
          style={getBackButtonStyle()}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.gray[700]}
          />
        </TouchableOpacity>

        <View style={getHeaderInfoStyle()}>
          <View style={getAvatarStyle()}>
            {match?.otherUser?.profilePicture ? (
              <Image
                source={{ uri: match.otherUser.profilePicture }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <Ionicons
                name="person"
                size={20}
                color={colors.gray[500]}
              />
            )}
          </View>

          <View style={getHeaderTextStyle()}>
            <Text style={getHeaderNameStyle()}>
              {match?.otherUser?.name || 'Usuário'}
            </Text>
            <Text style={getHeaderStatusStyle()}>
              {match?.otherUser?.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={getHeaderActionsStyle()}>
          <TouchableOpacity
            style={getActionButtonStyle()}
            onPress={() => setInviteModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="fitness"
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={getActionButtonStyle()}
            onPress={() => Alert.alert('Em breve', 'Mais opções em desenvolvimento')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={colors.gray[600]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <View style={getMessagesContainerStyle()}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => String(item?.id ?? `${item?.senderId}-${item?.createdAt}-${index}`)}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
            onContentSizeChange={() => {
              // Se já rolou e o usuário não está perto do fim, não force scroll
              if (!didInitialScrollRef.current || isNearBottomRef.current) {
                scheduleScrollToEnd(false, 10);
                didInitialScrollRef.current = true;
              }
            }}
            onLayout={() => scheduleScrollToEnd(false, 10)}
            onScroll={({ nativeEvent }) => {
              const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
              const paddingToBottom = 80;
              isNearBottomRef.current =
                contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom;
            }}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            windowSize={9}
            maxToRenderPerBatch={20}
            updateDelayBeforeBatching={50}
            removeClippedSubviews
          />
        </View>

        {/* Input */}
        <View style={getInputContainerStyle()}>
          <View style={getInputStyle()}>
            <CustomInput
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={1}
              maxLength={500}
              style={{ marginBottom: 0 }}
              inputStyle={{ minHeight: 40, maxHeight: 120 }}
              inputContainerStyle={{ borderRadius: 18, paddingVertical: 4 }}
            />
          </View>

          <TouchableOpacity
            style={newMessage.trim() ? getSendButtonStyle() : getSendButtonDisabledStyle()}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={20}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Invite Modal */}
      <Modal visible={inviteModalVisible} transparent animationType="slide" onRequestClose={() => setInviteModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80%' }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.gray[100] }}>
              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.gray[900] }}>Convidar para treino</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontFamily: 'Inter-Medium', marginBottom: 8, color: colors.gray[700] }}>Tipo</Text>
              <View style={{ flexDirection: 'row', marginBottom: 16, flexWrap: 'wrap' }}>
                {['musculacao','cardio','funcional','hiit','cross','outro'].map((t) => (
                  <TouchableOpacity key={t} onPress={() => setInviteType(t)} activeOpacity={0.8} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: inviteType===t?colors.primary:colors.gray[200], backgroundColor: inviteType===t? colors.primary+'15': colors.white, marginRight: 8, marginBottom: 8 }}>
                    <Text style={{ color: inviteType===t? colors.primary: colors.gray[800], fontFamily: 'Inter-Medium' }}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ fontFamily: 'Inter-Medium', marginBottom: 8, color: colors.gray[700] }}>Data & Hora</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.gray[200], backgroundColor: colors.white, marginRight: 8 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', color: colors.gray[800] }}>{inviteDate}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} activeOpacity={0.8} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.gray[200], backgroundColor: colors.white }}>
                  <Text style={{ fontFamily: 'Inter-Medium', color: colors.gray[800] }}>{inviteTime}</Text>
                </TouchableOpacity>
              </View>
              {DateTimePicker && showDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    if (!d) return;
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth()+1).padStart(2,'0');
                    const dd = String(d.getDate()).padStart(2,'0');
                    setInviteDate(`${yyyy}-${mm}-${dd}`);
                    setInviteError('');
                  }}
                />
              )}
              {DateTimePicker && showTimePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, d) => {
                    setShowTimePicker(false);
                    if (!d) return;
                    const hh = String(d.getHours()).padStart(2,'0');
                    const mi = String(d.getMinutes()).padStart(2,'0');
                    setInviteTime(`${hh}:${mi}`);
                    setInviteError('');
                  }}
                />
              )}

              <Text style={{ fontFamily: 'Inter-Medium', marginBottom: 8, color: colors.gray[700] }}>Local</Text>
              <CustomInput placeholder="Academia ou endereço" value={inviteLocation} onChangeText={setInviteLocation} inputStyle={{ minHeight: 40 }} />
              {!!currentLocation?.address?.formattedAddress && (
                <TouchableOpacity onPress={() => setInviteLocation(currentLocation.address.formattedAddress)} activeOpacity={0.7} style={{ marginTop: 8 }}>
                  <Text style={{ color: colors.primary }}>Usar minha localização: {currentLocation.address.formattedAddress}</Text>
                </TouchableOpacity>
              )}
              {nearbyGyms.length > 0 && (
                <View style={{ marginTop: 10 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {nearbyGyms.map((g) => (
                      <TouchableOpacity key={g.id} onPress={() => { setInviteLocation(g.name); setInviteGymId(g.id); }} activeOpacity={0.9} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.gray[200], backgroundColor: colors.white, marginRight: 8 }}>
                        <Text style={{ fontFamily: 'Inter-Medium', color: colors.gray[800] }}>{g.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {!!inviteError && (
                <Text style={{ color: colors.secondary, marginTop: 8 }}>{inviteError}</Text>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <TouchableOpacity onPress={() => setInviteModalVisible(false)} style={{ paddingVertical: 10, paddingHorizontal: 16, marginRight: 8 }}>
                  <Text style={{ color: colors.gray[600] }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={async () => {
                  try {
                    // validação de data/hora futura
                    const parts = inviteDate.split('-');
                    const tparts = inviteTime.split(':');
                    if (parts.length !== 3 || tparts.length !== 2) {
                      setInviteError('Data/hora inválidas');
                      return;
                    }
                    const when = new Date(Date.UTC(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10), parseInt(tparts[0],10), parseInt(tparts[1],10)));
                    if (when.getTime() <= Date.now()) {
                      setInviteError('Escolha uma data/hora futura');
                      return;
                    }

                    const toSend = {
                      matchId,
                      workoutType: inviteType,
                      date: inviteDate,
                      time: inviteTime,
                      message: 'Que tal treinarmos juntos?',
                      location: inviteLocation || undefined,
                      gymId: inviteGymId,
                    };
                    if (!inviteGymId && inviteLocation) {
                      const geo = await locationService.geocode(inviteLocation);
                      if (geo) {
                        toSend.latitude = geo.latitude;
                        toSend.longitude = geo.longitude;
                      }
                    }
                    await chatService.sendWorkoutInvite(toSend);
                    setInviteModalVisible(false);
                    loadMessages();
                  } catch (e) {
                    Alert.alert('Erro', 'Não foi possível enviar o convite');
                  }
                }} style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 8 }}>
                  <Text style={{ color: colors.white, fontFamily: 'Inter-Medium' }}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Chat;

