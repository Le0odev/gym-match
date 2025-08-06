import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { colors } from '../styles/colors';

const LoadingSpinner = ({
  size = 'large',
  color = colors.primary,
  text,
  overlay = false,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    const baseStyle = {
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (overlay) {
      return {
        ...baseStyle,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
      };
    }

    return {
      ...baseStyle,
      padding: 20,
    };
  };

  const getTextStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: overlay ? colors.white : colors.gray[700],
    marginTop: 12,
    textAlign: 'center',
  });

  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'medium':
        return 'large';
      case 'large':
      default:
        return 'large';
    }
  };

  return (
    <View style={[getContainerStyle(), style]}>
      <ActivityIndicator
        size={getSpinnerSize()}
        color={color}
      />
      {text && (
        <Text style={[getTextStyle(), textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );
};

// Componente para tela de carregamento completa
export const FullScreenLoader = ({ text = 'Carregando...' }) => (
  <View style={{
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <LoadingSpinner
      size="large"
      color={colors.primary}
      text={text}
    />
  </View>
);

// Componente para overlay de carregamento
export const LoadingOverlay = ({ visible, text = 'Carregando...' }) => {
  if (!visible) return null;
  
  return (
    <LoadingSpinner
      overlay={true}
      text={text}
      color={colors.white}
    />
  );
};

export default LoadingSpinner;

