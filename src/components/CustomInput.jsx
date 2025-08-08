import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const CustomInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  inputContainerStyle,
  labelStyle,
  errorStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getContainerStyle = () => ({
    marginBottom: 16,
  });

  const getLabelStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[700],
    marginBottom: 6,
  });

  const getInputContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: error ? colors.secondary : isFocused ? colors.primary : colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: multiline ? 8 : 0,
    minHeight: multiline ? 40 : 48,
  });

  const getInputStyle = () => ({
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[900],
    paddingVertical: multiline ? 0 : 12,
    textAlignVertical: multiline ? 'top' : 'center',
  });

  const getErrorStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondary,
    marginTop: 4,
  });

  const getIconStyle = () => ({
    marginHorizontal: 4,
  });

  return (
    <View style={[getContainerStyle(), style]}>
      {label && (
        <Text style={[getLabelStyle(), labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={[getInputContainerStyle(), inputContainerStyle]}>
        {leftIcon && (
          <View style={getIconStyle()}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={colors.gray[500]}
            />
          </View>
        )}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={getIconStyle()}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={colors.gray[500]}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={getIconStyle()}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.gray[500]}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[getErrorStyle(), errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default CustomInput;

