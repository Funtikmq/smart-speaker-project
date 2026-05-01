import React, { useMemo, useEffect, useRef } from 'react';
import {
  Animated,
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
import { useAgent, AgentPhase } from '../agent';
import AppIcon from '../components/AppIcon';
import { RootStackParamList } from '../navigation/types';

type AgentNavigation = NativeStackNavigationProp<RootStackParamList, 'Agent'>;

const PI_MAC_ADDRESS = 'B8:27:EB:11:18:DC';

const PHASE_META: Record<AgentPhase, { label: string; color: string }> = {
  idle: { label: 'Ready for wake word', color: '#6A7193' },
  connecting: { label: 'Connecting to Pi', color: '#FF9800' },
  listening: { label: 'Listening for audio', color: '#4D9BFF' },
  processing: { label: 'Processing audio', color: '#F29D4E' },
  responding: { label: 'Generating response', color: '#48C78E' },
  speaking: { label: 'Speaking response', color: '#55C5E8' },
  error: { label: 'Agent error', color: '#FF6B6B' },
};

const ACCENT_COLOR = '#F29D4E';
const WARM_BG = '#1A120D';
const WARM_BG_2 = '#22160F';
const WARM_BG_3 = '#2C1C12';
const WARM_BORDER = '#3B2A1E';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function AgentScreen() {
  const navigation = useNavigation<AgentNavigation>();
  const { width, height } = useWindowDimensions();
  const scale = clamp(width / 390, 0.8, 1.2);
  const verticalScale = clamp(height / 844, 0.85, 1.15);
  const isSmall = width <= 370;
  const isCompact = height <= 650;

  const { state, connect, disconnect } = useAgent(PI_MAC_ADDRESS);
  const { phase, btStatus, transcript, partialText, response, error, audioStats } = state;
  const phaseMeta = PHASE_META[phase];
  const isConnected = btStatus !== 'disconnected' && btStatus !== 'error';

  // Animation for phase dot pulse effect
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const isActivePhase = ['connecting', 'listening', 'processing', 'speaking'].includes(phase);
    if (isActivePhase) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase, pulseAnim]);

  const tokens = useMemo(
    () => ({
      pad: Math.round(isSmall ? 12 : 16 * scale),
      navLabel: Math.round(12 * scale),
      cardRadius: Math.round(14 * scale),
      pageTitle: Math.round(30 * scale),
      sectionGap: Math.round(isCompact ? 10 : 16 * verticalScale),
      iconTile: Math.round(40 * scale),
    }),
    [isSmall, isCompact, scale, verticalScale],
  );

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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable style={styles.circleIcon} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <Text style={[styles.pageTitle, { fontSize: tokens.pageTitle }]}>Assistant</Text>

          <View
            style={[
              styles.serverIndicator,
              isConnected ? styles.serverIndicatorOnline : styles.serverIndicatorOffline,
            ]}
          >
            <View style={[styles.indicatorDot, isConnected ? styles.indicatorDotOnline : styles.indicatorDotOffline]} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>CONNECTION</Text>
        <View style={[styles.card, { borderRadius: tokens.cardRadius }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconTile, { width: tokens.iconTile, height: tokens.iconTile }]}>
                <AppIcon name="bluetooth" size={18} color={ACCENT_COLOR} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>Bluetooth Link</Text>
                <Text style={styles.rowSubtitle}>{isConnected ? `Connected - ${PI_MAC_ADDRESS}` : 'Disconnected'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.separator} />

          <Pressable
            style={[styles.primaryButton, isConnected ? styles.secondaryButton : styles.connectButton]}
            onPress={isConnected ? disconnect : connect}
          >
            <Text style={styles.primaryButtonText}>{isConnected ? 'Disconnect' : 'Connect to Pi'}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>STATE</Text>
        <View style={[styles.stateCard, { borderRadius: tokens.cardRadius }]}>
          <View style={styles.stateVisualsWrap}>
            <View style={styles.stateRingsContainer}>
              {/* Outer ring */}
              <Animated.View
                style={[
                  styles.stateRing,
                  styles.stateRingOuter,
                  { 
                    borderColor: phaseMeta.color,
                    opacity: 0.4,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              {/* Middle ring */}
              <Animated.View
                style={[
                  styles.stateRing,
                  styles.stateRingMiddle,
                  { 
                    borderColor: phaseMeta.color,
                    opacity: 0.6,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              />
              {/* Center circle */}
              <Animated.View
                style={[
                  styles.stateCircle,
                  { 
                    backgroundColor: phaseMeta.color,
                    shadowColor: phaseMeta.color,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Text style={styles.stateEmoji}>⚡</Text>
              </Animated.View>
            </View>

            <View style={styles.stateInfoWrap}>
              <Text style={styles.stateStatusLabel}>Status</Text>
              <Text style={[styles.stateStatusValue, { color: phaseMeta.color }]}>
                {phaseMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />
          
          <View style={styles.statsGrid}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Chunks</Text>
              <Text style={styles.statValue}>{audioStats.chunksReceived}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>{audioStats.durationSeconds.toFixed(1)}s</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>Bytes</Text>
              <Text style={styles.statValue}>{(audioStats.totalBytes / 1024).toFixed(1)} KB</Text>
            </View>
          </View>
        </View>

        {partialText.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>LIVE TRANSCRIPT</Text>
            <View style={[styles.card, { borderRadius: tokens.cardRadius }]}>
              <Text style={styles.liveText}>{partialText}</Text>
            </View>
          </>
        ) : null}

        {transcript.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>YOU SAID</Text>
            <View style={[styles.card, styles.transcriptCard, { borderRadius: tokens.cardRadius }]}>
              <Text style={styles.mainText}>{transcript}</Text>
            </View>
          </>
        ) : null}

        {response.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>ASSISTANT</Text>
            <View style={[styles.card, styles.responseCard, { borderRadius: tokens.cardRadius }]}>
              <Text style={styles.mainText}>{response}</Text>
            </View>
          </>
        ) : null}

        {error ? (
          <>
            <Text style={styles.sectionLabel}>ERROR</Text>
            <View style={[styles.card, styles.errorCard, { borderRadius: tokens.cardRadius }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.navWrapper}>
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => navigation.navigate('Home')}>
            <AppIcon name="wifi" size={18} color="#B88D69" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Home</Text>
          </Pressable>
          <Pressable style={styles.navItem}>
            <AppIcon name="agent" size={18} color={ACCENT_COLOR} />
            <Text style={[styles.navLabelActive, { fontSize: tokens.navLabel }]}>Assistant</Text>
            <View style={styles.activeDot} />
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => navigation.navigate('Settings')}>
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
  backArrow: {
    color: '#E8C8A2',
    fontSize: 20,
    fontWeight: '700',
  },
  pageTitle: {
    color: '#FFF0DF',
    fontWeight: '800',
  },
  sectionLabel: {
    marginTop: 6,
    marginBottom: -4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#B88D69',
  },
  card: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
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
  separator: {
    marginVertical: 12,
    height: 1,
    backgroundColor: WARM_BORDER,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  connectButton: {
    borderColor: ACCENT_COLOR,
    backgroundColor: 'rgba(242, 157, 78, 0.16)',
  },
  secondaryButton: {
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_3,
  },
  primaryButtonText: {
    color: '#FFF0DF',
    fontSize: 14,
    fontWeight: '700',
  },
  phasePillWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
  },
  phaseDot: {
    width: 12,
    height: 12,
    borderRadius: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  phaseText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  stateCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  stateVisualsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stateRingsContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  stateRingOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  stateRingMiddle: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  stateCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  stateEmoji: {
    fontSize: 20,
    fontWeight: '700',
  },
  stateInfoWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  stateStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#B88D69',
    textTransform: 'uppercase',
  },
  stateStatusValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  stateContentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stateIndicatorWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIndicatorOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIndicatorInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    elevation: 8,
  },
  stateTextWrap: {
    flex: 1,
  },
  stateLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#B88D69',
    textTransform: 'uppercase',
  },
  stateValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  statsGrid: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_3,
  },
  statLabel: {
    color: '#C6A98D',
    fontSize: 11,
    fontWeight: '600',
  },
  statValue: {
    marginTop: 4,
    color: '#FFF0DF',
    fontSize: 13,
    fontWeight: '700',
  },
  liveText: {
    color: '#E3C6AB',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  transcriptCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4D9BFF',
  },
  responseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#48C78E',
  },
  mainText: {
    color: '#FFF0DF',
    fontSize: 16,
    lineHeight: 24,
  },
  errorCard: {
    borderColor: '#6A2D37',
    backgroundColor: 'rgba(106, 45, 55, 0.28)',
  },
  errorText: {
    color: '#FFC5CD',
    fontSize: 14,
    lineHeight: 21,
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
