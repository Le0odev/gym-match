import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomButton, CustomInput, LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';

const editProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.date().optional(),
});

const EditProfile = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workoutPreferences, setWorkoutPreferences] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDate, setBirthDate] = useState(null);
  const { profile } = route.params || {};

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: profile?.name || '',
      bio: profile?.bio || '',
      height: profile?.height?.toString() || '',
      weight: profile?.weight?.toString() || '',
      location: profile?.location || '',
      experienceLevel: profile?.experienceLevel || '',
      gender: profile?.gender || '',
    },
  });

  useEffect(() => {
    if (profile?.birthDate) {
      setBirthDate(new Date(profile.birthDate));
    }
    loadWorkoutPreferences();
  }, [profile]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
      setValue('birthDate', selectedDate);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR');
  };

  const loadWorkoutPreferences = async () => {
  });

  useEffect(() => {
    loadWorkoutPreferences();
    if (profile?.workoutPreferences) {
      setSelectedPreferences(profile.workoutPreferences.map(p => p.id));
    }
  }, []);

  const loadWorkoutPreferences = async () => {
    try {
      setLoading(true);
      const preferences = await userService.getWorkoutPreferences();
      setWorkoutPreferences(preferences);
    } catch (error) {
      console.error('Error loading workout preferences:', error);
      Alert.alert('Erro', 'Não foi possível carregar as preferências de treino');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      
      // Converter altura e peso para números
      const profileData = {
        ...data,
        height: data.height ? parseFloat(data.height) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
      };

      // Atualizar perfil
      await userService.updateProfile(profileData);
      
      // Atualizar preferências de treino se houver mudanças
      if (selectedPreferences.length > 0) {
        await userService.updateWorkoutPreferences(selectedPreferences);
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (preferenceId) => {
    setSelectedPreferences(prev => {
      if (prev.includes(preferenceId)) {
        return prev.filter(id => id !== preferenceId);
      } else {
        return [...prev, preferenceId];
      }
    });
  };

  const getContainerStyle = () => ({
    flex: 1,
    backgroundColor: colors.background,
  });

  const getHeaderStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  });

  const getBackButtonStyle = () => ({
    padding: 8,
    marginRight: 16,
  });

  const getHeaderTitleStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.gray[900],
    flex: 1,
  });

  const getSectionStyle = () => ({
    backgroundColor: colors.white,
    marginBottom: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
  });

  const getSectionTitleStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[900],
    marginBottom: 16,
  });

  const getInputContainerStyle = () => ({
    marginBottom: 16,
  });

  const getPickerContainerStyle = () => ({
    marginBottom: 16,
  });

  const getPickerLabelStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[700],
    marginBottom: 8,
  });

  const getPickerButtonStyle = (isSelected) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: isSelected ? colors.primary : colors.gray[300],
    borderRadius: 8,
    backgroundColor: isSelected ? colors.primary + '10' : colors.white,
  });

  const getPickerButtonTextStyle = (isSelected) => ({
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: isSelected ? colors.primary : colors.gray[700],
  });

  const getPreferencesGridStyle = () => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  });

  const getPreferenceChipStyle = (isSelected) => ({
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isSelected ? colors.primary : colors.gray[300],
    backgroundColor: isSelected ? colors.primary : colors.white,
    marginRight: 8,
    marginBottom: 8,
  });

  const getPreferenceChipTextStyle = (isSelected) => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: isSelected ? colors.white : colors.gray[700],
  });

  const getSaveButtonStyle = () => ({
    marginHorizontal: 24,
    marginVertical: 24,
  });

  const experienceLevels = ['Iniciante', 'Intermediário', 'Avançado'];
  const genders = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Feminino' },
    { value: 'other', label: 'Outro' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingSpinner visible={true} text="Carregando..." />
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
        <Text style={getHeaderTitleStyle()}>
          Editar Perfil
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Informações Básicas */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>
              Informações Básicas
            </Text>

            <View style={getInputContainerStyle()}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Nome"
                    placeholder="Seu nome completo"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    leftIcon="person-outline"
                  />
                )}
              />
            </View>

            <View style={getInputContainerStyle()}>
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Bio"
                    placeholder="Conte um pouco sobre você..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.bio?.message}
                    multiline
                    numberOfLines={4}
                    leftIcon="document-text-outline"
                  />
                )}
              />
            </View>

            <View style={getInputContainerStyle()}>
              <Controller
                control={control}
                name="location"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Localização"
                    placeholder="Cidade, Estado"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.location?.message}
                    leftIcon="location-outline"
                  />
                )}
              />
            </View>
          </View>

          {/* Informações Físicas */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>
              Informações Físicas
            </Text>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="height"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <CustomInput
                      label="Altura (cm)"
                      placeholder="175"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.height?.message}
                      keyboardType="numeric"
                      leftIcon="resize-outline"
                    />
                  )}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="weight"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <CustomInput
                      label="Peso (kg)"
                      placeholder="70"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.weight?.message}
                      keyboardType="numeric"
                      leftIcon="barbell-outline"
                    />
                  )}
                />
              </View>
            </View>
          </View>

          {/* Nível de Experiência */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>
              Nível de Experiência
            </Text>

            <View style={getPickerContainerStyle()}>
              {experienceLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    getPickerButtonStyle(watch('experienceLevel') === level),
                    { marginBottom: 8 }
                  ]}
                  onPress={() => setValue('experienceLevel', level)}
                  activeOpacity={0.7}
                >
                  <Text style={getPickerButtonTextStyle(watch('experienceLevel') === level)}>
                    {level}
                  </Text>
                  {watch('experienceLevel') === level && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Gênero */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>
              Gênero
            </Text>

            <View style={getPickerContainerStyle()}>
              {genders.map((gender) => (
                <TouchableOpacity
                  key={gender.value}
                  style={[
                    getPickerButtonStyle(watch('gender') === gender.value),
                    { marginBottom: 8 }
                  ]}
                  onPress={() => setValue('gender', gender.value)}
                  activeOpacity={0.7}
                >
                  <Text style={getPickerButtonTextStyle(watch('gender') === gender.value)}>
                    {gender.label}
                  </Text>
                  {watch('gender') === gender.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preferências de Treino */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>
              Preferências de Treino
            </Text>

            <View style={getPreferencesGridStyle()}>
              {workoutPreferences.map((preference) => (
                <TouchableOpacity
                  key={preference.id}
                  style={getPreferenceChipStyle(selectedPreferences.includes(preference.id))}
                  onPress={() => togglePreference(preference.id)}
                  activeOpacity={0.7}
                >
                  <Text style={getPreferenceChipTextStyle(selectedPreferences.includes(preference.id))}>
                    {preference.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Botão Salvar */}
          <CustomButton
            title="Salvar Alterações"
            onPress={handleSubmit(onSubmit)}
            loading={saving}
            style={getSaveButtonStyle()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfile;

