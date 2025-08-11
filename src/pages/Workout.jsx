import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, LoadingSpinner, UpcomingWorkoutList } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';
import { chatService } from '../services/chatService';
import { eventBus } from '../services/eventBus';

const Workout = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ completedWorkouts: 0 });
  const [userPreferences, setUserPreferences] = useState([]);
  const [popularPreferences, setPopularPreferences] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      await loadData();
    })();
    const off1 = eventBus.on('workout:updated', () => onRefresh());
    const off2 = eventBus.on('workout:completed', () => onRefresh());
    return () => {
      off1 && off1();
      off2 && off2();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingUpcoming(true);
      const [userStats, prefs, upcoming] = await Promise.all([
        userService.getUserStats().catch(() => ({ completedWorkouts: 0 })),
        userService.getProfile().then((p) => p?.workoutPreferences || []).catch(() => []),
        // Combina notificações/convites aceitos
        Promise.all([
          userService.getUpcomingWorkouts(5).catch(() => []),
          chatService.getAcceptedWorkoutInvites({ matchesLimit: 20 }).catch(() => []),
        ])
          .then(([a, b]) => [...a, ...b])
          .catch(() => []),
      ]);
      setStats({ completedWorkouts: userStats.completedWorkouts || 0 });
      setUserPreferences(prefs);

      const normalized = (Array.isArray(upcoming) ? upcoming : [])
        .map((w) => ({ ...w, scheduledAt: w.scheduledAt ? new Date(w.scheduledAt) : undefined }))
        .filter((w) => w.scheduledAt && !Number.isNaN(w.scheduledAt.getTime()))
        .filter((w) => !w.status || (w.status !== 'canceled' && w.status !== 'completed'))
        .sort((a, b) => a.scheduledAt - b.scheduledAt);
      setUpcomingWorkouts(normalized);
    } catch (error) {
      setStats({ completedWorkouts: 0 });
      setUserPreferences([]);
      setUpcomingWorkouts([]);
    } finally {
      setLoading(false);
      setLoadingUpcoming(false);
    }

    try {
      setLoadingPopular(true);
      const popular = await userService.getPopularWorkoutPreferences(12);
      setPopularPreferences(Array.isArray(popular) ? popular : []);
    } catch {
      setPopularPreferences([]);
    } finally {
      setLoadingPopular(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const navigateToPreferences = () => {
    navigation.navigate('WorkoutPreferences');
  };

  const renderChips = (items = [], onPress) => {
    if (!items.length) return null;
    return (
      <View style={getChipsContainerStyle()}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id || item.name}
            style={getChipStyle()}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text style={getChipTextStyle()}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingSpinner visible text="Carregando treinos..." />
      </SafeAreaView>
    );
  }

  const hasPreferences = userPreferences && userPreferences.length > 0;

  return (
    <SafeAreaView style={getContainerStyle()}>
      {/* Header */}
      <View style={getHeaderStyle()}>
        <Text style={getHeaderTitleStyle()}>Treinos</Text>
        <TouchableOpacity onPress={navigateToPreferences} style={getHeaderActionStyle()}>
          <Ionicons name="settings-outline" size={22} color={colors.gray[700]} />
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
        <View style={getStatsRowStyle()}>
          <View style={getStatCardStyle()}>
            <View style={getStatIconStyle(colors.success)}>
              <Ionicons name="barbell" size={18} color={colors.success} />
            </View>
            <Text style={getStatValueStyle()}>{stats.completedWorkouts}</Text>
            <Text style={getStatLabelStyle()}>Treinos concluídos</Text>
          </View>
          <View style={getStatCardStyle()}>
            <View style={getStatIconStyle(colors.primary)}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <Text style={getStatValueStyle()}>Hoje</Text>
            <Text style={getStatLabelStyle()}>Organize seu treino</Text>
          </View>
        </View>

        {/* Próximos treinos */}
        <View style={{ marginBottom: 24 }}>
          <Text style={getSectionTitleStyle()}>Próximos treinos</Text>
          <UpcomingWorkoutList
            loading={loadingUpcoming}
            workouts={upcomingWorkouts}
            onPressSchedule={() => Alert.alert('Em breve', 'Agendamento de treino em breve.')}
            onPressItem={(workout) => navigation.navigate('WorkoutDetails', { workout: { ...workout, scheduledAt: workout.scheduledAt?.toISOString?.() } })}
          />
        </View>

        {/* Minhas preferências */}
        <View style={{ marginBottom: 24 }}>
          <Text style={getSectionTitleStyle()}>Minhas preferências</Text>
          {hasPreferences ? (
            renderChips(userPreferences, navigateToPreferences)
          ) : (
            <View style={getEmptyStateStyle()}>
              <Ionicons name="information-circle-outline" size={22} color={colors.gray[500]} />
              <Text style={getEmptyStateTextStyle()}>
                Defina suas preferências de treino para personalizar sugestões
              </Text>
              <CustomButton title="Configurar preferências" onPress={navigateToPreferences} />
            </View>
          )}
        </View>

        {/* Sugestões populares */}
        <View style={{ marginBottom: 24 }}>
          <Text style={getSectionTitleStyle()}>Sugestões populares</Text>
          {loadingPopular ? (
            <Text style={getLoadingTextStyle()}>Carregando...</Text>
          ) : (
            renderChips(popularPreferences, navigateToPreferences) || (
              <Text style={getLoadingTextStyle()}>Sem sugestões no momento.</Text>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getContainerStyle = () => ({ flex: 1, backgroundColor: colors.background });
const getHeaderStyle = () => ({
  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.white,
  borderBottomWidth: 1, borderBottomColor: colors.gray[100],
});
const getHeaderTitleStyle = () => ({ fontFamily: 'Poppins-Bold', fontSize: 20, lineHeight: 28, color: colors.gray[900] });
const getHeaderActionStyle = () => ({ padding: 6, marginLeft: 8 });
const getContentStyle = () => ({ flex: 1, paddingHorizontal: 24 });
const getStatsRowStyle = () => ({ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 });
const getStatCardStyle = () => ({
  flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 16, marginHorizontal: 4,
  alignItems: 'flex-start', shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
});
const getStatIconStyle = (color) => ({
  width: 36, height: 36, borderRadius: 18, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
});
const getStatValueStyle = () => ({ fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.gray[900] });
const getStatLabelStyle = () => ({ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.gray[600] });
const getSectionTitleStyle = () => ({ fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.gray[900], marginBottom: 12 });
const getChipsContainerStyle = () => ({ flexDirection: 'row', flexWrap: 'wrap', gap: 8 });
const getChipStyle = () => ({ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[300] });
const getChipTextStyle = () => ({ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.gray[800] });
const getEmptyStateStyle = () => ({ padding: 16, backgroundColor: colors.white, borderRadius: 12, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.gray[100] });
const getEmptyStateTextStyle = () => ({ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.gray[600], textAlign: 'center' });
const getLoadingTextStyle = () => ({ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.gray[500] });

export default Workout;



