import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';
import { colors } from '../styles/colors';

const AppLogo = ({ size = 140, showWordmark = false }) => {
  const iconSize = size;
  const barWidth = iconSize * 0.55;
  const barHeight = iconSize * 0.1;
  const plateSize = iconSize * 0.18;
  const barX = (iconSize - barWidth) / 2;
  const barY = iconSize / 2 - barHeight / 2;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={iconSize} height={iconSize} viewBox={`0 0 ${iconSize} ${iconSize}`}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
            <Stop offset="100%" stopColor="#2F6FE0" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Circle background */}
        <Circle cx={iconSize / 2} cy={iconSize / 2} r={iconSize / 2} fill="url(#bg)" />

        {/* Dumbbell bar */}
        <Rect x={barX} y={barY} width={barWidth} height={barHeight} rx={barHeight / 2} fill={colors.white} />

        {/* Left plates */}
        <Rect x={barX - plateSize * 0.55} y={barY - plateSize * 0.25} width={plateSize} height={plateSize * 1.5} rx={8} fill={colors.white} />
        <Rect x={barX - plateSize * 0.85} y={barY - plateSize * 0.15} width={plateSize * 0.7} height={plateSize * 1.3} rx={6} fill={colors.secondary} />

        {/* Right plates */}
        <Rect x={barX + barWidth - plateSize * 0.45} y={barY - plateSize * 0.25} width={plateSize} height={plateSize * 1.5} rx={8} fill={colors.white} />
        <Rect x={barX + barWidth + plateSize * 0.15} y={barY - plateSize * 0.15} width={plateSize * 0.7} height={plateSize * 1.3} rx={6} fill={colors.secondary} />
      </Svg>

      {showWordmark && (
        <Text style={{
          marginTop: 12,
          fontFamily: 'Poppins-Bold',
          fontSize: Math.max(18, size * 0.18),
          color: colors.gray[900],
        }}>
          GymMatch
        </Text>
      )}
    </View>
  );
};

export default AppLogo;

