import React from 'react';
import { Text, View } from 'react-native';
import styles from '../../styles/agent/AgentScreenStyles';

type AudioStats = {
  chunksReceived: number;
  durationSeconds: number;
  totalBytes: number;
};

type Props = {
  isConnected: boolean;
  phase: string;
  phaseLabel: string;
  phaseColor: string;
  audioStats: AudioStats;
  cardRadius: number;
};

export default function StateCard({ isConnected, phase, phaseLabel, phaseColor, audioStats, cardRadius }: Props) {
  // Text rules
  const stateStatusText = !isConnected ? 'Assistant is not connected' : phase === 'idle' ? 'Ready for wake word' : phaseLabel;
  const stateStatusDetail = !isConnected ? 'Connect to Pi to start listening.' : phase === 'idle' ? 'Assistant is ready to listen.' : 'Assistant is ready to listen.';

  return (
    <View style={[styles.stateCard, { borderRadius: cardRadius }]}>
      <View style={styles.stateVisualsWrap}>
        <View style={styles.stateRingsContainer}>
          {isConnected ? (
            // Concentric rings with center bolt
            <>
              <View style={[styles.stateRing, styles.stateRingOuter, { borderColor: phaseColor, opacity: 0.4 }]} />
              <View style={[styles.stateRing, styles.stateRingMiddle, { borderColor: phaseColor, opacity: 0.6 }]} />
              <View style={[styles.stateCircle, { backgroundColor: phaseColor, shadowColor: phaseColor }]}>
                <Text style={styles.stateEmoji}>⚡</Text>
              </View>
            </>
          ) : (
            // Disconnected icon: circle with X
            <View style={[styles.stateCircle, { backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={[styles.stateEmoji, { color: '#fff' }]}>✖</Text>
            </View>
          )}
        </View>

        <View style={styles.stateInfoWrap}>
          <Text style={styles.stateStatusLabel}>Status</Text>
          <Text style={[styles.stateStatusValue, { color: isConnected ? phaseColor : '#FF6B6B' }]}>{stateStatusText}</Text>
          <Text style={styles.stateStatusDetail}>{stateStatusDetail}</Text>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.statsGrid}>
        <View style={styles.statChip}><Text style={styles.statLabel}>Chunks</Text><Text style={styles.statValue}>{audioStats.chunksReceived}</Text></View>
        <View style={styles.statChip}><Text style={styles.statLabel}>Duration</Text><Text style={styles.statValue}>{audioStats.durationSeconds.toFixed(1)}s</Text></View>
        <View style={styles.statChip}><Text style={styles.statLabel}>Bytes</Text><Text style={styles.statValue}>{(audioStats.totalBytes / 1024).toFixed(1)} KB</Text></View>
      </View>
    </View>
  );
}
