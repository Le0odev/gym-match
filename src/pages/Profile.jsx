import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import { CustomButton, LoadingOverlay } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';

const Profile = ({ navigation }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showOnline, setShowOnline] = useState(true);
  
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call
      // For now, using mock data
      const mockProfile = {
        id: user?.id || 1,
        name: user?.name || 'Usuário',
        email: user?.email || 'usuario@email.com',
        profilePicture: null,
        birthDate: '1995-03-15',
        location: 'São Paulo, SP',
        height: 175,
        weight: 70,
        experienceLevel: 'Intermediário',
        workoutPreferences: [
          { id: 1, name: 'Musculação' },
          { id: 2, name: 'Cardio' },
          { id: 3, name: 'Yoga' },
        ],
        bio: 'Apaixonado por fitness e sempre em busca de novos desafios! Vamos treinar juntos?',
        joinedAt: '2024-01-15T10:00:00Z',
        totalMatches: 12,
        completedWorkouts: 45,
      };
      
      setUserProfile(mockProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert('Em breve', 'Edição de perfil em desenvolvimento');
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Alterar Foto',
      'Escolha uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Câmera', onPress: () => console.log('Open camera') },
        { text: 'Galeria', onPress: () => console.log('Open gallery') },
      ]
    );
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
    });
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

  const getEditButtonStyle = () => ({
    padding: 8,
  });

  const getProfileSectionStyle = () => ({
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginBottom: 16,
  });

  const getProfileHeaderStyle = () => ({
    alignItems: 'center',
    marginBottom: 20,
  });

  const getAvatarContainerStyle = () => ({
    position: 'relative',
    marginBottom: 16,
  });

  const getAvatarStyle = () => ({
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  });

  const getEditPhotoButtonStyle = () => ({
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  });

  const getNameStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 4,
  });

  const getAgeLocationStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 8,
  });

  const getJoinDateStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[500],
    textAlign: 'center',
  });

  const getStatsContainerStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  });

  const getStatItemStyle = () => ({
    alignItems: 'center',
  });

  const getStatValueStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.gray[900],
  });

  const getStatLabelStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray[600],
  });

  const getSectionStyle = () => ({
    backgroundColor: colors.white,
    marginBottom: 16,
  });

  const getSectionTitleStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[900],
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  });

  const getMenuItemStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[50],
  });

  const getMenuIconStyle = () => ({
    width: 24,
    marginRight: 16,
  });

  const getMenuTextStyle = () => ({
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[700],
  });

  const getMenuArrowStyle = () => ({
    marginLeft: 8,
  });

  const getLogoutButtonStyle = () => ({
    marginHorizontal: 24,
    marginVertical: 24,
  });

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingOverlay visible={true} text="Carregando perfil..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={getContainerStyle()}>
      {/* Header */}
      <View style={getHeaderStyle()}>
        <Text style={getHeaderTitleStyle()}>
          Perfil
        </Text>
        <TouchableOpacity
          style={getEditButtonStyle()}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <Ionicons
            name="create-outline"
            size={24}
            color={colors.gray[700]}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Profile Section */}
        <View style={getProfileSectionStyle()}>
          <View style={getProfileHeaderStyle()}>
            <View style={getAvatarContainerStyle()}>
              <View style={getAvatarStyle()}>
                {userProfile?.profilePicture ? (
                  <Image
                    source={{ uri: userProfile.profilePicture }}
                    style={{ width: 100, height: 100, borderRadius: 50 }}
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={40}
                    color={colors.gray[500]}
                  />
                )}
              </View>
              <TouchableOpacity
                style={getEditPhotoButtonStyle()}
                onPress={handleChangePhoto}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="camera"
                  size={16}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
            
            <Text style={getNameStyle()}>
              {userProfile?.name}
            </Text>
            
            <Text style={getAgeLocationStyle()}>
              {calculateAge(userProfile?.birthDate)} anos • {userProfile?.location}
            </Text>
            
            <Text style={getJoinDateStyle()}>
              Membro desde {formatJoinDate(userProfile?.joinedAt)}
            </Text>
          </View>

          {/* Stats */}
          <View style={getStatsContainerStyle()}>
            <View style={getStatItemStyle()}>
              <Text style={getStatValueStyle()}>
                {userProfile?.totalMatches || 0}
              </Text>
              <Text style={getStatLabelStyle()}>Matches</Text>
            </View>
            
            <View style={getStatItemStyle()}>
              <Text style={getStatValueStyle()}>
                {userProfile?.completedWorkouts || 0}
              </Text>
              <Text style={getStatLabelStyle()}>Treinos</Text>
            </View>
            
            <View style={getStatItemStyle()}>
              <Text style={getStatValueStyle()}>
                {userProfile?.experienceLevel || 'N/A'}
              </Text>
              <Text style={getStatLabelStyle()}>Nível</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={getSectionStyle()}>
          <Text style={getSectionTitleStyle()}>
            Conta
          </Text>
          
          <TouchableOpacity
            style={getMenuItemStyle()}
            onPress={() => Alert.alert('Em breve', 'Editar informações pessoais em desenvolvimento')}
            activeOpacity={0.7}
          >
            <View style={getMenuIconStyle()}>
              <Ionicons name="person-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Informações pessoais</Text>
            <View style={getMenuArrowStyle()}>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={getMenuItemStyle()}
            onPress={() => Alert.alert('Em breve', 'Preferências de treino em desenvolvimento')}
            activeOpacity={0.7}
          >
            <View style={getMenuIconStyle()}>
              <Ionicons name="fitness-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Preferências de treino</Text>
            <View style={getMenuArrowStyle()}>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={getMenuItemStyle()}
            onPress={() => Alert.alert('Em breve', 'Configurações de privacidade em desenvolvimento')}
            activeOpacity={0.7}
          >
            <View style={getMenuIconStyle()}>
              <Ionicons name="shield-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Privacidade</Text>
            <View style={getMenuArrowStyle()}>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={getSectionStyle()}>
          <Text style={getSectionTitleStyle()}>
            Configurações
          </Text>
          
          <View style={getMenuItemStyle()}>
            <View style={getMenuIconStyle()}>
              <Ionicons name="notifications-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Notificações</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
              thumbColor={notifications ? colors.primary : colors.gray[500]}
            />
          </View>
          
          <View style={getMenuItemStyle()}>
            <View style={getMenuIconStyle()}>
              <Ionicons name="moon-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Modo escuro</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
              thumbColor={darkMode ? colors.primary : colors.gray[500]}
            />
          </View>
          
          <View style={getMenuItemStyle()}>
            <View style={getMenuIconStyle()}>
              <Ionicons name="eye-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Mostrar status online</Text>
            <Switch
              value={showOnline}
              onValueChange={setShowOnline}
              trackColor={{ false: colors.gray[300], true: colors.primary + '40' }}
              thumbColor={showOnline ? colors.primary : colors.gray[500]}
            />
          </View>
        </View>

        {/* Support */}
        <View style={getSectionStyle()}>
          <Text style={getSectionTitleStyle()}>
            Suporte
          </Text>
          
          <TouchableOpacity
            style={getMenuItemStyle()}
            onPress={() => Alert.alert('Em breve', 'Central de ajuda em desenvolvimento')}
            activeOpacity={0.7}
          >
            <View style={getMenuIconStyle()}>
              <Ionicons name="help-circle-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Central de ajuda</Text>
            <View style={getMenuArrowStyle()}>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={getMenuItemStyle()}
            onPress={() => Alert.alert('Em breve', 'Contato em desenvolvimento')}
            activeOpacity={0.7}
          >
            <View style={getMenuIconStyle()}>
              <Ionicons name="mail-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Entrar em contato</Text>
            <View style={getMenuArrowStyle()}>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={getMenuItemStyle()}
            onPress={() => Alert.alert('Em breve', 'Sobre o app em desenvolvimento')}
            activeOpacity={0.7}
          >
            <View style={getMenuIconStyle()}>
              <Ionicons name="information-circle-outline" size={24} color={colors.gray[600]} />
            </View>
            <Text style={getMenuTextStyle()}>Sobre o app</Text>
            <View style={getMenuArrowStyle()}>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <CustomButton
          title="Sair da conta"
          variant="danger"
          onPress={handleLogout}
          style={getLogoutButtonStyle()}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

