import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';

const Matches = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useContext(AuthContext);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call
      // For now, using mock data
      const mockMatches = [
        {
          id: 1,
          user: {
            id: 2,
            name: 'Maria Silva',
            profilePicture: null,
            location: 'São Paulo, SP',
            workoutPreferences: ['Musculação', 'Cardio'],
            lastSeen: '2024-08-06T10:30:00Z',
          },
          matchedAt: '2024-08-06T09:15:00Z',
          lastMessage: {
            text: 'Oi! Que legal que deu match! Você treina em qual academia?',
            sentAt: '2024-08-06T11:45:00Z',
            sentByMe: false,
          },
          unreadCount: 2,
        },
        {
          id: 2,
          user: {
            id: 3,
            name: 'João Santos',
            profilePicture: null,
            location: 'Rio de Janeiro, RJ',
            workoutPreferences: ['CrossFit', 'Musculação'],
            lastSeen: '2024-08-06T08:20:00Z',
          },
          matchedAt: '2024-08-05T16:30:00Z',
          lastMessage: {
            text: 'Valeu pelo match! Vamos treinar juntos?',
            sentAt: '2024-08-05T17:00:00Z',
            sentByMe: true,
          },
          unreadCount: 0,
        },
        {
          id: 3,
          user: {
            id: 4,
            name: 'Ana Costa',
            profilePicture: null,
            location: 'Belo Horizonte, MG',
            workoutPreferences: ['Pilates', 'Yoga'],
            lastSeen: '2024-08-05T19:45:00Z',
          },
          matchedAt: '2024-08-04T14:20:00Z',
          lastMessage: null,
          unreadCount: 0,
        },
      ];
      
      setMatches(mockMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Erro', 'Não foi possível carregar os matches');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMatches();
    setRefreshing(false);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  const handleMatchPress = (match) => {
    // TODO: Navigate to chat screen
    Alert.alert(
      'Chat',
      `Iniciar conversa com ${match.user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim', 
          onPress: () => {
            // TODO: Navigate to chat
            console.log('Navigate to chat with:', match.user.name);
          }
        },
      ]
    );
  };

  const renderMatch = ({ item: match }) => {
    const getMatchItemStyle = () => ({
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[100],
    });

    const getAvatarStyle = () => ({
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.gray[200],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    });

    const getContentStyle = () => ({
      flex: 1,
    });

    const getNameStyle = () => ({
      fontFamily: 'Poppins-SemiBold',
      fontSize: 16,
      lineHeight: 24,
      color: colors.gray[900],
      marginBottom: 2,
    });

    const getLastMessageStyle = () => ({
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: match.unreadCount > 0 ? colors.gray[900] : colors.gray[600],
      marginBottom: 2,
    });

    const getLocationStyle = () => ({
      fontFamily: 'Inter-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: colors.gray[500],
    });

    const getRightContentStyle = () => ({
      alignItems: 'flex-end',
    });

    const getTimeStyle = () => ({
      fontFamily: 'Inter-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: colors.gray[500],
      marginBottom: 4,
    });

    const getUnreadBadgeStyle = () => ({
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    });

    const getUnreadTextStyle = () => ({
      fontFamily: 'Inter-Bold',
      fontSize: 12,
      lineHeight: 16,
      color: colors.white,
    });

    const getImageSource = () => {
      if (match.user.profilePicture) {
        return { uri: match.user.profilePicture };
      }
      return null;
    };

    return (
      <TouchableOpacity
        style={getMatchItemStyle()}
        onPress={() => handleMatchPress(match)}
        activeOpacity={0.7}
      >
        <View style={getAvatarStyle()}>
          {match.user.profilePicture ? (
            <Image
              source={getImageSource()}
              style={{ width: 60, height: 60, borderRadius: 30 }}
            />
          ) : (
            <Ionicons
              name="person"
              size={24}
              color={colors.gray[500]}
            />
          )}
        </View>
        
        <View style={getContentStyle()}>
          <Text style={getNameStyle()}>
            {match.user.name}
          </Text>
          
          {match.lastMessage ? (
            <Text
              style={getLastMessageStyle()}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {match.lastMessage.sentByMe ? 'Você: ' : ''}
              {match.lastMessage.text}
            </Text>
          ) : (
            <Text style={getLastMessageStyle()}>
              Diga olá para {match.user.name}!
            </Text>
          )}
          
          <Text style={getLocationStyle()}>
            {match.user.location}
          </Text>
        </View>
        
        <View style={getRightContentStyle()}>
          <Text style={getTimeStyle()}>
            {match.lastMessage 
              ? formatTime(match.lastMessage.sentAt)
              : formatTime(match.matchedAt)
            }
          </Text>
          
          {match.unreadCount > 0 && (
            <View style={getUnreadBadgeStyle()}>
              <Text style={getUnreadTextStyle()}>
                {match.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    const getEmptyStateStyle = () => ({
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    });

    const getEmptyIconStyle = () => ({
      marginBottom: 16,
    });

    const getEmptyTitleStyle = () => ({
      fontFamily: 'Poppins-Bold',
      fontSize: 20,
      lineHeight: 28,
      color: colors.gray[700],
      textAlign: 'center',
      marginBottom: 8,
    });

    const getEmptySubtitleStyle = () => ({
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: colors.gray[500],
      textAlign: 'center',
      marginBottom: 24,
    });

    const getDiscoverButtonStyle = () => ({
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
    });

    const getDiscoverButtonTextStyle = () => ({
      fontFamily: 'Poppins-SemiBold',
      fontSize: 16,
      lineHeight: 24,
      color: colors.white,
    });

    return (
      <View style={getEmptyStateStyle()}>
        <View style={getEmptyIconStyle()}>
          <Ionicons
            name="heart-outline"
            size={64}
            color={colors.gray[400]}
          />
        </View>
        
        <Text style={getEmptyTitleStyle()}>
          Nenhum match ainda
        </Text>
        
        <Text style={getEmptySubtitleStyle()}>
          Comece a descobrir pessoas e encontre seu parceiro de treino ideal!
        </Text>
        
        <TouchableOpacity
          style={getDiscoverButtonStyle()}
          onPress={() => navigation.navigate('Discover')}
          activeOpacity={0.8}
        >
          <Text style={getDiscoverButtonTextStyle()}>
            Descobrir Pessoas
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getContainerStyle = () => ({
    flex: 1,
    backgroundColor: colors.background,
  });

  const getHeaderStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  });

  const getHeaderTitleStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.gray[900],
  });

  const getMatchCountStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[600],
  });

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingSpinner text="Carregando matches..." />
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
        <Text style={getMatchCountStyle()}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </Text>
      </View>

      {/* Matches List */}
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          matches.length === 0 ? { flex: 1 } : undefined
        }
      />
    </SafeAreaView>
  );
};

export default Matches;

