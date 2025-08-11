import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { NativeModules } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { chatService } from '../services/chatService';
import { userService } from '../services/userService';
import { eventBus } from '../services/eventBus';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const WorkoutDetails = ({ route, navigation }) => {
  const workoutParam = route?.params?.workout || {};
  const workout = {
    ...workoutParam,
    scheduledAt: workoutParam.scheduledAt ? new Date(workoutParam.scheduledAt) : undefined,
  };
  const hasRNMaps = !!NativeModules?.RNMapsAirModule;
  let MapViewComp = null;
  let MarkerComp = null;
  if (hasRNMaps) {
    // Lazy require para evitar crash quando o módulo nativo não está instalado/buildado
    const maps = require('react-native-maps');
    MapViewComp = maps.default;
    MarkerComp = maps.Marker;
  }

  const openInMaps = () => {
    const query = encodeURIComponent(workout.location?.name || workout.address || 'Academia');
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={getContainerStyle()}>
      <View style={getHeaderStyle()}>
        <TouchableOpacity style={getBackButtonStyle()} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
        </TouchableOpacity>
        <Text style={getHeaderTitleStyle()}>Detalhes do treino</Text>
      </View>

      <View style={getContentStyle()}>
        <View style={getCardStyle()}>
          <View style={getRowStyle()}>
            <View style={getIconBadgeStyle(colors.primary)}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={getTitleStyle()}>{workout.title || 'Treino agendado'}</Text>
              <Text style={getMetaStyle()}>{formatDateTime(workout.scheduledAt)}</Text>
            </View>
          </View>

          {workout.partner?.name ? (
            <View style={[getRowStyle(), { marginTop: 16 }] }>
              <View style={getIconBadgeStyle(colors.success)}>
                <Ionicons name="people-outline" size={18} color={colors.success} />
              </View>
              <Text style={getMetaStyle()}>Com {workout.partner.name}</Text>
            </View>
          ) : null}

          {workout.location?.name ? (
            <View style={[getRowStyle(), { marginTop: 16 }] }>
              <View style={getIconBadgeStyle(colors.gray[700])}>
                <Ionicons name="location-outline" size={18} color={colors.gray[700]} />
              </View>
              <Text style={[getMetaStyle(), { flex: 1 }]}>{workout.location.name}</Text>
              <TouchableOpacity onPress={openInMaps} style={{ padding: 6 }}>
                <Ionicons name="navigate-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {hasRNMaps && typeof workout.latitude === 'number' && typeof workout.longitude === 'number' ? (
          <View style={{ marginTop: 16 }}>
            <Text style={[getMetaStyle(), { marginBottom: 8 }]}>Local no mapa</Text>
            <View style={{ height: 220, borderRadius: 12, overflow: 'hidden' }}>
              <MapViewComp
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: workout.latitude,
                  longitude: workout.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <MarkerComp
                  coordinate={{ latitude: workout.latitude, longitude: workout.longitude }}
                  title={workout.location?.name || 'Local do treino'}
                  description={formatDateTime(workout.scheduledAt)}
                />
              </MapViewComp>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 24 }}>
          <Text style={[getMetaStyle(), { marginBottom: 8 }]}>Ações</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  if (!workout.id) return;
                  // Backend só permite ao convidado aceitar/rejeitar e ao criador cancelar.
                  // Se o backend retornar 403 aqui, apenas ignora a ação no cliente.
                  await chatService.cancelWorkoutInvite(workout.id);
                  eventBus.emit('workout:updated', { id: workout.id, status: 'canceled' });
                  navigation.goBack();
                } catch (e) {
                  // Silencia erro 403
                }
              }}
              style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.gray[100], marginRight: 8 }}
            >
              <Text style={{ color: colors.gray[800], fontFamily: 'Inter-Medium' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                try {
                  if (!workout.id) return;
                  await chatService.completeWorkoutInvite(workout.id);
                  eventBus.emit('workout:completed', { id: workout.id, status: 'completed' });
                  navigation.goBack();
                } catch (e) {
                  // Se endpoint não existir neste ambiente, não falhar a UI
                }
              }}
              style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.success }}
            >
              <Text style={{ color: colors.white, fontFamily: 'Inter-Medium' }}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getContainerStyle = () => ({ flex: 1, backgroundColor: colors.background });
const getHeaderStyle = () => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 24,
  paddingVertical: 16,
  backgroundColor: colors.white,
  borderBottomWidth: 1,
  borderBottomColor: colors.gray[100],
});
const getBackButtonStyle = () => ({ padding: 8, marginRight: 12 });
const getHeaderTitleStyle = () => ({ fontFamily: 'Poppins-Bold', fontSize: 20, color: colors.gray[900] });
const getContentStyle = () => ({ flex: 1, padding: 24 });
const getCardStyle = () => ({ backgroundColor: colors.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.gray[100] });
const getRowStyle = () => ({ flexDirection: 'row', alignItems: 'center' });
const getIconBadgeStyle = (color) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 });
const getTitleStyle = () => ({ fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.gray[900] });
const getMetaStyle = () => ({ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.gray[700] });

export default WorkoutDetails;


