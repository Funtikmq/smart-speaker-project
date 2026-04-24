import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import QuickActionCard from "../components/QuickActionCard";

const quickActions = [
  { title: "Play Music", subtitle: "Start your favorite mix", accent: "#F25C54" },
  { title: "Voice Notes", subtitle: "Record and organize ideas", accent: "#2F80ED" },
  { title: "Morning Brief", subtitle: "Weather and headlines", accent: "#27AE60" },
  { title: "Smart Home", subtitle: "Lights, scenes, devices", accent: "#F2A03D" }
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F8FC" />
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={["#FFD166", "#F4978E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.kicker}>SMART SPEAKER</Text>
          <Text style={styles.heading}>Welcome back, Nicol</Text>
          <Text style={styles.heroText}>
            Your assistant is online and ready for voice commands.
          </Text>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionHint}>Tap to launch</Text>
        </View>

        <View style={styles.grid}>
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              subtitle={action.subtitle}
              accent={action.accent}
              onPress={() => {}}
            />
          ))}
        </View>

        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
          <Text style={styles.nowPlayingTitle}>Lo-Fi Focus Beats</Text>
          <Text style={styles.nowPlayingMeta}>Bedroom speaker • 42% volume</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F5F8FC"
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    gap: 18
  },
  hero: {
    marginTop: 8,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 24,
    shadowColor: "#F4978E",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 3
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#22262D"
  },
  heading: {
    marginTop: 6,
    fontSize: 28,
    fontWeight: "800",
    color: "#101217"
  },
  heroText: {
    marginTop: 8,
    fontSize: 14,
    color: "#2D3541",
    lineHeight: 21
  },
  sectionHeader: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#13161C"
  },
  sectionHint: {
    fontSize: 13,
    fontWeight: "600",
    color: "#677083"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10
  },
  nowPlaying: {
    marginTop: 4,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DCE3EF",
    backgroundColor: "#FFFFFF"
  },
  nowPlayingLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#7B8597"
  },
  nowPlayingTitle: {
    marginTop: 8,
    fontSize: 19,
    fontWeight: "800",
    color: "#1A1C20"
  },
  nowPlayingMeta: {
    marginTop: 6,
    fontSize: 13,
    color: "#5B6372"
  }
});
