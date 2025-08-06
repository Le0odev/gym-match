import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';

const { width: screenWidth } = Dimensions.get('window');

const Dashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalMatches: 0,
    newMatches: 0,
    profileViews: 0,
    completedWorkouts: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Implement actual API calls
      // For now, using mock data
      setStats({
        totalMatches: 12,
        newMatches: 3,
        profileViews: 45,
        completedWorkouts: 8,
      });
      
      setRecentActivity([
        {
          id: 1,
          type: 'match',
          title: 'Novo match!',
          description: 'Você e Maria têm 85% de compatibilidade',
          time: '2 horas atrás',
          icon: 'heart',
          color: colors.success,
        },
        {
          id: 2,
          type: 'view',
          title: 'Perfil visualizado',
          description: 'João visualizou seu perfil',
          time: '5 horas atrás',
          icon: 'eye',
          color: colors.primary,
        },
        {
          id: 3,
          type: 'workout',
          title: 'Treino concluído',
          description: 'Treino de peito e tríceps finalizado',
          time: '1 dia atrás',
          icon: 'fitness',
          color: colors.secondary,
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
            Olá, bom dia!
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

        {/* Recent Activity */}
        <View style={getActivityStyle()}>
          <Text style={getSectionTitleStyle()}>
            Atividade Recente
          </Text>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={getActivityItemStyle()}>
              <View style={getActivityIconStyle(activity.color)}>
                <Ionicons
                  name={activity.icon}
                  size={20}
                  color={activity.color}
                />
              </View>
              <View style={getActivityContentStyle()}>
                <Text style={getActivityTitleStyle()}>
                  {activity.title}
                </Text>
                <Text style={getActivityDescriptionStyle()}>
                  {activity.description}
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

