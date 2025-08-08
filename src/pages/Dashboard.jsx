import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';

const { width: screenWidth } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalMatches: 0,
    newMatches: 0,
    profileViews: 0,
    completedWorkouts: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
    // Polling leve para atualizar atividade/notifications em tempo quase real
    const interval = setInterval(() => {
      loadDashboardData();
    }, 15000); // 15s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas do usuário e matches
      const [userStats, matchStats, matches, notifications] = await Promise.all([
        userService.getUserStats().catch(() => ({ profileViews: 0, completedWorkouts: 0 })),
        userService.getMatchStats().catch(() => ({ totalMatches: 0, newMatches: 0 })),
        userService.getMatches({ limit: 3 }).catch(() => []),
        notificationService.getNotifications({ limit: 5, unreadOnly: true }).catch(() => ({ notifications: [] }))
      ]);

      // Combinar estatísticas
      setStats({
        totalMatches: matchStats.totalMatches || 0,
        newMatches: matchStats.newMatches || 0,
        profileViews: userStats.profileViews || 0,
        completedWorkouts: userStats.completedWorkouts || 0,
      });

      // Carregar matches recentes
      setRecentMatches((Array.isArray(matches) ? matches : []).slice(0, 3));

      // Converter notificações em atividade recente (com foto quando houver sender)
      const recentActivityFromNotifications = (notifications.notifications || notifications || []).map(notification => ({
        id: notification.id,
        type: notification.type,
        title: getNotificationTitle(notification.type),
        description: notification.message || getNotificationDescription(notification.type),
        time: getTimeAgo(new Date(notification.createdAt)),
        icon: getNotificationIcon(notification.type),
        color: getNotificationColor(notification.type),
        photoUrl: notification.data?.sender?.profilePicture || null,
        senderName: notification.data?.sender?.name || null,
      }));

      // Se não há notificações suficientes, adicionar atividades simuladas
      const fallbackActivities = [];
      if (recentActivityFromNotifications.length < 3) {
        const needed = 3 - recentActivityFromNotifications.length;
        for (let i = 0; i < needed; i++) {
          fallbackActivities.push({
            id: `fallback-${i}`,
            type: 'system',
            title: 'Bem-vindo!',
            description: 'Complete seu perfil para encontrar mais parceiros',
            time: getTimeAgo(new Date()),
            icon: 'information-circle',
            color: colors.primary,
          });
        }
      }

      setRecentActivity([...recentActivityFromNotifications, ...fallbackActivities]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback para dados mock em caso de erro
      setStats({
        totalMatches: 0,
        newMatches: 0,
        profileViews: 0,
        completedWorkouts: 0,
      });
      setRecentActivity([
        {
          id: 'error-1',
          type: 'system',
          title: 'Erro de conexão',
          description: 'Verifique sua conexão com a internet',
          time: getTimeAgo(new Date()),
          icon: 'warning',
          color: colors.error,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTitle = (type) => {
    const titles = {
      MATCH: 'Novo match!',
      MESSAGE: 'Nova mensagem',
      LIKE: 'Alguém curtiu você!',
      SUPER_LIKE: 'Super like recebido!',
      WORKOUT_REMINDER: 'Hora do treino',
      PROFILE_VIEW: 'Perfil visualizado',
      SYSTEM: 'Notificação do sistema',
    };
    return titles[type] || 'Notificação';
  };

  const getNotificationDescription = (type) => {
    const descriptions = {
      MATCH: 'Você tem um novo match',
      MESSAGE: 'Você recebeu uma nova mensagem',
      LIKE: 'Seu perfil foi curtido',
      SUPER_LIKE: 'Alguém te deu um super like',
      WORKOUT_REMINDER: 'Não esqueça do seu treino',
      PROFILE_VIEW: 'Seu perfil foi visualizado',
      SYSTEM: 'Informação importante',
    };
    return descriptions[type] || 'Nova notificação';
  };

  const getNotificationIcon = (type) => {
    const icons = {
      MATCH: 'heart',
      MESSAGE: 'chatbubble',
      LIKE: 'heart-outline',
      SUPER_LIKE: 'star',
      WORKOUT_REMINDER: 'fitness',
      PROFILE_VIEW: 'eye',
      SYSTEM: 'information-circle',
    };
    return icons[type] || 'notifications';
  };

  const getNotificationColor = (type) => {
    const colors_map = {
      MATCH: colors.success,
      MESSAGE: colors.primary,
      LIKE: colors.secondary,
      SUPER_LIKE: '#FFD700', // Gold
      WORKOUT_REMINDER: colors.secondary,
      PROFILE_VIEW: colors.primary,
      SYSTEM: colors.gray[600],
    };
    return colors_map[type] || colors.primary;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 dia atrás';
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia!';
    if (hour < 18) return 'Boa tarde!';
    return 'Boa noite!';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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

  const getGreetingStyle = () => ({
    flex: 1,
  });

  const getGreetingTextStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[600],
  });

  const getUserNameStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.gray[900],
  });

  const getProfileButtonStyle = () => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  });

  const getContentStyle = () => ({
    flex: 1,
    paddingHorizontal: 24,
  });

  const getStatsContainerStyle = () => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 24,
  });

  const getStatCardStyle = () => ({
    width: (screenWidth - 56) / 2, // Account for padding and gap
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  });

  const getStatValueStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.gray[900],
    marginBottom: 4,
  });

  const getStatLabelStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray[600],
  });

  const getQuickActionsStyle = () => ({
    marginBottom: 24,
  });

  const getSectionTitleStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.gray[900],
    marginBottom: 16,
  });

  const getActionsRowStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
  });

  const getActionButtonStyle = () => ({
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  });

  const getActionIconStyle = () => ({
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  });

  const getActionTextStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray[700],
    textAlign: 'center',
  });

  const getActivityStyle = () => ({
    marginBottom: 24,
  });

  const getActivityItemStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  });

  const getActivityIconStyle = (color) => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  });

  const getActivityContentStyle = () => ({
    flex: 1,
  });

  const getActivityTitleStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[900],
    marginBottom: 2,
  });

  const getActivityDescriptionStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray[600],
    marginBottom: 2,
  });

  const getActivityTimeStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.gray[500],
  });

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingSpinner text="Carregando dashboard..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={getContainerStyle()}>
      {/* Header */}
      <View style={getHeaderStyle()}>
        <View style={getGreetingStyle()}>
          <Text style={getGreetingTextStyle()}>
            {getGreeting()}
          </Text>
          <Text style={getUserNameStyle()}>
            {user?.name || 'Usuário'}
          </Text>
        </View>
        <TouchableOpacity
          style={getProfileButtonStyle()}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="person"
            size={20}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={getContentStyle()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Stats */}
        <View style={getStatsContainerStyle()}>
          <View style={getStatCardStyle()}>
            <Text style={getStatValueStyle()}>{stats.totalMatches}</Text>
            <Text style={getStatLabelStyle()}>Total de Matches</Text>
          </View>
          
          <View style={getStatCardStyle()}>
            <Text style={getStatValueStyle()}>{stats.newMatches}</Text>
            <Text style={getStatLabelStyle()}>Novos Matches</Text>
          </View>
          
          <View style={getStatCardStyle()}>
            <Text style={getStatValueStyle()}>{stats.profileViews}</Text>
            <Text style={getStatLabelStyle()}>Visualizações</Text>
          </View>
          
          <View style={getStatCardStyle()}>
            <Text style={getStatValueStyle()}>{stats.completedWorkouts}</Text>
            <Text style={getStatLabelStyle()}>Treinos Concluídos</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={getQuickActionsStyle()}>
          <Text style={getSectionTitleStyle()}>
            Ações Rápidas
          </Text>
          <View style={getActionsRowStyle()}>
            <TouchableOpacity
              style={getActionButtonStyle()}
              onPress={() => navigation.navigate('Discover')}
              activeOpacity={0.8}
            >
              <View style={getActionIconStyle()}>
                <Ionicons
                  name="search"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={getActionTextStyle()}>
                Descobrir
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={getActionButtonStyle()}
              onPress={() => navigation.navigate('Matches')}
              activeOpacity={0.8}
            >
              <View style={getActionIconStyle()}>
                <Ionicons
                  name="heart"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={getActionTextStyle()}>
                Matches
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={getActionButtonStyle()}
              onPress={() => {
                // TODO: Navigate to workout tracker
                console.log('Navigate to workout tracker');
              }}
              activeOpacity={0.8}
            >
              <View style={getActionIconStyle()}>
                <Ionicons
                  name="fitness"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={getActionTextStyle()}>
                Treinar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <View style={getActivityStyle()}>
            <Text style={getSectionTitleStyle()}>
              Matches Recentes
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 24 }}
            >
              {recentMatches.map((match, index) => (
                <TouchableOpacity
                  key={match.id || index}
                  style={{
                    width: 120,
                    marginRight: 16,
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                    shadowColor: colors.black,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                  onPress={() => navigation.navigate('Chat', { matchId: match.id })}
                  activeOpacity={0.8}
                >
                  <View style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: colors.gray[100],
                    marginBottom: 8,
                    overflow: 'hidden',
                  }}>
                    {match.user?.profilePicture ? (
                      <Image
                        source={{ uri: match.user.profilePicture }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons
                          name="person"
                          size={24}
                          color={colors.gray[400]}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 12,
                    color: colors.gray[900],
                    textAlign: 'center',
                  }}>
                    {match.user?.name || 'Usuário'}
                  </Text>
                  {match.compatibility && (
                    <Text style={{
                      fontFamily: 'Inter-Regular',
                      fontSize: 10,
                      color: colors.primary,
                      marginTop: 2,
                    }}>
                      {match.compatibility}% match
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Activity */}
        <View style={getActivityStyle()}>
          <Text style={getSectionTitleStyle()}>
            Atividade Recente
          </Text>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={getActivityItemStyle()}>
          {activity.photoUrl ? (
            <View style={[getActivityIconStyle(activity.color), { overflow: 'hidden' }] }>
              <Image source={{ uri: activity.photoUrl }} style={{ width: 40, height: 40 }} />
            </View>
          ) : (
            <View style={getActivityIconStyle(activity.color)}>
              <Ionicons
                name={activity.icon}
                size={20}
                color={activity.color}
              />
            </View>
          )}
              <View style={getActivityContentStyle()}>
                <Text style={getActivityTitleStyle()}>
                  {activity.title}
                </Text>
                <Text style={getActivityDescriptionStyle()}>
                  {activity.senderName ? `${activity.senderName}: ` : ''}{activity.description}
                </Text>
                <Text style={getActivityTimeStyle()}>
                  {activity.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;

