import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppIcon from '../components/AppIcon';
import { RootStackParamList } from '../navigation/types';
import { getApiService } from '../services/ApiService';

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  onOpenSettings?: () => void;
};

const SPEAKER_MODES = ['Standard', 'Loud', 'Quiet', 'Night', 'Music', 'Private'];

const HISTORY_ITEMS = [
  { text: 'Play lo-fi music', time: 'Today, 09:14' },
  { text: 'Set volume to 60%', time: 'Today, 08:57' },
  { text: 'Enable night mode', time: 'Yesterday, 23:10' },
  { text: 'What is the weather?', time: 'Yesterday, 19:42' },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const ACCENT_COLOR = '#F29D4E';
const ACCENT_COLOR_SOFT = 'rgba(242, 157, 78, 0.12)';
const ACCENT_COLOR_SOFT_2 = 'rgba(242, 157, 78, 0.16)';
const ACCENT_COLOR_SOFT_5 = 'rgba(242, 157, 78, 0.22)';
const WARM_BG = '#1A120D';
const WARM_BG_2 = '#22160F';
const WARM_BG_3 = '#2C1C12';
const WARM_BORDER = '#3B2A1E';
const WARM_BORDER_SOFT = 'rgba(242, 157, 78, 0.14)';

export default function HomeScreen({ onOpenSettings }: Props) {
  const navigation = useNavigation<HomeNavigation>();
  const { width, height } = useWindowDimensions();
  const scale = clamp(width / 390, 0.8, 1.2);
  const verticalScale = clamp(height / 844, 0.85, 1.15);
  const isSmall = width <= 370;
  const isCompact = height <= 650;

  const tokens = useMemo(
    () => ({
      pad: Math.round(isSmall ? 12 : 16 * scale),
      navLabel: Math.round(12 * scale),
      titleSize: Math.round(28 * scale),
      metaSize: Math.round(16 * scale),
      iconTile: Math.round(38 * scale),
      cardRadius: Math.round(14 * scale),
      pageTitle: Math.round(30 * scale),
      topGap: Math.round(isCompact ? 6 : 10 * verticalScale),
      sectionGap: Math.round(isCompact ? 10 : 16 * verticalScale),
      orbSize: Math.round(isCompact ? 120 : 166 * scale),
      orbRingSize: Math.round(isCompact ? 220 : 298 * scale),
    }),
    [isSmall, isCompact, scale, verticalScale],
  );

  const coreSize = tokens.orbSize;
  const ringFieldSize = tokens.orbRingSize;
  const [isModePickerOpen, setIsModePickerOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState('Standard');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pulse = useRef(new Animated.Value(0)).current;
  const historyReveal = useRef(new Animated.Value(0)).current;
  const outerWave = useRef(new Animated.Value(0)).current;
  const innerGlow = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0.5)).current;
  const wave2 = useRef(new Animated.Value(0.8)).current;
  const wave3 = useRef(new Animated.Value(1)).current;
  const wave4 = useRef(new Animated.Value(0.7)).current;
  const wave5 = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const outerWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(outerWave, {
          toValue: 1,
          duration: 3200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(outerWave, {
          toValue: 0,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    const innerGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(innerGlow, {
          toValue: 1,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(innerGlow, {
          toValue: 0,
          duration: 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const waves = [wave1, wave2, wave3, wave4, wave5].map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 850 + index * 140,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.35 + index * 0.12,
            duration: 850 + index * 140,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    pulseLoop.start();
    outerWaveLoop.start();
    innerGlowLoop.start();
    waves.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 120);
    });

    return () => {
      pulseLoop.stop();
      outerWaveLoop.stop();
      innerGlowLoop.stop();
      waves.forEach((animation) => animation.stop());
    };
  }, [pulse, outerWave, innerGlow, wave1, wave2, wave3, wave4, wave5]);

  useEffect(() => {
    Animated.timing(historyReveal, {
      toValue: isHistoryOpen ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [historyReveal, isHistoryOpen]);

  // Ascultă status conexiune și events din API
  useEffect(() => {
    try {
      const api = getApiService();
      
      // Ascultă status events
      const unsubscribeStatus = api.on('status', (msg) => {
        setIsConnected(msg.payload?.connected || false);
      });

      // Ascultă response events
      const unsubscribeResponse = api.on('response', (msg) => {
        setIsProcessing(false);
        console.log('Response received:', msg.payload);
      });

      // Ascultă error events
      const unsubscribeError = api.on('error', (msg) => {
        setIsProcessing(false);
        console.error('API Error:', msg.payload);
      });

      // Check initial status
      const status = api.getConnectionStatus();
      setIsConnected(status.connected);

      return () => {
        unsubscribeStatus();
        unsubscribeResponse();
        unsubscribeError();
      };
    } catch (error) {
      console.error('Failed to setup API listeners:', error);
    }
  }, []);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  const glowScale = innerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.04],
  });

  const glowOpacity = innerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.42],
  });

  const waveScale = outerWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.18],
  });

  const waveOpacity = outerWave.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.18, 0.08, 0],
  });

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
      return;
    }

    navigation.navigate('Settings');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={WARM_BG} />
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
        <Text style={[styles.pageTitle, { fontSize: tokens.pageTitle }]}>Home</Text>

        <View
          style={[
            styles.ringsField,
            {
              width: ringFieldSize,
              height: ringFieldSize,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.travelWave,
              {
                width: ringFieldSize * 0.76,
                height: ringFieldSize * 0.76,
                borderRadius: (ringFieldSize * 0.76) / 2,
                transform: [{ scale: waveScale }],
                opacity: waveOpacity,
              },
            ]}
          />

          <View
            style={[
              styles.staticRing,
              {
                width: ringFieldSize * 0.92,
                height: ringFieldSize * 0.92,
                borderRadius: (ringFieldSize * 0.92) / 2,
              },
            ]}
          />
          <View
            style={[
              styles.staticRing,
              {
                width: ringFieldSize * 0.78,
                height: ringFieldSize * 0.78,
                borderRadius: (ringFieldSize * 0.78) / 2,
              },
            ]}
          />
          <View
            style={[
              styles.staticRing,
              {
                width: ringFieldSize * 0.64,
                height: ringFieldSize * 0.64,
                borderRadius: (ringFieldSize * 0.64) / 2,
              },
            ]}
          />

          <View
            style={[
              styles.glowOrb,
              {
                width: coreSize + 70,
                height: coreSize + 70,
                borderRadius: (coreSize + 70) / 2,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.glowPulse,
                {
                  transform: [{ scale: glowScale }],
                  opacity: glowOpacity,
                },
              ]}
            />
          </View>

          <Animated.View
            style={[
              styles.orbOuter,
              {
                width: coreSize + 32,
                height: coreSize + 32,
                borderRadius: (coreSize + 32) / 2,
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          >
            <View style={[styles.orbRing, { width: coreSize, height: coreSize, borderRadius: coreSize / 2 }]}>
              <View style={styles.orbInner}>
                <View style={styles.waveWrap}>
                  <Animated.View style={[styles.waveBar, { height: 12, transform: [{ scaleY: wave1 }] }]} />
                  <Animated.View style={[styles.waveBar, { height: 18, transform: [{ scaleY: wave2 }] }]} />
                  <Animated.View style={[styles.waveBar, { height: 30, transform: [{ scaleY: wave3 }] }]} />
                  <Animated.View style={[styles.waveBar, { height: 20, transform: [{ scaleY: wave4 }] }]} />
                  <Animated.View style={[styles.waveBar, { height: 13, transform: [{ scaleY: wave5 }] }]} />
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={[styles.heroCopyWrap, { marginTop: tokens.topGap }]}>
          <Text style={[styles.infoTitle, { fontSize: tokens.titleSize }]}>How can I help you today?</Text>
          <Text style={[styles.infoMeta, { fontSize: tokens.metaSize, lineHeight: Math.round(tokens.metaSize * 1.45) }]}>
            Your personal voice assistant is ready to assist you.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>ASSISTANT</Text>
        <View style={[styles.card, { borderRadius: tokens.cardRadius }]}>
          <Pressable style={styles.row} onPress={() => setIsModePickerOpen((prev) => !prev)}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconTile, { width: tokens.iconTile, height: tokens.iconTile }]}>
                <Text style={styles.iconGlyph}>≡</Text>
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>Select Mod</Text>
                <Text style={styles.rowSubtitle}>{selectedMode}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>{isModePickerOpen ? '⌃' : '⌄'}</Text>
          </Pressable>

          {isModePickerOpen ? (
            <View style={styles.modeGridWrap}>
              {SPEAKER_MODES.map((mode) => {
                const active = selectedMode === mode;
                return (
                  <Pressable
                    key={mode}
                    style={[styles.modeChip, active && styles.modeChipActive]}
                    onPress={() => {
                      setSelectedMode(mode);
                      setIsModePickerOpen(false);
                    }}
                  >
                    <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>{mode}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.separator} />

          <Pressable style={styles.row} onPress={() => setIsHistoryOpen((prev) => !prev)}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconTile, { width: tokens.iconTile, height: tokens.iconTile }]}>
                <Text style={styles.iconGlyph}>◷</Text>
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>History</Text>
                <Text style={styles.rowSubtitle}>12 commands today</Text>
              </View>
            </View>
            <Text style={styles.chevron}>{isHistoryOpen ? '⌃' : '⌄'}</Text>
          </Pressable>

          {isHistoryOpen ? (
            <Animated.View
              style={[
                styles.historyWrap,
                {
                  opacity: historyReveal,
                  transform: [
                    {
                      translateY: historyReveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-4, 0],
                      }),
                    },
                    {
                      scale: historyReveal.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.98, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.historyHeader}>
                <Text style={styles.historyHeaderTitle}>Recent commands</Text>
                <View style={styles.historyMetaPill}>
                  <Text style={styles.historyHeaderMeta}>{HISTORY_ITEMS.length} items</Text>
                </View>
              </View>

              {HISTORY_ITEMS.map((item, index) => (
                <View key={`${item.text}-${index}`}>
                  <View style={styles.historyItem}>
                    <View style={styles.historyLeftRow}>
                      <View style={styles.historyDotWrap}>
                        <View style={styles.historyDot} />
                      </View>
                      <View style={styles.historyTextWrap}>
                        <Text style={styles.historyCommand} numberOfLines={1}>
                          {item.text}
                        </Text>
                        <Text style={styles.historyTime}>{item.time}</Text>
                      </View>
                    </View>
                    <Text style={styles.historyArrow}>›</Text>
                  </View>
                  {index < HISTORY_ITEMS.length - 1 ? <View style={styles.historyDivider} /> : null}
                </View>
              ))}
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.navWrapper}>
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem}>
            <AppIcon name="wifi" size={18} color={ACCENT_COLOR} />
            <Text style={[styles.navLabelActive, { fontSize: tokens.navLabel }]}>Home</Text>
            <View style={styles.activeDot} />
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => navigation.navigate('Agent')}>
            <AppIcon name="agent" size={18} color="#B88D69" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Assistant</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={handleOpenSettings}>
            <AppIcon name="settings" size={18} color="#B88D69" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Settings</Text>
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
    paddingTop: 8,
    gap: 18,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.34)',
    backgroundColor: 'rgba(242, 157, 78, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPillConnected: {
    borderColor: '#4A6E3A',
    backgroundColor: 'rgba(42, 63, 42, 0.9)',
  },
  statusPillDisconnected: {
    borderColor: '#7A3A3A',
    backgroundColor: 'rgba(63, 42, 42, 0.9)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: ACCENT_COLOR,
  },
  statusDotConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDotError: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F6C089',
  },
  pageTitle: {
    color: '#FFF0DF',
    fontWeight: '800',
    marginBottom: 2,
  },
  ringsField: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.22)',
  },
  travelWave: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.28)',
  },
  orbOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.34)',
    backgroundColor: 'rgba(242, 157, 78, 0.12)',
  },
  glowOrb: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowPulse: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: ACCENT_COLOR_SOFT,
    shadowColor: '#F6B873',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 34,
    elevation: 16,
  },
  orbRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F29D4E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
  orbInner: {
    width: '86%',
    height: '86%',
    borderRadius: 999,
    backgroundColor: '#0D1122',
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  waveBar: {
    width: 4,
    borderRadius: 99,
    backgroundColor: ACCENT_COLOR,
  },
  heroCopyWrap: {
    alignSelf: 'center',
    maxWidth: 300,
    alignItems: 'center',
  },
  sectionLabel: {
    marginTop: 2,
    marginBottom: -4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#7C84A6',
  },
  card: {
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: '#FFF0DF',
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtitle: {
    marginTop: 3,
    color: '#C6A98D',
    fontSize: 12,
  },
  iconTile: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.28)',
    backgroundColor: 'rgba(242, 157, 78, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    color: '#F6C089',
    fontSize: 16,
    fontWeight: '800',
  },
  separator: {
    marginLeft: 68,
    borderBottomWidth: 1,
    borderBottomColor: WARM_BORDER,
  },
  modeGridWrap: {
    marginTop: -2,
    marginBottom: 8,
    marginHorizontal: 12,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.2)',
    backgroundColor: WARM_BG_3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  modeChip: {
    width: '48%',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.18)',
    backgroundColor: WARM_BG_2,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipActive: {
    borderColor: ACCENT_COLOR,
    backgroundColor: 'rgba(242, 157, 78, 0.18)',
  },
  modeChipText: {
    color: '#DCE4FF',
    fontSize: 13,
    fontWeight: '700',
  },
  modeChipTextActive: {
    color: '#F8D1A6',
  },
  historyWrap: {
    marginHorizontal: 12,
    marginTop: -2,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.22)',
    backgroundColor: WARM_BG_2,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 2,
    paddingHorizontal: 2,
  },
  historyHeaderTitle: {
    color: '#FFF0DF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  historyHeaderMeta: {
    color: '#C6A98D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  historyMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: ACCENT_COLOR_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.16)',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.16)',
    backgroundColor: WARM_BG_3,
  },
  historyDivider: {
    height: 1,
    marginLeft: 40,
    marginTop: 1,
    marginBottom: 1,
    backgroundColor: WARM_BORDER_SOFT,
  },
  historyLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  historyDotWrap: {
    width: 20,
    height: 20,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_COLOR_SOFT_2,
    borderWidth: 1,
    borderColor: ACCENT_COLOR_SOFT_5,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: ACCENT_COLOR,
  },
  historyTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  historyCommand: {
    color: '#FFF0DF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyTime: {
    marginTop: 2,
    color: '#C6A98D',
    fontSize: 10,
  },
  historyArrow: {
    color: '#B88D69',
    fontSize: 18,
    fontWeight: '700',
  },
  infoTitle: {
    color: '#FFF0DF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoMeta: {
    marginTop: 6,
    color: '#C6A98D',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  chevron: {
    color: '#B88D69',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
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
    color: '#A87A5A',
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
    color: '#A87A5A',
    fontWeight: '500',
    fontSize: 11,
  },
  navLabelActive: {
    marginTop: 3,
    color: ACCENT_COLOR,
    fontWeight: '700',
    fontSize: 11,
  },
  activeDot: {
    marginTop: 4,
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: ACCENT_COLOR,
  },
});
