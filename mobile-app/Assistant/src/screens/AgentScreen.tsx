import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAgent, AgentPhase } from '../agent';

// ─── Configurare ──────────────────────────────────────────────────────────────
const PI_MAC_ADDRESS = 'B8:27:EB:11:18:DC';

// ─── Culori stare ─────────────────────────────────────────────────────────────
const PHASE_COLORS: Record<AgentPhase, string> = {
  idle: '#6c757d',
  connecting: '#fd7e14',
  listening: '#0d6efd',
  processing: '#6f42c1',
  responding: '#198754',
  speaking: '#0dcaf0',
  error: '#dc3545',
};

const PHASE_LABELS: Record<AgentPhase, string> = {
  idle: '⏸  Aștept wake word...',
  connecting: '🔄 Conectare la Pi...',
  listening: '🎙  Ascult audio de la Pi',
  processing: '⚙️  Procesez audio...',
  responding: '🤖 Generez răspuns...',
  speaking: '🔊 Răspund...',
  error: '❌ Eroare',
};

// ─── Componenta ───────────────────────────────────────────────────────────────

export default function AgentScreen() {
  const { state, connect, disconnect } = useAgent(PI_MAC_ADDRESS);
  const {
    phase,
    btStatus,
    transcript,
    partialText,
    response,
    error,
    audioStats,
  } = state;

  const isConnected = btStatus !== 'disconnected' && btStatus !== 'error';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Bluetooth */}
        <View style={styles.card}>
          <Text style={styles.label}>Bluetooth</Text>
          <Text
            style={[
              styles.status,
              { color: isConnected ? '#198754' : '#6c757d' },
            ]}
          >
            {isConnected ? `✓ Conectat — ${PI_MAC_ADDRESS}` : '○ Deconectat'}
          </Text>
        </View>

        {/* Faza curentă */}
        <View
          style={[styles.phaseBar, { backgroundColor: PHASE_COLORS[phase] }]}
        >
          <Text style={styles.phaseText}>{PHASE_LABELS[phase]}</Text>
        </View>

        {/* Statistici audio — vizibile în faza listening */}
        {phase === 'listening' && (
          <View style={styles.card}>
            <Text style={styles.label}>Audio primit de la Pi</Text>
            <Text style={styles.stat}>Chunks: {audioStats.chunksReceived}</Text>
            <Text style={styles.stat}>
              Durată: {audioStats.durationSeconds.toFixed(1)}s
            </Text>
            <Text style={styles.stat}>
              Total: {(audioStats.totalBytes / 1024).toFixed(1)} KB
            </Text>
          </View>
        )}

        {/* Text parțial în timp real */}
        {partialText.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Transcriere (live)</Text>
            <Text style={styles.partial}>{partialText}</Text>
          </View>
        )}

        {/* Transcriere finală */}
        {transcript.length > 0 && (
          <View style={[styles.card, styles.transcriptCard]}>
            <Text style={styles.label}>Ai spus</Text>
            <Text style={styles.transcript}>{transcript}</Text>
          </View>
        )}

        {/* Răspuns asistent */}
        {response.length > 0 && (
          <View style={[styles.card, styles.responseCard]}>
            <Text style={styles.label}>Asistent</Text>
            <Text style={styles.response}>{response}</Text>
          </View>
        )}

        {/* Eroare */}
        {error && (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Butoane */}
        <View style={styles.buttonRow}>
          {!isConnected ? (
            <TouchableOpacity style={styles.btnConnect} onPress={connect}>
              <Text style={styles.btnText}>Conectează la Pi</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btnDisconnect} onPress={disconnect}>
              <Text style={styles.btnText}>Deconectează</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info pentru debug */}
        <View style={styles.debugBox}>
          <Text style={styles.debugText}>
            btStatus: {btStatus}
            {'\n'}
            phase: {phase}
            {'\n'}
            chunks: {audioStats.chunksReceived}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stiluri ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  transcriptCard: { borderLeftWidth: 4, borderLeftColor: '#0d6efd' },
  responseCard: { borderLeftWidth: 4, borderLeftColor: '#198754' },
  errorCard: { backgroundColor: '#f8d7da' },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  status: { fontSize: 15, fontWeight: '500' },
  stat: { fontSize: 14, color: '#495057', lineHeight: 22 },
  partial: { fontSize: 16, color: '#6c757d', fontStyle: 'italic' },
  transcript: { fontSize: 18, color: '#212529', lineHeight: 26 },
  response: { fontSize: 16, color: '#212529', lineHeight: 24 },
  errorText: { fontSize: 14, color: '#721c24' },
  phaseBar: { borderRadius: 10, padding: 14, alignItems: 'center' },
  phaseText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonRow: { alignItems: 'center', marginTop: 8 },
  btnConnect: {
    backgroundColor: '#0d6efd',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  btnDisconnect: {
    backgroundColor: '#6c757d',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  debugBox: {
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  debugText: { fontSize: 11, color: '#868e96', fontFamily: 'monospace' },
});
