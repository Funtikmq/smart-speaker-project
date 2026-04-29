import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ Setări</Text>
      <Text style={styles.subtitle}>Configurare aplicație</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#4fc3f7' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8 },
});
