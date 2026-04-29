import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type AppIconName = 'bluetooth' | 'agent' | 'wifi' | 'settings';

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export default function AppIcon({ name, size = 22, color = '#4fc3f7' }: Props) {
  switch (name) {
    case 'bluetooth':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 7L17 17L12 21V3L17 7L7 17"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'agent':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="4"
            y="6"
            width="16"
            height="12"
            rx="3"
            stroke={color}
            strokeWidth={1.8}
          />
          <Circle cx="9" cy="12" r="1.5" fill={color} />
          <Circle cx="15" cy="12" r="1.5" fill={color} />
          <Path
            d="M12 3V6"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M9 16H15"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'wifi':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9C8 4 16 4 21 9"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M6 12C9.5 8.5 14.5 8.5 18 12"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M9 15C10.8 13.3 13.2 13.3 15 15"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="18" r="1.4" fill={color} />
        </Svg>
      );

    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5"
            stroke={color}
            strokeWidth={1.8}
          />
          <Path
            d="M12 3V5M12 19V21M3 12H5M19 12H21M5.6 5.6L7 7M17 17L18.4 18.4M18.4 5.6L17 7M7 17L5.6 18.4"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </Svg>
      );

    default:
      return null;
  }
}
