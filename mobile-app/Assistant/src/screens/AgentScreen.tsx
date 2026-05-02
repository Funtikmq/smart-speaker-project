import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StatusBar, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAgent, AgentPhase } from '../agent';
import AppIcon from '../components/AppIcon';
import AgentHeader from '../components/agent/AgentHeader';
import ConnectionCard from '../components/agent/ConnectionCard';
import StateCard from '../components/agent/StateCard';
import TranscriptCards from '../components/agent/TranscriptCards';
import { RootStackParamList } from '../navigation/types';
import styles, { ACCENT_COLOR, WARM_BG } from '../styles/agent/AgentScreenStyles';

type AgentNavigation = NativeStackNavigationProp<RootStackParamList, 'Agent'>;
const PI_MAC_ADDRESS = 'B8:27:EB:11:18:DC';
const PHASE_META: Record<AgentPhase, { label: string; color: string }> = { idle: { label: 'Ready for wake word', color: '#6A7193' }, connecting: { label: 'Connecting to Pi', color: '#FF9800' }, listening: { label: 'Listening for audio', color: '#4D9BFF' }, processing: { label: 'Processing audio', color: '#F29D4E' }, responding: { label: 'Generating response', color: '#48C78E' }, speaking: { label: 'Speaking response', color: '#55C5E8' }, error: { label: 'Agent error', color: '#FF6B6B' } };
const WARM_BG_2 = '#22160F';
const WARM_BG_3 = '#2C1C12';
const WARM_BORDER = '#3B2A1E';
function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max); }

export default function AgentScreen() {
  const navigation = useNavigation<AgentNavigation>();
  const { width, height } = useWindowDimensions();
  const scale = clamp(width / 390, 0.8, 1.2), verticalScale = clamp(height / 844, 0.85, 1.15), isSmall = width <= 370, isCompact = height <= 650;
  const { state, connect, disconnect } = useAgent(PI_MAC_ADDRESS);
  const { phase, btStatus, transcript, partialText, response, error, audioStats } = state;
  const phaseMeta = PHASE_META[phase], isConnected = btStatus !== 'disconnected' && btStatus !== 'error';
  console.log('[AgentScreen RENDER] phase:', phase, '| btStatus:', btStatus, '| phaseMeta.label:', phaseMeta.label);
  const statusColor = isConnected ? phaseMeta.color : '#FF6B6B';
  const isDisconnectedCheck = btStatus === 'disconnected'; console.log('[AgentScreen TEXT] btStatus === "disconnected"?', isDisconnectedCheck);
  const stateStatusText = 'Assistant is not connected'; console.log('[AgentScreen TEXT FINAL - HARD FIX] stateStatusText will render as:', stateStatusText);
  const stateStatusDetail = 'Connect to Pi to start listening.';
  useEffect(() => { console.log('[AgentScreen] btStatus CHANGED TO:', btStatus, '| stateStatusText will be:', stateStatusText, '| stateStatusDetail will be:', stateStatusDetail); }, [btStatus]);
  const handleDisconnect = () => { console.log('[AgentScreen] DISCONNECT button pressed, current btStatus:', btStatus); disconnect(); };
  const tokens = useMemo(() => ({ pad: Math.round(isSmall ? 12 : 16 * scale), navLabel: Math.round(12 * scale), cardRadius: Math.round(14 * scale), pageTitle: Math.round(30 * scale), sectionGap: Math.round(isCompact ? 10 : 16 * verticalScale), iconTile: Math.round(40 * scale) }), [isSmall, isCompact, scale, verticalScale]);
  return (<View style={styles.root}><StatusBar barStyle="light-content" backgroundColor={WARM_BG} /><ScrollView contentContainerStyle={[styles.content, { paddingHorizontal: tokens.pad, paddingBottom: Math.round(isCompact ? 80 : 100), maxWidth: 550, alignSelf: 'center', gap: tokens.sectionGap }]} showsVerticalScrollIndicator={false}><AgentHeader onGoBack={() => navigation.navigate('Home')} isConnected={isConnected} pageTitle={tokens.pageTitle} /><Text style={styles.sectionLabel}>CONNECTION</Text><ConnectionCard isConnected={isConnected} macAddress={PI_MAC_ADDRESS} onConnect={connect} onDisconnect={handleDisconnect} cardRadius={tokens.cardRadius} iconTile={tokens.iconTile} /><Text style={styles.sectionLabel}>STATE</Text><StateCard isConnected={isConnected} phase={phase} phaseLabel={phaseMeta.label} phaseColor={phaseMeta.color} audioStats={audioStats} cardRadius={tokens.cardRadius} /><TranscriptCards partialText={partialText} transcript={transcript} response={response} error={error} cardRadius={tokens.cardRadius} /></ScrollView><View style={styles.navWrapper}><View style={styles.bottomNav}><Pressable style={styles.navItem} onPress={() => navigation.navigate('Home')}><AppIcon name="wifi" size={18} color="#B88D69" /><Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Home</Text></Pressable><Pressable style={styles.navItem}><AppIcon name="agent" size={18} color={ACCENT_COLOR} /><Text style={[styles.navLabelActive, { fontSize: tokens.navLabel }]}>Assistant</Text><View style={styles.activeDot} /></Pressable><Pressable style={styles.navItem} onPress={() => navigation.navigate('Settings')}><AppIcon name="settings" size={18} color="#B88D69" /><Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Settings</Text></Pressable></View></View></View>);
}
