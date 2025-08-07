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

const Matches = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    loadMatches();
    loadUnreadCounts();
  }, []);

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
      const counts = {};
      for (const match of matches) {
        try {
          const count = await chatService.getMatchUnreadCount(match.id);
          counts[match.id] = count.unreadCount;
        } catch (error) {
          console.error(`Error loading unread count for match ${match.id}:`, error);
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

  const handleMatchPress = (match) => {
    navigation.navigate('Chat', {
      matchId: match.id,
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
    const unreadCount = unreadCounts[item.id] || 0;
    const hasUnread = unreadCount > 0;
    
    return (
      <TouchableOpacity
        style={getMatchItemStyle()}
        onPress={() => handleMatchPress(item)}
        activeOpacity={0.7}
      >
        <View style={getMatchAvatarContainerStyle()}>
          <View style={getMatchAvatarStyle()}>
            {item.otherUser?.profilePicture ? (
              <Image
                source={{ uri: item.otherUser.profilePicture }}
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
          {item.otherUser?.isOnline && (
            <View style={getOnlineIndicatorStyle()} />
          )}
        </View>

        <View style={getMatchInfoStyle()}>
          <View style={getMatchHeaderStyle()}>
            <Text style={getMatchNameStyle()}>
              {item.otherUser?.name || 'Usuário'}
            </Text>
            <Text style={getMatchTimeStyle()}>
              {formatLastMessageTime(item.lastMessage?.createdAt)}
            </Text>
          </View>

          <Text style={getMatchLocationStyle()}>
            {item.otherUser?.age ? `${item.otherUser.age} anos` : ''} 
            {item.otherUser?.age && item.otherUser?.location ? ' • ' : ''}
            {item.otherUser?.location || ''}
          </Text>

          <View style={getMatchMessageContainerStyle()}>
            <Text
              style={getMatchMessageStyle(!hasUnread)}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'Vocês deram match!'}
            </Text>
            {hasUnread && (
              <View style={getUnreadIndicatorStyle()}>
                <Text style={getUnreadCountTextStyle()}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
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
              {(item.otherUser?.workoutPreferences || []).slice(0, 2).map((preference, index) => (
                <View key={index} style={getPreferenceChipStyle()}>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  });

  const getMatchAvatarContainerStyle = () => ({
    position: 'relative',
    marginRight: 16,
  });

  const getMatchAvatarStyle = () => ({
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gray[200],
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
    marginBottom: 4,
  });

  const getMatchNameStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    lineHeight: 24,
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
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[600],
    marginBottom: 8,
  });

  const getMatchMessageContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    marginLeft: 4,
  });

  const getPreferenceChipTextStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    lineHeight: 14,
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMatch}
            showsVerticalScrollIndicator={false}
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

