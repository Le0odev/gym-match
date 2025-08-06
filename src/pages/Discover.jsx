import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  Alert,
  PanResponder,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { UserCard, LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Discover = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noMoreUsers, setNoMoreUsers] = useState(false);
  
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
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call
      // For now, using mock data
      const mockUsers = [
        {
          id: 1,
          name: 'Maria Silva',
          birthDate: '1995-03-15',
          location: 'São Paulo, SP',
          height: 165,
          weight: 60,
          experienceLevel: 'Intermediário',
          workoutPreferences: [
            { name: 'Musculação' },
            { name: 'Cardio' },
            { name: 'Yoga' },
          ],
          compatibilityScore: 85,
          profilePicture: null,
          gender: 'female',
        },
        {
          id: 2,
          name: 'João Santos',
          birthDate: '1992-07-22',
          location: 'Rio de Janeiro, RJ',
          height: 180,
          weight: 75,
          experienceLevel: 'Avançado',
          workoutPreferences: [
            { name: 'Musculação' },
            { name: 'CrossFit' },
          ],
          compatibilityScore: 92,
          profilePicture: null,
          gender: 'male',
        },
        {
          id: 3,
          name: 'Ana Costa',
          birthDate: '1998-11-08',
          location: 'Belo Horizonte, MG',
          height: 170,
          weight: 65,
          experienceLevel: 'Iniciante',
          workoutPreferences: [
            { name: 'Pilates' },
            { name: 'Caminhada' },
            { name: 'Natação' },
          ],
          compatibilityScore: 78,
          profilePicture: null,
          gender: 'female',
        },
      ];
      
      setUsers(mockUsers);
      setCurrentIndex(0);
      setNoMoreUsers(false);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Erro', 'Não foi possível carregar os usuários');
    } finally {
      setLoading(false);
    }
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
      // TODO: Implement actual API call
      console.log('Liked user:', targetUser.name);
      
      // Simulate match detection
      const isMatch = Math.random() > 0.7; // 30% chance of match
      
      if (isMatch) {
        Alert.alert(
          '🎉 É um Match!',
          `Você e ${targetUser.name} se curtiram mutuamente!`,
          [
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
    }
  };

  const handleSkip = async (targetUser) => {
    try {
      // TODO: Implement actual API call
      console.log('Skipped user:', targetUser.name);
    } catch (error) {
      console.error('Error skipping user:', error);
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

  const getActionButtonStyle = (variant) => ({
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: variant === 'like' ? colors.success : colors.gray[100],
    marginHorizontal: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  });

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

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingSpinner text="Procurando parceiros..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={getContainerStyle()}>
      {/* Header */}
      <View style={getHeaderStyle()}>
        <Text style={getHeaderTitleStyle()}>
          Descobrir
        </Text>
        <TouchableOpacity
          style={getFilterButtonStyle()}
          onPress={() => {
            // TODO: Implement filters
            Alert.alert('Em breve', 'Filtros em desenvolvimento');
          }}
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
    </SafeAreaView>
  );
};

export default Discover;

