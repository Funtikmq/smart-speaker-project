import React, { useEffect, useRef } from 'react';
import { Pressable, Switch, Text, View, Animated, Easing } from 'react-native';
import AppIcon from '../AppIcon';
import styles, {
  ACCENT_COLOR,
  WARM_BG_2,
  WARM_BG_3,
  WARM_BORDER,
} from '../../styles/settings/SettingsScreenStyles';

type SettingItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: 'bluetooth' | 'wifi' | 'agent' | 'settings';
  type: 'toggle' | 'button' | 'info';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
};

type Props = {
  item: SettingItem;
  cardRadius: number;
  scale: number;
};

export default function SettingItem({ item, cardRadius, scale }: Props) {
  const anim = useRef(new Animated.Value(item.value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: item.value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [item.value, anim]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [WARM_BG_2, 'rgba(242,157,78,0.08)'],
  });

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [WARM_BORDER, 'rgba(242,157,78,0.3)'],
  });

  const iconTileStyle = [
    styles.iconTile,
    { width: Math.round(40 * scale), height: Math.round(40 * scale) },
    item.icon === 'bluetooth' && item.value ? styles.iconTileBluetoothOn : null,
    item.icon === 'wifi' && item.value ? styles.iconTileWifiOn : null,
  ];

  const statusDotStyle = [
    styles.statusDot,
    item.value ? styles.statusDotOnline : styles.statusDotOffline,
  ];

  return (
    <Animated.View style={[styles.settingItem, { borderRadius: cardRadius, backgroundColor, borderColor }] as any}>
      <Pressable
        style={({ pressed }) => [
          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
          pressed && styles.settingItemPressed,
        ]}
        onPress={item.type === 'button' ? item.onPress : undefined}
        disabled={item.type !== 'button'}
      >
        <View style={styles.settingLeft}>
          <View style={iconTileStyle}>
            <AppIcon name={item.icon} size={Math.round(18 * scale)} color={ACCENT_COLOR} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.settingTitle, { fontSize: Math.round(15 * scale) }]}>{item.title}</Text>
            {item.subtitle ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <View style={statusDotStyle} />
                <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.settingSubtitle, { fontSize: Math.round(12 * scale) }]}>{item.subtitle}</Text>
              </View>
            ) : null}
          </View>
        </View>
        {item.type === 'toggle' ? (
          <View style={{ marginLeft: 8 }}>
            <Switch
              value={item.value || false}
              onValueChange={item.onToggle}
              trackColor={{ false: WARM_BORDER, true: 'rgba(242, 157, 78, 0.3)' }}
              thumbColor={item.value ? ACCENT_COLOR : '#B88D69'}
            />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export type { SettingItem };
