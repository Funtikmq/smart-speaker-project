import React from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function HomeScreen({ onOpenSettings }) {
  const { width } = useWindowDimensions();
  const scale = clamp(width / 390, 0.9, 1.08);
  const titleSize = Math.round(33 * scale);
  const orbSize = Math.round(180 * scale);
  const orbOuterSize = Math.round(224 * scale);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#090C16" />
      <LinearGradient colors={["#0A0E1D", "#090C18", "#070912"]} style={styles.page}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <View>
              <Text style={[styles.brand, { fontSize: titleSize }]}>PiAssist</Text>
              <Text style={styles.brandSub}>Home Assistant</Text>
            </View>
            <View style={styles.topRight}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>Connected</Text>
                <Feather name="chevron-right" size={14} color="#9786CC" />
              </View>
              <Pressable style={styles.menuIcon}>
                <Feather name="more-horizontal" size={17} color="#8E96BB" />
              </Pressable>
            </View>
          </View>

          <View style={[styles.orbOuter, { width: orbOuterSize, height: orbOuterSize, borderRadius: orbOuterSize / 2 }]}>
            <LinearGradient colors={["#AB74FF", "#7E4DFA", "#6C42E0"]} style={[styles.orbRing, { width: orbSize, height: orbSize, borderRadius: orbSize / 2 }]}>
              <View style={styles.orbInner}>
                <View style={styles.waveWrap}>
                  <View style={[styles.waveBar, { height: 12 }]} />
                  <View style={[styles.waveBar, { height: 19 }]} />
                  <View style={[styles.waveBar, { height: 30 }]} />
                  <View style={[styles.waveBar, { height: 21 }]} />
                  <View style={[styles.waveBar, { height: 14 }]} />
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoTitleRow}>
              <View style={styles.infoCheckWrap}>
                <Feather name="check-circle" size={14} color="#B591FF" />
              </View>
              <Text style={styles.infoTitle}>Everything is looking good</Text>
            </View>
            <Text style={styles.infoMeta}>Receiving data  •  Last ping 2s ago</Text>
          </View>

          <Text style={styles.quickTitle}>Quick Actions</Text>

          <Pressable style={styles.actionCard} onPress={() => {}}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIconTile}>
                <Feather name="volume-2" size={19} color="#B690FF" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Volume</Text>
                <Text style={styles.actionSubtitle}>75%</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color="#697193" />
          </Pressable>

          <Pressable style={styles.actionCard} onPress={() => {}}>
            <View style={styles.actionLeft}>
              <View style={styles.actionIconTile}>
                <Feather name="clock" size={19} color="#B690FF" />
              </View>
              <View>
                <Text style={styles.actionTitle}>History</Text>
                <Text style={styles.actionSubtitle}>12 commands today</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color="#697193" />
          </Pressable>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem}>
            <Feather name="home" size={20} color="#A578FF" />
            <Text style={styles.navLabelActive}>Home</Text>
          </Pressable>
          <Pressable style={styles.navItem}>
            <Feather name="mic" size={20} color="#646D8D" />
            <Text style={styles.navLabel}>Assistant</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={onOpenSettings}>
            <Feather name="settings" size={20} color="#646D8D" />
            <Text style={styles.navLabel}>Settings</Text>
          </Pressable>
        </View>

        <LinearGradient colors={["#2F1E56", "#1A1734"]} style={styles.editPill}>
          <Text style={styles.editText}>Edit</Text>
        </LinearGradient>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#090C16"
  },
  page: {
    flex: 1
  },
  content: {
    width: "100%",
    maxWidth: 470,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 8
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  brand: {
    color: "#F0F2FF",
    fontWeight: "800"
  },
  brandSub: {
    marginTop: -2,
    color: "#8B94B7",
    fontSize: 15
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4C3C75",
    backgroundColor: "#2A2142",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#A578FF"
  },
  statusPillText: {
    color: "#B79CEB",
    fontSize: 12,
    fontWeight: "700"
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A3148",
    backgroundColor: "#1A2136",
    alignItems: "center",
    justifyContent: "center"
  },
  orbOuter: {
    marginTop: 8,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#2C2A4A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22, 19, 43, 0.3)"
  },
  orbRing: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9E6DFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8
  },
  orbInner: {
    width: "88%",
    height: "88%",
    borderRadius: 999,
    backgroundColor: "#101226",
    borderWidth: 1,
    borderColor: "#49337C",
    alignItems: "center",
    justifyContent: "center"
  },
  waveWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  waveBar: {
    width: 4,
    borderRadius: 99,
    backgroundColor: "#A980FF"
  },
  infoCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2B324A",
    backgroundColor: "rgba(22, 26, 43, 0.9)",
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  infoCheckWrap: {
    width: 18,
    alignItems: "center"
  },
  infoTitle: {
    color: "#E7E9F7",
    fontSize: 18,
    fontWeight: "700"
  },
  infoMeta: {
    marginTop: 4,
    color: "#9AA3C2",
    fontSize: 13
  },
  quickTitle: {
    marginTop: 14,
    marginBottom: 8,
    color: "#F1F3FF",
    fontSize: 29,
    fontWeight: "800"
  },
  actionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A314A",
    backgroundColor: "rgba(21, 25, 41, 0.9)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  actionIconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#44315F",
    backgroundColor: "#2A2143",
    alignItems: "center",
    justifyContent: "center"
  },
  actionTitle: {
    color: "#ECEFFF",
    fontSize: 24,
    fontWeight: "700"
  },
  actionSubtitle: {
    marginTop: 1,
    color: "#8F97B8",
    fontSize: 17
  },
  bottomSpacer: {
    height: 120
  },
  bottomNav: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2A3149",
    backgroundColor: "rgba(14, 17, 29, 0.96)",
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  navItem: {
    alignItems: "center",
    minWidth: 84
  },
  navLabel: {
    marginTop: 3,
    color: "#646D8D",
    fontSize: 12,
    fontWeight: "500"
  },
  navLabelActive: {
    marginTop: 3,
    color: "#A578FF",
    fontSize: 12,
    fontWeight: "700"
  },
  editPill: {
    position: "absolute",
    left: 12,
    bottom: 16,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  editText: {
    color: "#F4EEFF",
    fontSize: 34,
    fontWeight: "700"
  }
});
