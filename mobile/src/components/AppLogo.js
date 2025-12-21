import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Text as SvgText, G } from 'react-native-svg';

/**
 * AppLogo - Logotipo oficial de la App Móvil
 * Especificación JSON:
 * - Background: #004A98 (Deep corporate blue)
 * - Shield: Stylized modern, blue gradient subtle
 * - Checkmark: #E74C3C (Vibrant accent red)
 * - Text: DR, White, Bold, Sans-serif
 */
export default function AppLogo({ size = 100, style }) {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
        <Defs>
          <LinearGradient id="shieldGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#3498DB" stopOpacity="1" />
            <Stop offset="1" stopColor="#154360" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* 1. Background: #004A98 (Solid Color as per JSON) */}
        <Rect x="0" y="0" width="100" height="100" rx="22" fill="#004A98" />

        {/* 2. Shield Container - Centered and Scaled */}
        <G transform="translate(25, 15) scale(0.5)">
            {/* Shield Body with Gradient */}
            <Path
              d="M 50 0 
                 L 10 10 
                 C 10 10, 10 40, 10 50
                 C 10 75, 50 100, 50 100
                 C 50 100, 90 75, 90 50
                 C 90 40, 90 10, 90 10
                 L 50 0 Z"
              fill="url(#shieldGradient)" 
            />
            
            {/* Left Half Highlight for 3D effect (Subtle) */}
            <Path
              d="M 50 0 L 10 10 C 10 10 10 40 10 50 C 10 75 50 100 50 100 L 50 0 Z"
              fill="#FFFFFF"
              fillOpacity="0.15"
            />
        </G>

        {/* 3. Checkmark (#E74C3C) - Bold and Overlapping */}
        <Path
          d="M 42 42 L 50 50 L 63 35"
          fill="none"
          stroke="#E74C3C"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4. Text "DR" - White, Bold, Sans-serif */}
        <SvgText
          x="50"
          y="85"
          fill="#FFFFFF"
          fontSize="28"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="Roboto" 
          letterSpacing="0"
        >
          DR
        </SvgText>
      </Svg>
    </View>
  );
}
