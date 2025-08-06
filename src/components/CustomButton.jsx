import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { colors } from '../styles/colors';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles = {
      small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 36,
      },
      medium: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        minHeight: 48,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? colors.gray[300] : colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: disabled ? colors.gray[300] : colors.primary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.gray[300] : colors.gray[400],
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      danger: {
        backgroundColor: disabled ? colors.gray[300] : colors.secondary,
        borderWidth: 0,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontFamily: 'Poppins-SemiBold',
      textAlign: 'center',
    };

    // Size text styles
    const sizeTextStyles = {
      small: {
        fontSize: 14,
        lineHeight: 20,
      },
      medium: {
        fontSize: 16,
        lineHeight: 24,
      },
      large: {
        fontSize: 18,
        lineHeight: 28,
      },
    };

    // Variant text styles
    const variantTextStyles = {
      primary: {
        color: colors.white,
      },
      secondary: {
        color: disabled ? colors.gray[400] : colors.primary,
      },
      outline: {
        color: disabled ? colors.gray[400] : colors.gray[700],
      },
      ghost: {
        color: disabled ? colors.gray[400] : colors.primary,
      },
      danger: {
        color: colors.white,
      },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.primary}
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>
        {loading ? 'Carregando...' : title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;

