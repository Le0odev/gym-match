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
      socket.on('message:new', handler);
      cleanup = () => {
        socket.off('message:new', handler);
      };
    })();
    return () => { clearTimeout(t); if (cleanup) cleanup(); };
  }, [matchId]);

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
    
    return (
      <View style={getMessageContainerStyle(isMyMessage)}>
        <View style={getMessageBubbleStyle(isMyMessage)}>
          {item.type === 'WORKOUT_INVITE' ? (
            <View style={getWorkoutInviteStyle()}>
              <Ionicons
                name="fitness"
                size={20}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={getWorkoutInviteTextStyle()}>
                Convite para treino
              </Text>
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
            onPress={sendWorkoutInvite}
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
    </SafeAreaView>
  );
};

export default Chat;

