import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import CustomButton from '../CustomButton';
import { colors } from '../../styles/colors';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const UpcomingWorkoutList = ({ loading, workouts, onPressSchedule, onPressItem }) => {
  if (loading) {
    return <Text style={getLoadingTextStyle()}>Carregando...</Text>;
  }

  if (!workouts || workouts.length === 0) {
    return (
      <View style={getEmptyStateStyle()}>
        <Ionicons name="calendar-outline" size={22} color={colors.gray[500]} />
        <Text style={getEmptyStateTextStyle()}>
          Você ainda não tem treinos agendados.
        </Text>
        <CustomButton title="Agendar treino" onPress={onPressSchedule || (() => Alert.alert('Em breve', 'Agendamento de treino em breve.'))} />
      </View>
    );
  }

  return (
    <View>
      {workouts.map((workout) => (
        <TouchableOpacity
          key={workout.id || `${workout.scheduledAt || workout.date || ''}-${Math.random()}`}
          style={getUpcomingItemStyle()}
          activeOpacity={0.8}
          onPress={() => (onPressItem ? onPressItem(workout) : Alert.alert('Em breve', 'Detalhes do treino em breve.'))}
        >
          <View style={getUpcomingIconStyle()}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={getUpcomingTitleStyle()}>
              {workout.title || 'Treino agendado'}
            </Text>
            <Text style={getUpcomingMetaStyle()}>
              {formatDateTime(workout.scheduledAt || workout.date || workout.datetime)}
              {workout.partner?.name ? ` · com ${workout.partner.name}` : ''}
              {workout.location?.name ? ` · ${workout.location.name}` : ''}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.gray[500]} />
        </TouchableOpacity>
      ))}
    </View>
  );
};

UpcomingWorkoutList.propTypes = {
  loading: PropTypes.bool,
  workouts: PropTypes.arrayOf(PropTypes.object),
  onPressSchedule: PropTypes.func,
  onPressItem: PropTypes.func,
};

const getLoadingTextStyle = () => ({
  fontFamily: 'Inter-Regular',
  fontSize: 14,
  color: colors.gray[500],
});

const getEmptyStateStyle = () => ({
  padding: 16,
  backgroundColor: colors.white,
  borderRadius: 12,
  alignItems: 'center',
  gap: 10,
  borderWidth: 1,
  borderColor: colors.gray[100],
});

const getEmptyStateTextStyle = () => ({
  fontFamily: 'Inter-Regular',
  fontSize: 13,
  color: colors.gray[600],
  textAlign: 'center',
});

const getUpcomingItemStyle = () => ({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.white,
  padding: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.gray[100],
  marginBottom: 8,
});

const getUpcomingIconStyle = () => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: colors.primary + '15',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 12,
});

const getUpcomingTitleStyle = () => ({
  fontFamily: 'Inter-Medium',
  fontSize: 14,
  color: colors.gray[900],
});

const getUpcomingMetaStyle = () => ({
  fontFamily: 'Inter-Regular',
  fontSize: 12,
  color: colors.gray[600],
  marginTop: 2,
});

export default UpcomingWorkoutList;


