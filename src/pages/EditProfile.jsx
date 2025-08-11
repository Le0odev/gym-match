import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomButton, CustomInput, LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const editProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  goal: z.string().max(200, 'Objetivo deve ter no máximo 200 caracteres').optional(),
  availableTime: z.string().max(100, 'Tempo disponível deve ter no máximo 100 caracteres').optional(),
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [workoutPreferences, setWorkoutPreferences] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDate, setBirthDate] = useState(null);
  const { profile, isFirstTime } = route.params || {};
  const { completeProfile, updateUser } = useAuth();

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
      goal: profile?.goal || '',
      availableTime: profile?.availableTime || '',
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
    if (profile?.profilePicture) {
      setProfilePhoto(profile.profilePicture);
    }
    loadWorkoutPreferences();
  }, [profile]);

  const handleSelectPhoto = async () => {
    try {
      // Solicitar permissão para acessar a galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configurações', onPress: () => ImagePicker.openAppSettingsAsync() }
          ]
        );
        return;
      }

      // Mostrar opções de seleção
      Alert.alert(
        'Selecionar Foto',
        'Escolha uma opção:',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Câmera', onPress: () => openCamera() },
          { text: 'Galeria', onPress: () => openGallery() }
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Erro', 'Não foi possível acessar as fotos.');
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para usar a câmera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Erro', 'Não foi possível abrir a galeria.');
    }
  };

  const uploadPhoto = async (imageAsset) => {
    try {
      setUploadingPhoto(true);

      const photoFile = {
        uri: imageAsset.uri,
        // Padroniza para o mesmo formato do fluxo de upload na tela Perfil
        type: 'image/jpeg',
        fileName: 'profile-photo.jpg',
      };

      const response = await userService.uploadPhoto(photoFile);
      
      if (response.photoUrl) {
        setProfilePhoto(response.photoUrl);
        Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Erro', error.message || 'Não foi possível fazer upload da foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

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

      // Atualizar dados do usuário no contexto
      await updateUser();

      if (isFirstTime) {
        // Para usuários de primeira vez, marcar como perfil completo e navegar para o dashboard
        Alert.alert('Sucesso', 'Perfil criado com sucesso! Bem-vindo ao GymMatch!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Marcar o perfil como completo
              completeProfile();
              // A navegação será automática quando o estado mudar
            }
          }
        ]);
      } else {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
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
        {!isFirstTime && (
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
        )}
        <Text style={getHeaderTitleStyle()}>
          {isFirstTime ? 'Complete seu Perfil' : 'Editar Perfil'}
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
          {/* Foto de Perfil */}
          <View style={getSectionStyle()}>
            <Text style={getSectionTitleStyle()}>
              Foto de Perfil
            </Text>
            
            <View style={{
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <TouchableOpacity
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: colors.gray[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: colors.gray[200],
                  overflow: 'hidden',
                }}
                onPress={handleSelectPhoto}
                activeOpacity={0.7}
              >
                {profilePhoto ? (
                  <Image
                    source={{ uri: profilePhoto }}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 60,
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons
                      name="camera"
                      size={32}
                      color={colors.gray[400]}
                    />
                    <Text style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 12,
                      color: colors.gray[500],
                      marginTop: 8,
                      textAlign: 'center',
                    }}>
                      Adicionar{'\n'}Foto
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <CustomButton
                title={profilePhoto ? "Alterar Foto" : "Adicionar Foto"}
                onPress={handleSelectPhoto}
                variant="outline"
                size="small"
                loading={uploadingPhoto}
                disabled={uploadingPhoto}
              />
            </View>
          </View>

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
                name="goal"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Objetivo"
                    placeholder="Ex.: Ganho de massa, emagrecimento..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.goal?.message}
                    leftIcon="flag-outline"
                  />
                )}
              />
            </View>

            <View style={getInputContainerStyle()}>
              <Controller
                control={control}
                name="availableTime"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Tempo disponível"
                    placeholder="Ex.: Manhãs, Noites, 3x por semana"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.availableTime?.message}
                    leftIcon="time-outline"
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

