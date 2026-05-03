import React from 'react';
import { Pressable, Text, View } from 'react-native';
import styles from '../../styles/agent/AgentScreenStyles';

type Props = {
  onGoBack: () => void;
  isConnected: boolean;
  pageTitle: number;
};

export default function AgentHeader({ onGoBack, isConnected, pageTitle }: Props) {
  return (
    <View style={styles.headerRow}>
      <Pressable style={styles.circleIcon} onPress={onGoBack}>
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>
      <Text style={[styles.pageTitle, { fontSize: pageTitle }]}>Assistant</Text>
      <View style={[styles.serverIndicator, isConnected ? styles.serverIndicatorOnline : styles.serverIndicatorOffline]}>
        <View style={[styles.indicatorDot, isConnected ? styles.indicatorDotOnline : styles.indicatorDotOffline]} />
      </View>
    </View>
  );
}
