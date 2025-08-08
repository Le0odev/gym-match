import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import { getSocket } from '../services/api';
import { eventBus } from '../services/eventBus';
import { useAuth } from '../contexts/AuthContext';

const Matches = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const { user } = useAuth();

  // Helpers para lidar com diferentes formatos de resposta do backend
  const getMatchId = (item) => item?.id ?? item?.matchId ?? null;
  const getOtherUser = (item) => item?.otherUser ?? item?.user ?? null;
  const getUnreadCountFor = (item) => {
    const id = getMatchId(item);
    return item?.unreadCount ?? (id != null ? unreadCounts[id] ?? 0 : 0);
  };

  useEffect(() => {
    loadMatches();
    loadUnreadCounts();
  }, []);

  // Realtime: quando chegar mensagem nova, atualizar contador e preview
  useEffect(() => {
    let cleanup;
    (async () => {
      const socket = await getSocket();
      if (user?.id) socket.emit('register', user.id);
      const onNewMessage = (msg) => {
        // Incrementa somente se a mensagem for destinada ao usuário logado
        if (!msg || msg.recipientId !== user?.id) return;
        const matchId = msg.matchId;
        if (!matchId) return;
        setUnreadCounts((prev) => ({ ...prev, [matchId]: (prev[matchId] ?? 0) + 1 }));
        setMatches((prev) => prev.map((m) => {
          const mid = getMatchId(m);
          if (mid === matchId) {
            return {
              ...m,
              unreadCount: (m.unreadCount ?? 0) + 1,
              lastMessage: { ...(m.lastMessage || {}), content: msg.content, createdAt: msg.createdAt },
              lastMessageAt: msg.createdAt ?? m.lastMessageAt,
            };
          }
          return m;
        }));
      };
      socket.on('message:new', onNewMessage);
      const offRead = eventBus.on('match:read', ({ matchId }) => {
        setUnreadCounts(prev => ({ ...prev, [matchId]: 0 }));
        setMatches(prev => prev.map(m => {
          const mid = getMatchId(m);
          return mid === matchId ? { ...m, unreadCount: 0 } : m;
        }));
      });
      cleanup = () => socket.off('message:new', onNewMessage);
    })();
    return () => { cleanup && cleanup(); };
  }, [user?.id]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const matchesData = await userService.getMatches({
        includeMessages: true,
        limit: 50,
      });
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Erro', 'Não foi possível carregar os matches');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      // Se o backend já retornar unreadCount, popular o mapa local primeiro
      const initialCounts = {};
      for (const m of matches) {
        const id = getMatchId(m);
        if (id != null && typeof m?.unreadCount === 'number') {
          initialCounts[id] = m.unreadCount;
        }
      }

      // Em seguida, tentar atualizar via API quando possível (tolerante a falhas)
      const counts = { ...initialCounts };
      for (const match of matches) {
        const id = getMatchId(match);
        if (id == null) continue;
        try {
          const count = await chatService.getMatchUnreadCount(id);
          counts[id] = count.unreadCount;
        } catch (error) {
          console.error(`Error loading unread count for match ${id}:`, error);
        }
      }
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    await loadUnreadCounts();
    setRefreshing(false);
  };

  const handleMatchPress = async (match) => {
    try {
      // Ao abrir a conversa, zera notificações/contador desse match no backend
      const id = getMatchId(match);
      if (id) {
        await chatService.markAllMessagesAsRead(id);
        // Atualiza estado local imediatamente para refletir UI
        setUnreadCounts((prev) => ({ ...prev, [id]: 0 }));
        setMatches((prev) => prev.map((m) => {
          const mid = getMatchId(m);
          if (mid === id) {
            return { ...m, unreadCount: 0 };
          }
          return m;
        }));
      }
    } catch {}
    navigation.navigate('Chat', {
      matchId: getMatchId(match),
      matchData: match,
    });
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Agora';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const renderMatch = ({ item }) => {
    const otherUser = getOtherUser(item);
    const unreadCount = getUnreadCountFor(item);
    const hasUnread = unreadCount > 0;
    
    return (
      <TouchableOpacity
        style={getMatchItemStyle()}
        onPress={() => handleMatchPress(item)}
        activeOpacity={0.85}
      >
        <View style={getMatchAvatarContainerStyle()}>
          <View style={getMatchAvatarStyle()}>
            {otherUser?.profilePicture ? (
              <Image
                source={{ uri: otherUser.profilePicture }}
                style={{ width: 60, height: 60, borderRadius: 30 }}
              />
            ) : (
              <Ionicons
                name="person"
                size={30}
                color={colors.gray[500]}
              />
            )}
          </View>
          {otherUser?.isOnline && (
            <View style={getOnlineIndicatorStyle()} />
          )}
          {hasUnread && (
            <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: colors.primary, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white }}>
              <Text style={{ color: colors.white, fontFamily: 'Inter-Bold', fontSize: 10 }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={getMatchInfoStyle()}>
          <View style={getMatchHeaderStyle()}>
            <Text style={getMatchNameStyle()}>
              {otherUser?.name || 'Usuário'}
            </Text>
            <Text style={getMatchTimeStyle()}>
              {formatLastMessageTime(item.lastMessage?.createdAt ?? item.lastMessageAt)}
            </Text>
          </View>

          <Text style={getMatchLocationStyle()}>
            {otherUser?.age ? `${otherUser.age} anos` : ''} 
            {otherUser?.age && otherUser?.location ? ' • ' : ''}
            {otherUser?.location || ''}
          </Text>

          <View style={getMatchMessageContainerStyle()}>
            <Text
              style={getMatchMessageStyle(!hasUnread)}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'Vocês deram match!'}
            </Text>
          </View>

          <View style={getMatchFooterStyle()}>
            <View style={getCompatibilityContainerStyle()}>
              <Ionicons
                name="heart"
                size={14}
                color={colors.secondary}
              />
              <Text style={getCompatibilityTextStyle()}>
                {item.compatibilityScore || 0}% compatível
              </Text>
            </View>

            <View style={getWorkoutPreferencesStyle()}>
              {(otherUser?.workoutPreferences || []).slice(0, 2).map((preference) => (
                <View key={(preference?.id ?? preference)?.toString()} style={getPreferenceChipStyle()}>
                  <Text style={getPreferenceChipTextStyle()}>
                    {preference.name || preference}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getContainerStyle = () => ({
    flex: 1,
    backgroundColor: colors.background,
  });

  const getHeaderStyle = () => ({
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  });

  const getHeaderTitleStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.gray[900],
    marginBottom: 4,
  });

  const getHeaderSubtitleStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[600],
  });

  const getListContainerStyle = () => ({
    flex: 1,
    backgroundColor: colors.background,
  });

  const getEmptyStateStyle = () => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  });

  const getEmptyIconStyle = () => ({
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  });

  const getEmptyTitleStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    lineHeight: 28,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  });

  const getEmptyDescriptionStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[600],
    textAlign: 'center',
  });

  const getMatchItemStyle = () => ({
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  });

  const getMatchAvatarContainerStyle = () => ({
    position: 'relative',
    marginRight: 16,
  });

  const getMatchAvatarStyle = () => ({
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  });

  const getOnlineIndicatorStyle = () => ({
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  });

  const getMatchInfoStyle = () => ({
    flex: 1,
  });

  const getMatchHeaderStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  });

  const getMatchNameStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: colors.gray[900],
    flex: 1,
  });

  const getMatchTimeStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray[500],
  });

  const getMatchLocationStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors.gray[600],
    marginBottom: 6,
  });

  const getMatchMessageContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  });

  const getMatchMessageStyle = (isRead) => ({
    fontFamily: isRead ? 'Inter-Regular' : 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: isRead ? colors.gray[600] : colors.gray[900],
    flex: 1,
  });

  const getUnreadIndicatorStyle = () => ({
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  });

  const getUnreadCountTextStyle = () => ({
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  });

  const getMatchFooterStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  });

  const getCompatibilityContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
  });

  const getCompatibilityTextStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondary,
    marginLeft: 4,
  });

  const getWorkoutPreferencesStyle = () => ({
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
  });

  const getPreferenceChipStyle = () => ({
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
    marginLeft: 4,
  });

  const getPreferenceChipTextStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.gray[700],
  });

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingSpinner visible={true} text="Carregando matches..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={getContainerStyle()}>
      {/* Header */}
      <View style={getHeaderStyle()}>
        <Text style={getHeaderTitleStyle()}>
          Matches
        </Text>
        <Text style={getHeaderSubtitleStyle()}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </Text>
      </View>

      {/* Matches List */}
      <View style={getListContainerStyle()}>
        {matches.length === 0 ? (
          <View style={getEmptyStateStyle()}>
            <View style={getEmptyIconStyle()}>
              <Ionicons
                name="heart-outline"
                size={40}
                color={colors.gray[400]}
              />
            </View>
            <Text style={getEmptyTitleStyle()}>
              Nenhum match ainda
            </Text>
            <Text style={getEmptyDescriptionStyle()}>
              Continue descobrindo pessoas para encontrar seus primeiros matches!
            </Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item, index) => {
              const id = getMatchId(item);
              return id != null ? String(id) : String(index);
            }}
            renderItem={renderMatch}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: colors.gray[50], marginLeft: 76 }} />
            )}
            windowSize={9}
            initialNumToRender={12}
            removeClippedSubviews
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default Matches;

