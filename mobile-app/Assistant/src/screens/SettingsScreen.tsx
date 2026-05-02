import React, { useMemo } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppIcon from '../components/AppIcon';
import SettingItem from '../components/settings/SettingItem';
import SettingsHeader from '../components/settings/SettingsHeader';
import { useAgent } from '../agent';
import { useApi } from '../hooks/useApi';
import { useSettingsLogic } from '../hooks/useSettingsLogic';
import { RootStackParamList } from '../navigation/types';
import styles, { ACCENT_COLOR, WARM_BG } from '../styles/settings/SettingsScreenStyles';

type SettingsNavigation = NativeStackNavigationProp<RootStackParamList, 'Settings'>;
const PI_MAC_ADDRESS = 'B8:27:EB:11:18:DC';
function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max); }

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigation>();
  const { width, height } = useWindowDimensions();
  const scale = clamp(width / 390, 0.8, 1.2);
  const verticalScale = clamp(height / 844, 0.85, 1.15);
  const isSmall = width <= 370;
  const isCompact = height <= 650;
  const tokens = useMemo(() => ({ pad: Math.round(isSmall ? 12 : 16 * scale), navLabel: Math.round(12 * scale), pageTitle: Math.round(30 * scale), sectionGap: Math.round(isCompact ? 10 : 16 * verticalScale), cardRadius: Math.round(14 * scale) }), [isSmall, isCompact, scale, verticalScale]);
  const { api, sendCommand } = useApi();
  const { state: agentState } = useAgent(PI_MAC_ADDRESS);
  const isPiConnected = agentState.btStatus !== 'disconnected' && agentState.btStatus !== 'error';
  const { bluetoothEnabled, wifiEnabled, handleBluetoothToggle, handleWifiToggle } = useSettingsLogic({ api, sendCommand });
  const handleGoHome = () => navigation.navigate('Home');
  const connectionSettings = [
    { id: 'bluetooth', title: 'Bluetooth', subtitle: bluetoothEnabled ? '🟢 Connected' : '⚫ Disconnected', icon: 'bluetooth' as const, type: 'toggle' as const, value: bluetoothEnabled, onToggle: handleBluetoothToggle },
    { id: 'wifi', title: 'Wi-Fi', subtitle: wifiEnabled ? '📡 Connected' : '📵 Disconnected', icon: 'wifi' as const, type: 'toggle' as const, value: wifiEnabled, onToggle: handleWifiToggle },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={WARM_BG} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: tokens.pad, paddingBottom: Math.round(isCompact ? 80 : 100), maxWidth: 550, alignSelf: 'center', gap: tokens.sectionGap },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader onGoHome={handleGoHome} pageTitle="Settings" isPiConnected={isPiConnected} fontSize={tokens.pageTitle} />
        <Text style={[styles.sectionLabel, { marginTop: Math.round(8 * verticalScale) }]}>CONNECTION</Text>
        <View style={styles.settingsGroup}>{connectionSettings.map((item) => <SettingItem key={item.id} item={item} cardRadius={tokens.cardRadius} scale={scale} />)}</View>
      </ScrollView>
      <View style={styles.navWrapper}>
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={handleGoHome}>
            <AppIcon name="wifi" size={18} color="#B88D69" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Home</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => navigation.navigate('Agent')}>
            <AppIcon name="agent" size={18} color="#B88D69" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Assistant</Text>
          </Pressable>
          <Pressable style={styles.navItem}>
            <AppIcon name="settings" size={18} color={ACCENT_COLOR} />
            <Text style={[styles.navLabelActive, { fontSize: tokens.navLabel }]}>Settings</Text>
            <View style={styles.activeDot} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
