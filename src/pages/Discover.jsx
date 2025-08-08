import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  Alert,
  PanResponder,
  Animated,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { UserCard, LoadingSpinner, CustomButton } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Discover = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noMoreUsers, setNoMoreUsers] = useState(false);
  const [filters, setFilters] = useState({
    distance: 25,
    ageRange: [18, 50],
    workoutPreferences: [],
    experienceLevel: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [workoutPreferences, setWorkoutPreferences] = useState([]);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  
  const { user } = useAuth();
  
  // Animation values
  const position = new Animated.ValueXY();
  const rotate = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  
  const rotateAndTranslate = {
    transform: [
      { rotate },
      ...position.getTranslateTransform(),
    ],
  };
  
  const likeOpacity = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  
  const nopeOpacity = position.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadUsers();
    loadWorkoutPreferences();
  }, []);

  const loadWorkoutPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const preferences = await userService.getWorkoutPreferences();
      setWorkoutPreferences(preferences || []);
    } catch (error) {
      console.error('Error loading workout preferences:', error);
      setWorkoutPreferences([]);
    } finally {
      setLoadingPreferences(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Usar filtros para descobrir usuários com API real
      const discoveredUsers = await userService.discoverUsers({
        distance: filters.distance,
        minAge: filters.ageRange[0],
        maxAge: filters.ageRange[1],
        workoutPreferences: filters.workoutPreferences,
        experienceLevel: filters.experienceLevel,
        limit: 10,
        offset: 0,
      });
      
      if (discoveredUsers && discoveredUsers.length > 0) {
        // Calcular compatibilidade para cada usuário
        const usersWithCompatibility = await Promise.all(
          discoveredUsers.map(async (discoveredUser) => {
            try {
              const compatibility = await userService.getCompatibilityScore(discoveredUser.id);
              return {
                ...discoveredUser,
                compatibilityScore: compatibility.score || 0,
              };
            } catch (error) {
              console.error('Error getting compatibility:', error);
              return {
                ...discoveredUser,
                compatibilityScore: Math.floor(Math.random() * 40) + 60, // Fallback 60-100%
              };
            }
          })
        );
        
        setUsers(usersWithCompatibility);
        setCurrentIndex(0);
        setNoMoreUsers(false);
      } else {
        setNoMoreUsers(true);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      
      // Em caso de erro, tentar carregar sugestões
      try {
        const suggestions = await userService.getSuggestions(10);
        if (suggestions && suggestions.length > 0) {
          setUsers(suggestions.map(user => ({
            ...user,
            compatibilityScore: Math.floor(Math.random() * 40) + 60,
          })));
          setCurrentIndex(0);
          setNoMoreUsers(false);
        } else {
          setNoMoreUsers(true);
          setUsers([]);
        }
      } catch (suggestionError) {
        console.error('Error loading suggestions:', suggestionError);
        setNoMoreUsers(true);
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    setShowFilters(false);
    await loadUsers();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      position.setValue({ x: gestureState.dx, y: gestureState.dy });
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 120) {
        // Swipe right - Like
        forceSwipe('right');
      } else if (gestureState.dx < -120) {
        // Swipe left - Skip
        forceSwipe('left');
      } else {
        // Return to center
        resetPosition();
      }
    },
  });

  const forceSwipe = (direction) => {
    const x = direction === 'right' ? screenWidth : -screenWidth;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction) => {
    const currentUser = users[currentIndex];
    
    if (direction === 'right') {
      handleLike(currentUser);
    } else {
      handleSkip(currentUser);
    }
    
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(currentIndex + 1);
    
    // Check if we need to load more users
    if (currentIndex >= users.length - 1) {
      setNoMoreUsers(true);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const handleLike = async (targetUser) => {
    try {
      const result = await userService.likeUser(targetUser.id);
      
      if (result.isMatch) {
        Alert.alert(
          '🎉 É um Match!',
          `Você e ${targetUser.name} se curtiram mutuamente!`,
          [
            {
              text: 'Enviar Mensagem',
              onPress: () => navigation.navigate('Chat', { 
                matchId: result.matchId,
                user: targetUser 
              }),
            },
            {
              text: 'Ver Matches',
              onPress: () => navigation.navigate('Matches'),
            },
            {
              text: 'Continuar',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error liking user:', error);
      Alert.alert(
        'Erro',
        'Não foi possível curtir este usuário. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSkip = async (targetUser) => {
    try {
      await userService.skipUser(targetUser.id);
    } catch (error) {
      console.error('Error skipping user:', error);
      // Não mostrar erro para skip, pois é uma ação silenciosa
    }
  };

  const handleSuperLike = async (targetUser) => {
    try {
      const result = await userService.superLikeUser(targetUser.id);
      
      Alert.alert(
        '⭐ Super Like Enviado!',
        `Você deu um super like em ${targetUser.name}!`,
        [{ text: 'OK' }]
      );

      if (result.isMatch) {
        setTimeout(() => {
          Alert.alert(
            '🎉 É um Match!',
            `Você e ${targetUser.name} se curtiram mutuamente!`,
            [
              {
                text: 'Enviar Mensagem',
                onPress: () => navigation.navigate('Chat', { 
                  matchId: result.matchId,
                  user: targetUser 
                }),
              },
              {
                text: 'Ver Matches',
                onPress: () => navigation.navigate('Matches'),
              },
              {
                text: 'Continuar',
                style: 'cancel',
              },
            ]
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Error super liking user:', error);
      Alert.alert(
        'Erro',
        'Não foi possível enviar o super like. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderCards = () => {
    if (noMoreUsers) {
      return (
        <View style={getNoMoreUsersStyle()}>
          <Ionicons
            name="heart-outline"
            size={64}
            color={colors.gray[400]}
          />
          <Text style={getNoMoreUsersTextStyle()}>
            Não há mais usuários por aqui!
          </Text>
          <Text style={getNoMoreUsersSubtextStyle()}>
            Volte mais tarde para descobrir novos parceiros
          </Text>
          <TouchableOpacity
            style={getRefreshButtonStyle()}
            onPress={loadUsers}
            activeOpacity={0.8}
          >
            <Text style={getRefreshButtonTextStyle()}>
              Atualizar
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return users.map((user, index) => {
      if (index < currentIndex) {
        return null;
      } else if (index === currentIndex) {
        return (
          <Animated.View
            key={user.id}
            style={[rotateAndTranslate, getCardStyle()]}
            {...panResponder.panHandlers}
          >
            <UserCard
              user={user}
              showActions={false}
            />
            
            {/* Like/Nope overlays */}
            <Animated.View
              style={[
                getLikeOverlayStyle(),
                { opacity: likeOpacity },
              ]}
            >
              <Text style={getLikeTextStyle()}>CURTIR</Text>
            </Animated.View>
            
            <Animated.View
              style={[
                getNopeOverlayStyle(),
                { opacity: nopeOpacity },
              ]}
            >
              <Text style={getNopeTextStyle()}>PULAR</Text>
            </Animated.View>
          </Animated.View>
        );
      } else {
        return (
          <Animated.View
            key={user.id}
            style={[
              getCardStyle(),
              {
                zIndex: -index,
                transform: [
                  { scale: 1 - (index - currentIndex) * 0.05 },
                ],
              },
            ]}
          >
            <UserCard
              user={user}
              showActions={false}
            />
          </Animated.View>
        );
      }
    }).reverse();
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

  const getFilterButtonStyle = () => ({
    padding: 8,
  });

  const getCardsContainerStyle = () => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  });

  const getCardStyle = () => ({
    position: 'absolute',
    width: screenWidth - 40,
    height: screenHeight * 0.7,
  });

  const getLikeOverlayStyle = () => ({
    position: 'absolute',
    top: 50,
    left: 40,
    zIndex: 1000,
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    transform: [{ rotate: '-30deg' }],
  });

  const getNopeOverlayStyle = () => ({
    position: 'absolute',
    top: 50,
    right: 40,
    zIndex: 1000,
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    transform: [{ rotate: '30deg' }],
  });

  const getLikeTextStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  });

  const getNopeTextStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  });

  const getActionsStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: colors.white,
  });

  const getActionButtonStyle = (variant) => {
    let backgroundColor;
    let size = 56;
    
    switch (variant) {
      case 'like':
        backgroundColor = colors.success;
        break;
      case 'super':
        backgroundColor = colors.white;
        size = 48;
        break;
      case 'skip':
      default:
        backgroundColor = colors.gray[100];
        break;
    }
    
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor,
      marginHorizontal: variant === 'super' ? 10 : 20,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
      borderWidth: variant === 'super' ? 2 : 0,
      borderColor: variant === 'super' ? '#FFD700' : 'transparent',
    };
  };

  const getNoMoreUsersStyle = () => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  });

  const getNoMoreUsersTextStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.gray[700],
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  });

  const getNoMoreUsersSubtextStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[500],
    textAlign: 'center',
    marginBottom: 24,
  });

  const getRefreshButtonStyle = () => ({
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  });

  const getRefreshButtonTextStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  });

  const getFilterModalHeaderStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  });

  const getFilterModalCloseStyle = () => ({
    padding: 4,
  });

  const getFilterModalTitleStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.gray[900],
  });

  const getFilterModalApplyStyle = () => ({
    padding: 4,
  });

  const getFilterModalApplyTextStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.primary,
  });

  const getFilterModalContentStyle = () => ({
    flex: 1,
    paddingHorizontal: 20,
  });

  const getFilterSectionStyle = () => ({
    marginVertical: 20,
  });

  const getFilterSectionTitleStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.gray[900],
    marginBottom: 12,
  });

  const getSliderStyle = () => ({
    width: '100%',
    height: 40,
  });

  const getAgeRangeContainerStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
  });

  const getAgeInputContainerStyle = () => ({
    flex: 1,
    marginHorizontal: 8,
  });

  const getAgeInputLabelStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: 8,
  });

  const getAgeSliderStyle = () => ({
    width: '100%',
    height: 40,
  });

  const getExperienceLevelContainerStyle = () => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  });

  const getExperienceLevelButtonStyle = (isSelected) => ({
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isSelected ? colors.primary : colors.gray[100],
    borderWidth: 1,
    borderColor: isSelected ? colors.primary : colors.gray[300],
  });

  const getExperienceLevelTextStyle = (isSelected) => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: isSelected ? colors.white : colors.gray[700],
  });

  const getWorkoutPreferencesContainerStyle = () => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  });

  const getWorkoutPreferenceButtonStyle = (isSelected) => ({
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: isSelected ? colors.primary : colors.gray[100],
    borderWidth: 1,
    borderColor: isSelected ? colors.primary : colors.gray[300],
  });

  const getWorkoutPreferenceTextStyle = (isSelected) => ({
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: isSelected ? colors.white : colors.gray[700],
  });

  const getLoadingTextStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    paddingVertical: 20,
  });

  return (
    <SafeAreaView style={getContainerStyle()}>
      {/* Header */}
      <View style={getHeaderStyle()}>
        <Text style={getHeaderTitleStyle()}>
          Descobrir
        </Text>
        <TouchableOpacity
          style={getFilterButtonStyle()}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={colors.gray[700]}
          />
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <View style={getCardsContainerStyle()}>
        {renderCards()}
      </View>

      {/* Actions */}
      {!noMoreUsers && currentIndex < users.length && (
        <View style={getActionsStyle()}>
          <TouchableOpacity
            style={getActionButtonStyle('skip')}
            onPress={() => forceSwipe('left')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="close"
              size={24}
              color={colors.gray[600]}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={getActionButtonStyle('super')}
            onPress={() => {
              const currentUser = users[currentIndex];
              handleSuperLike(currentUser);
              position.setValue({ x: 0, y: 0 });
              setCurrentIndex(currentIndex + 1);
              if (currentIndex >= users.length - 1) {
                setNoMoreUsers(true);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="star"
              size={20}
              color="#FFD700"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={getActionButtonStyle('like')}
            onPress={() => forceSwipe('right')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="heart"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={getFilterModalHeaderStyle()}>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={getFilterModalCloseStyle()}
            >
              <Ionicons name="close" size={24} color={colors.gray[700]} />
            </TouchableOpacity>
            <Text style={getFilterModalTitleStyle()}>Filtros</Text>
            <TouchableOpacity
              onPress={applyFilters}
              style={getFilterModalApplyStyle()}
            >
              <Text style={getFilterModalApplyTextStyle()}>Aplicar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={getFilterModalContentStyle()}>
            {/* Distance Filter */}
            <View style={getFilterSectionStyle()}>
              <Text style={getFilterSectionTitleStyle()}>
                Distância: {filters.distance} km
              </Text>
              <Slider
                style={getSliderStyle()}
                minimumValue={1}
                maximumValue={100}
                value={filters.distance}
                onValueChange={(value) => setFilters(prev => ({ ...prev, distance: Math.round(value) }))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.gray[300]}
                thumbTintColor={colors.primary}
              />
            </View>

            {/* Age Range Filter */}
            <View style={getFilterSectionStyle()}>
              <Text style={getFilterSectionTitleStyle()}>
                Idade: {filters.ageRange[0]} - {filters.ageRange[1]} anos
              </Text>
              <View style={getAgeRangeContainerStyle()}>
                <View style={getAgeInputContainerStyle()}>
                  <Text style={getAgeInputLabelStyle()}>Mín:</Text>
                  <Slider
                    style={getAgeSliderStyle()}
                    minimumValue={18}
                    maximumValue={65}
                    value={filters.ageRange[0]}
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      ageRange: [Math.round(value), prev.ageRange[1]] 
                    }))}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.gray[300]}
                    thumbTintColor={colors.primary}
                  />
                </View>
                <View style={getAgeInputContainerStyle()}>
                  <Text style={getAgeInputLabelStyle()}>Máx:</Text>
                  <Slider
                    style={getAgeSliderStyle()}
                    minimumValue={18}
                    maximumValue={65}
                    value={filters.ageRange[1]}
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      ageRange: [prev.ageRange[0], Math.round(value)] 
                    }))}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor={colors.gray[300]}
                    thumbTintColor={colors.primary}
                  />
                </View>
              </View>
            </View>

            {/* Experience Level Filter */}
            <View style={getFilterSectionStyle()}>
              <Text style={getFilterSectionTitleStyle()}>Nível de Experiência</Text>
              <View style={getExperienceLevelContainerStyle()}>
                {['Iniciante', 'Intermediário', 'Avançado'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={getExperienceLevelButtonStyle(filters.experienceLevel === level)}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      experienceLevel: prev.experienceLevel === level ? null : level 
                    }))}
                  >
                    <Text style={getExperienceLevelTextStyle(filters.experienceLevel === level)}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Workout Preferences Filter */}
            <View style={getFilterSectionStyle()}>
              <Text style={getFilterSectionTitleStyle()}>Preferências de Treino</Text>
              {loadingPreferences ? (
                <Text style={getLoadingTextStyle()}>Carregando...</Text>
              ) : (
                <View style={getWorkoutPreferencesContainerStyle()}>
                  {workoutPreferences.map((preference) => {
                    const isSelected = filters.workoutPreferences.includes(preference.id);
                    return (
                      <TouchableOpacity
                        key={preference.id}
                        style={getWorkoutPreferenceButtonStyle(isSelected)}
                        onPress={() => {
                          setFilters(prev => ({
                            ...prev,
                            workoutPreferences: isSelected
                              ? prev.workoutPreferences.filter(id => id !== preference.id)
                              : [...prev.workoutPreferences, preference.id]
                          }));
                        }}
                      >
                        <Text style={getWorkoutPreferenceTextStyle(isSelected)}>
                          {preference.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Reset Filters */}
            <View style={getFilterSectionStyle()}>
              <CustomButton
                title="Limpar Filtros"
                variant="outline"
                onPress={() => {
                  setFilters({
                    distance: 25,
                    ageRange: [18, 50],
                    workoutPreferences: [],
                    experienceLevel: null,
                  });
                }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Discover;


