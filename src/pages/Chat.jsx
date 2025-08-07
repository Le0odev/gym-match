import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomInput, LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { chatService } from '../services/chatService';
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

  useEffect(() => {
    if (matchData) {
      setMatch(matchData);
    }
    loadMessages();
    markMessagesAsRead();
  }, [matchId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await chatService.getMatchMessages(matchId, {
        limit: 50,
        offset: 0,
      });
      setMessages(messagesData.reverse()); // Reverter para mostrar mais recentes no final
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
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const messageData = {
        matchId,
        content: newMessage.trim(),
        type: 'TEXT',
      };

      const sentMessage = await chatService.sendMessage(messageData);
      
      // Adicionar mensagem à lista local
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      
      // Scroll para o final
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    } finally {
      setSending(false);
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
              const inviteData = {
                matchId,
                message: 'Que tal treinarmos juntos?',
                proposedDate: new Date().toISOString(),
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

  const renderMessage = ({ item }) => {
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
        <View style={getMessagesContainerStyle()}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
              maxLength={500}
              style={{ marginBottom: 0 }}
            />
          </View>

          <TouchableOpacity
            style={newMessage.trim() ? getSendButtonStyle() : getSendButtonDisabledStyle()}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <LoadingSpinner size="small" color={colors.white} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={colors.white}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Chat;

