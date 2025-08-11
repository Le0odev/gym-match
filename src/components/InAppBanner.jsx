import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';

const InAppBanner = ({
  visible,
  icon = 'heart',
  title = 'Novo evento',
  description,
  primaryAction,
  secondaryAction,
  onClose,
  autoHideMs = 9000,
  topOffset = 56,
}) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();

      const t = setTimeout(() => {
        hide();
      }, autoHideMs);
      return () => clearTimeout(t);
    } else {
      hide();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose && onClose());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: (insets.top || 0) + topOffset,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: colors.white,
          borderRadius: 14,
          padding: 12,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
          borderWidth: 1,
          borderColor: colors.gray[100],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '22', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Ionicons name={icon} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Poppins-SemiBold', color: colors.gray[900] }}>{title}</Text>
            {!!description && (
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.gray[600] }}>{description}</Text>
            )}
          </View>
          <TouchableOpacity onPress={hide} style={{ padding: 6 }}>
            <Ionicons name="close" size={18} color={colors.gray[500]} />
          </TouchableOpacity>
        </View>

        {(primaryAction || secondaryAction) && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
            {secondaryAction && (
              <TouchableOpacity onPress={secondaryAction.onPress} style={{ paddingVertical: 6, paddingHorizontal: 10, marginRight: 8 }}>
                <Text style={{ color: colors.gray[700], fontFamily: 'Inter-Medium' }}>{secondaryAction.label}</Text>
              </TouchableOpacity>
            )}
            {primaryAction && (
              <TouchableOpacity onPress={primaryAction.onPress} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: 10 }}>
                <Text style={{ color: 'white', fontFamily: 'Inter-Medium' }}>{primaryAction.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default InAppBanner;


