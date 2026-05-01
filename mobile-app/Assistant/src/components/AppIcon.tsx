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
              d="M19.4 13.1C19.46 12.72 19.5 12.37 19.5 12C19.5 11.63 19.46 11.28 19.4 10.9L21 9.6L19.2 6.4L17.2 7.1C16.72 6.73 16.18 6.42 15.6 6.18L15.2 4H8.8L8.4 6.18C7.82 6.42 7.28 6.73 6.8 7.1L4.8 6.4L3 9.6L4.6 10.9C4.54 11.28 4.5 11.63 4.5 12C4.5 12.37 4.54 12.72 4.6 13.1L3 14.4L4.8 17.6L6.8 16.9C7.28 17.27 7.82 17.58 8.4 17.82L8.8 20H15.2L15.6 17.82C16.18 17.58 16.72 17.27 17.2 16.9L19.2 17.6L21 14.4L19.4 13.1Z"
            y="6"
              strokeWidth={1.6}
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
          {/* Outer gear teeth */}
          <Path
            d="M11 2H13V5H11M11 19H13V22H11M2 11V13H5V11M19 11V13H22V11M4.22 4.22L6.63 6.63L4.22 4.22M17.37 17.37L19.78 19.78L17.37 17.37M19.78 4.22L17.37 6.63L19.78 4.22M6.63 17.37L4.22 19.78L6.63 17.37"
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Outer gear circle */}
          <Circle cx="12" cy="12" r="7.5" fill="none" stroke={color} strokeWidth={1.4} />
          {/* Inner circle */}
          <Circle cx="12" cy="12" r="4" fill="none" stroke={color} strokeWidth={1.4} />
          {/* Three-spoke center */}
          <Path
            d="M12 9V15M9.5 12H14.5M10 10.5L13.5 13.5M14 10.5L10.5 13.5"
            stroke={color}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Center dot */}
          <Circle cx="12" cy="12" r="1.2" fill={color} />
        </Svg>
      );

    default:
      return null;
  }
}
