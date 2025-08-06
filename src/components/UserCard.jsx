import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40; // 20px margin on each side

const UserCard = ({
  user,
  onLike,
  onSkip,
  style,
  showActions = true,
}) => {
  const getCardStyle = () => ({
    width: cardWidth,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  });

  const getImageStyle = () => ({
    width: '100%',
    height: cardWidth * 0.7, // Maintain aspect ratio
    backgroundColor: colors.gray[200],
  });

  const getContentStyle = () => ({
    padding: 20,
  });

  const getNameStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.gray[900],
    marginBottom: 4,
  });

  const getAgeLocationStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[600],
    marginBottom: 12,
  });

  const getPreferencesContainerStyle = () => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  });

  const getPreferenceTagStyle = () => ({
    backgroundColor: colors.primary + '20', // 20% opacity
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  });

  const getPreferenceTextStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.primary,
  });

  const getStatsContainerStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: showActions ? 20 : 0,
  });

  const getStatItemStyle = () => ({
    alignItems: 'center',
  });

  const getStatValueStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.gray[900],
  });

  const getStatLabelStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.gray[500],
  });

  const getActionsContainerStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
  });

  const getActionButtonStyle = (variant) => ({
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: variant === 'like' ? colors.success : colors.gray[100],
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  });

  const getCompatibilityBadgeStyle = () => ({
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  });

  const getCompatibilityTextStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
  });

  const formatPreferences = (preferences) => {
    if (!preferences || !Array.isArray(preferences)) return [];
    return preferences.slice(0, 3); // Show only first 3 preferences
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

  const getImageSource = () => {
    if (user.profilePicture) {
      return { uri: user.profilePicture };
    }
    // Default avatar based on gender
    return user.gender === 'female' 
      ? require('../assets/images/default-female-avatar.png')
      : require('../assets/images/default-male-avatar.png');
  };

  return (
    <View style={[getCardStyle(), style]}>
      <View style={{ position: 'relative' }}>
        <Image
          source={getImageSource()}
          style={getImageStyle()}
          defaultSource={require('../assets/images/default-avatar.png')}
        />
        
        {user.compatibilityScore && (
          <View style={getCompatibilityBadgeStyle()}>
            <Text style={getCompatibilityTextStyle()}>
              {Math.round(user.compatibilityScore)}% match
            </Text>
          </View>
        )}
      </View>

      <View style={getContentStyle()}>
        <Text style={getNameStyle()}>
          {user.name || 'Usuário'}
        </Text>
        
        <Text style={getAgeLocationStyle()}>
          {calculateAge(user.birthDate)} anos • {user.location || 'Localização não informada'}
        </Text>

        {user.workoutPreferences && user.workoutPreferences.length > 0 && (
          <View style={getPreferencesContainerStyle()}>
            {formatPreferences(user.workoutPreferences).map((preference, index) => (
              <View key={index} style={getPreferenceTagStyle()}>
                <Text style={getPreferenceTextStyle()}>
                  {preference.name || preference}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={getStatsContainerStyle()}>
          <View style={getStatItemStyle()}>
            <Text style={getStatValueStyle()}>
              {user.height ? `${user.height}cm` : 'N/A'}
            </Text>
            <Text style={getStatLabelStyle()}>Altura</Text>
          </View>
          
          <View style={getStatItemStyle()}>
            <Text style={getStatValueStyle()}>
              {user.weight ? `${user.weight}kg` : 'N/A'}
            </Text>
            <Text style={getStatLabelStyle()}>Peso</Text>
          </View>
          
          <View style={getStatItemStyle()}>
            <Text style={getStatValueStyle()}>
              {user.experienceLevel || 'N/A'}
            </Text>
            <Text style={getStatLabelStyle()}>Nível</Text>
          </View>
        </View>
      </View>

      {showActions && (
        <View style={getActionsContainerStyle()}>
          <TouchableOpacity
            style={getActionButtonStyle('skip')}
            onPress={() => onSkip && onSkip(user)}
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
            onPress={() => onLike && onLike(user)}
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
    </View>
  );
};

export default UserCard;

