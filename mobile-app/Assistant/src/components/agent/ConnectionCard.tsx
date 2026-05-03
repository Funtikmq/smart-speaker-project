import React from 'react';
import { Pressable, Text, View } from 'react-native';
import AppIcon from '../AppIcon';
import styles, { ACCENT_COLOR } from '../../styles/agent/AgentScreenStyles';

type Props = {
  isConnected: boolean;
  macAddress: string;
  onConnect: () => void;
  onDisconnect: () => void;
  cardRadius: number;
  iconTile: number;
};

export default function ConnectionCard({ isConnected, macAddress, onConnect, onDisconnect, cardRadius, iconTile }: Props) {
  return (
    <View style={[styles.card, { borderRadius: cardRadius }]}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={[styles.iconTile, { width: iconTile, height: iconTile }]}>
            <AppIcon name="bluetooth" size={18} color={ACCENT_COLOR} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Bluetooth Link</Text>
            <Text style={styles.rowSubtitle}>{isConnected ? `Connected - ${macAddress}` : 'Disconnected'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.separator} />
      <Pressable style={[styles.primaryButton, isConnected ? styles.secondaryButton : styles.connectButton]} onPress={isConnected ? onDisconnect : onConnect}>
        <Text style={styles.primaryButtonText}>{isConnected ? 'Disconnect' : 'Connect to Pi'}</Text>
      </Pressable>
    </View>
  );
}
