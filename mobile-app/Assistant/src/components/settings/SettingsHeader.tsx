import React from 'react';
import { Pressable, Text, View } from 'react-native';
import styles from '../../styles/settings/SettingsScreenStyles';

type Props = {
  onGoHome: () => void;
  pageTitle: string;
  isPiConnected: boolean;
  fontSize: number;
};

export default function SettingsHeader({ onGoHome, pageTitle, isPiConnected, fontSize }: Props) {
  return (
    <View style={styles.headerRow}>
      <Pressable onPress={onGoHome} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>
      <Text style={[styles.pageTitle, { fontSize }]}>{pageTitle}</Text>
      <View style={[styles.serverIndicator, isPiConnected ? styles.serverIndicatorOnline : styles.serverIndicatorOffline]}>
        <View style={[styles.indicatorDot, isPiConnected ? styles.indicatorDotOnline : styles.indicatorDotOffline]} />
      </View>
    </View>
  );
}
