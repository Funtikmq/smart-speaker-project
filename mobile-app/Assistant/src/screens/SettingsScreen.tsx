import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppIcon from '../components/AppIcon';
import { RootStackParamList } from '../navigation/types';
import { useApi } from '../hooks/useApi';

type SettingsNavigation = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const ACCENT_COLOR = '#F29D4E';
const WARM_BG = '#1A120D';
const WARM_BG_2 = '#22160F';
const WARM_BG_3 = '#2C1C12';
const WARM_BORDER = '#3B2A1E';
const WARM_BORDER_SOFT = 'rgba(242, 157, 78, 0.14)';

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigation>();
  const { width, height } = useWindowDimensions();
  const scale = clamp(width / 390, 0.8, 1.2);
  const verticalScale = clamp(height / 844, 0.85, 1.15);
  const isSmall = width <= 370;
  const isCompact = height <= 650;

  const { api, isConnected, status, sendCommand } = useApi();

  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const tokens = useMemo(
    () => ({
      pad: Math.round(isSmall ? 12 : 16 * scale),
      navLabel: Math.round(12 * scale),
      titleSize: Math.round(28 * scale),
      metaSize: Math.round(16 * scale),
      cardRadius: Math.round(14 * scale),
      pageTitle: Math.round(30 * scale),
      sectionGap: Math.round(isCompact ? 10 : 16 * verticalScale),
    }),
    [isSmall, isCompact, scale, verticalScale],
  );

  useEffect(() => {
    if (!api) return;

    const unsubscribe = api.on('response', (msg) => {
      setResponseTime(msg.payload?.timestamp ? Date.now() - msg.payload.timestamp : null);
      setFeedbackMessage('✅ Command executed');
      setTimeout(() => setFeedbackMessage(null), 2000);
    });

    return () => unsubscribe();
  }, [api]);

  const handleBluetoothToggle = (value: boolean) => {
    setBluetoothEnabled(value);
    sendCommand('toggle_bluetooth', { enabled: value });
    setFeedbackMessage(value ? '🔵 Bluetooth ON' : '⚫ Bluetooth OFF');
    setTimeout(() => setFeedbackMessage(null), 2000);
  };

  const handleWifiToggle = (value: boolean) => {
    setWifiEnabled(value);
    sendCommand('toggle_wifi', { enabled: value });
    setFeedbackMessage(value ? '📡 Wi-Fi ON' : '📵 Wi-Fi OFF');
    setTimeout(() => setFeedbackMessage(null), 2000);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Remove all stored data?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => {
          sendCommand('clear_cache', {});
          setFeedbackMessage('🧹 Cache cleared');
          setTimeout(() => setFeedbackMessage(null), 2000);
        },
        style: 'destructive',
      },
    ]);
  };

  const handleRestartServer = () => {
    Alert.alert('Restart Server', 'Reconnect to backend?', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Restart',
        onPress: () => {
          sendCommand('restart_server', {});
          setFeedbackMessage('🔄 Restarting...');
          setTimeout(() => setFeedbackMessage(null), 3000);
        },
        style: 'default',
      },
    ]);
  };

  const connectionSettings: SettingItem[] = [
    {
      id: 'bluetooth',
      title: 'Bluetooth',
      subtitle: bluetoothEnabled ? '🟢 Connected' : '⚫ Disconnected',
      icon: 'bluetooth',
      type: 'toggle',
      value: bluetoothEnabled,
      onToggle: handleBluetoothToggle,
    },
    {
      id: 'wifi',
      title: 'Wi-Fi',
      subtitle: wifiEnabled ? '📡 Connected' : '📵 Disconnected',
      icon: 'wifi',
      type: 'toggle',
      value: wifiEnabled,
      onToggle: handleWifiToggle,
    },
  ];

  const serverSettings: SettingItem[] = [
    {
      id: 'response_time',
      title: 'Response Time',
      subtitle: responseTime ? `${responseTime}ms` : 'Not measured',
      icon: 'agent',
      type: 'info',
    },
  ];

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const renderSettingItem = (item: SettingItem) => {
    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [
          styles.settingItem,
          { borderRadius: tokens.cardRadius },
          pressed && styles.settingItemPressed,
        ]}
        onPress={item.type === 'button' ? item.onPress : undefined}
        disabled={item.type !== 'button'}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconTile, { width: Math.round(40 * scale), height: Math.round(40 * scale) }]}>
            <AppIcon name={item.icon} size={Math.round(18 * scale)} color={ACCENT_COLOR} />
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={[styles.settingTitle, { fontSize: Math.round(15 * scale) }]}>{item.title}</Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { fontSize: Math.round(12 * scale) }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
        </View>

        {item.type === 'toggle' && (
          <Switch
            value={item.value || false}
            onValueChange={item.onToggle}
            trackColor={{ false: WARM_BORDER, true: 'rgba(242, 157, 78, 0.3)' }}
            thumbColor={item.value ? ACCENT_COLOR : '#B88D69'}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={WARM_BG} />

      {feedbackMessage && (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>{feedbackMessage}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: tokens.pad,
            paddingBottom: Math.round(isCompact ? 80 : 100),
            maxWidth: 550,
            alignSelf: 'center',
            gap: tokens.sectionGap,
          },
        ]}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={handleGoHome} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Text style={[styles.pageTitle, { fontSize: tokens.pageTitle }]}>Settings</Text>
          <View style={[styles.serverIndicator, isConnected ? styles.serverIndicatorOnline : styles.serverIndicatorOffline]}>
            <View style={[styles.indicatorDot, isConnected ? styles.indicatorDotOnline : styles.indicatorDotOffline]} />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Math.round(8 * verticalScale) }]}>CONNECTION</Text>
        <View style={styles.settingsGroup}>
          {connectionSettings.map((item) => renderSettingItem(item))}
        </View>

        <Text style={styles.sectionLabel}>SERVER</Text>
        <View style={styles.settingsGroup}>
          {serverSettings.map((item) => renderSettingItem(item))}
        </View>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WARM_BG,
  },
  content: {
    width: '100%',
    paddingTop: 12,
    gap: 18,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#E8C8A2',
    fontSize: 20,
    fontWeight: '700',
  },
  pageTitle: {
    color: '#FFF0DF',
    fontWeight: '800',
    marginBottom: 0,
  },
  sectionLabel: {
    marginTop: 6,
    marginBottom: -4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#B88D69',
  },
  settingsGroup: {
    gap: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
  },
  settingItemPressed: {
    opacity: 0.7,
    backgroundColor: WARM_BG_3,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconTile: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  settingTitle: {
    color: '#FFF0DF',
    fontWeight: '700',
  },
  settingSubtitle: {
    marginTop: 3,
    color: '#C6A98D',
  },
  feedbackBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(242, 157, 78, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: ACCENT_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  feedbackText: {
    color: '#F6C089',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  serverIndicator: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  serverIndicatorOnline: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  serverIndicatorOffline: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorDotOnline: {
    backgroundColor: '#4CAF50',
  },
  indicatorDotOffline: {
    backgroundColor: '#FF6B6B',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  actionButtonWarning: {
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  actionButtonInfo: {
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    color: '#FFF0DF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonSubtitle: {
    color: '#C6A98D',
    fontSize: 12,
    marginTop: 2,
  },
  navWrapper: {
    backgroundColor: WARM_BG,
  },
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: WARM_BORDER,
    backgroundColor: WARM_BG,
    paddingTop: 6,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    minWidth: 70,
    flex: 1,
    paddingVertical: 6,
  },
  navGlyph: {
    color: '#B88D69',
    fontSize: 18,
    fontWeight: '700',
  },
  navGlyphActive: {
    color: ACCENT_COLOR,
    fontSize: 18,
    fontWeight: '800',
  },
  navLabel: {
    marginTop: 3,
    color: '#B88D69',
    fontWeight: '500',
  },
  navLabelActive: {
    marginTop: 3,
    color: ACCENT_COLOR,
    fontWeight: '700',
  },
  activeDot: {
    marginTop: 4,
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: ACCENT_COLOR,
  },
});
