import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const SETTINGS_STORAGE_KEY = "assistant_settings_v2";

const initialSettings = {
  cloudSync: false,
  wakeWord: true,
  volume: 75
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function Row({ icon, title, subtitle, right, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        {icon}
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      {right}
    </Pressable>
  );
}

export default function SettingsScreen({ onBack }) {
  const { width } = useWindowDimensions();
  const [settings, setSettings] = useState(initialSettings);
  const [isReady, setIsReady] = useState(false);

  const scale = clamp(width / 390, 0.9, 1.08);
  const isSmall = width <= 370;

  const tokens = useMemo(
    () => ({
      pad: isSmall ? 14 : 16,
      cardRadius: Math.round(16 * scale),
      iconBox: Math.round(42 * scale),
      titleSize: Math.round((32 + (isSmall ? 0 : 2)) * scale),
      rowTitle: Math.round(24 * scale),
      rowSub: Math.round(17 * scale),
      navLabel: Math.round(13 * scale)
    }),
    [isSmall, scale]
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw || !alive) {
          return;
        }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // Keep defaults when storage payload is unavailable.
      } finally {
        if (alive) {
          setIsReady(true);
        }
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, isReady]);

  const statusText = settings.cloudSync ? "Connected" : "Disconnected";
  const statusBg = settings.cloudSync ? "#2A1F4A" : "#2A203F";
  const statusBorder = settings.cloudSync ? "#5A3EA7" : "#4A3A73";
  const statusDot = settings.cloudSync ? "#A578FF" : "#8D67DB";

  const wifiLabel = settings.cloudSync ? "Home_Network_5G" : "Tap to reconnect";
  const alertLabel = settings.cloudSync ? "Pi Zero online" : "Pi Zero unreachable";
  const alertSubLabel = settings.cloudSync ? "Synced a few seconds ago" : "Last seen 4 min ago";

  function toggleCloud() {
    setSettings((prev) => ({ ...prev, cloudSync: !prev.cloudSync }));
  }

  function toggleWake() {
    setSettings((prev) => ({ ...prev, wakeWord: !prev.wakeWord }));
  }

  function cycleVolume() {
    setSettings((prev) => ({ ...prev, volume: prev.volume >= 100 ? 50 : prev.volume + 25 }));
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#090C16" />
      <LinearGradient colors={["#0B0E1D", "#0A0C18", "#080A13"]} style={styles.page}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: tokens.pad, paddingBottom: 120, maxWidth: 470, alignSelf: "center" }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable style={styles.circleIcon} onPress={onBack}>
              <Feather name="chevron-left" size={18} color="#C8D0EE" />
            </Pressable>
            <View style={styles.headerRight}>
              <View style={[styles.statusPill, { backgroundColor: statusBg, borderColor: statusBorder }]}>
                <View style={[styles.statusDot, { backgroundColor: statusDot }]} />
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
              <Pressable style={styles.circleIcon}>
                <Feather name="maximize-2" size={14} color="#9CA7D2" />
              </Pressable>
            </View>
          </View>

          <Text style={[styles.pageTitle, { fontSize: tokens.titleSize }]}>Settings</Text>

          <Text style={styles.sectionLabel}>RASPBERRY PI</Text>
          <View style={[styles.card, { borderRadius: tokens.cardRadius }]}>
            <Row
              icon={
                <View style={[styles.iconTile, styles.iconTilePurple, { width: tokens.iconBox, height: tokens.iconBox }]}>
                  <MaterialCommunityIcons name="monitor" size={18} color="#B690FF" />
                </View>
              }
              title="Pi Zero"
              subtitle="192.168.1.42"
              onPress={toggleCloud}
              right={<Feather name="chevron-right" size={16} color="#6B7498" />}
            />
            <View style={styles.separator} />
            <Row
              icon={
                <View style={[styles.iconTile, styles.iconTilePurple, { width: tokens.iconBox, height: tokens.iconBox }]}>
                  <MaterialCommunityIcons name="wifi" size={18} color="#B690FF" />
                </View>
              }
              title="Configure Wi-Fi"
              subtitle={wifiLabel}
              onPress={toggleCloud}
              right={<Feather name="chevron-right" size={16} color="#6B7498" />}
            />
          </View>

          <Text style={styles.sectionLabel}>ASSISTANT</Text>
          <View style={[styles.card, { borderRadius: tokens.cardRadius }]}>
            <Row
              icon={
                <View style={[styles.iconTile, styles.iconTilePurple, { width: tokens.iconBox, height: tokens.iconBox }]}>
                  <Feather name="volume-2" size={18} color="#B690FF" />
                </View>
              }
              title="Volume"
              subtitle={`${settings.volume}%`}
              onPress={cycleVolume}
              right={
                <View style={styles.volumeRail}>
                  <View style={[styles.volumeFill, { width: `${settings.volume}%` }]} />
                  <View style={[styles.volumeThumb, { left: `${settings.volume}%` }]} />
                </View>
              }
            />
            <View style={styles.separator} />
            <Row
              icon={
                <View style={[styles.iconTile, styles.iconTilePurple, { width: tokens.iconBox, height: tokens.iconBox }]}>
                  <Feather name="user" size={18} color="#B690FF" />
                </View>
              }
              title="Configure assistant"
              subtitle={`Wake word - ${settings.wakeWord ? "Enabled" : "Disabled"}`}
              onPress={toggleWake}
              right={<Feather name="chevron-right" size={16} color="#6B7498" />}
            />
            <View style={styles.separator} />
            <Row
              icon={
                <View style={[styles.iconTile, styles.iconTilePurple, { width: tokens.iconBox, height: tokens.iconBox }]}>
                  <Feather name="clock" size={18} color="#B690FF" />
                </View>
              }
              title="History"
              subtitle="View all commands"
              onPress={() => {}}
              right={<Feather name="chevron-right" size={16} color="#6B7498" />}
            />
          </View>

          <LinearGradient colors={["#241B3E", "#1B1731"]} style={styles.alertCard}>
            <View style={styles.alertLeft}>
              <View style={styles.alertDot} />
              <View>
                <Text style={styles.alertTitle}>{alertLabel}</Text>
                <Text style={styles.alertSubtitle}>{alertSubLabel}</Text>
              </View>
            </View>
            <Pressable style={styles.alertRefresh} onPress={toggleCloud}>
              <Feather name="rotate-cw" size={14} color="#B7A7E8" />
            </Pressable>
          </LinearGradient>
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={onBack}>
            <Feather name="home" size={20} color="#6A7193" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Home</Text>
          </Pressable>
          <Pressable style={styles.navItem}>
            <Feather name="mic" size={20} color="#6A7193" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Assistant</Text>
          </Pressable>
          <Pressable style={styles.navItem}>
            <Feather name="settings" size={20} color="#A578FF" />
            <Text style={[styles.navLabelActive, { fontSize: tokens.navLabel }]}>Settings</Text>
            <View style={styles.activeDot} />
          </Pressable>
        </View>
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
    paddingTop: 8,
    gap: 10
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  circleIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#262C43",
    backgroundColor: "rgba(22, 26, 43, 0.86)",
    alignItems: "center",
    justifyContent: "center"
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 99
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#BFA7FF"
  },
  pageTitle: {
    color: "#F0F3FF",
    fontWeight: "800",
    marginBottom: 8
  },
  sectionLabel: {
    marginTop: 6,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#7C84A6"
  },
  card: {
    borderWidth: 1,
    borderColor: "#2A314A",
    backgroundColor: "rgba(21, 25, 41, 0.86)",
    overflow: "hidden"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 0
  },
  rowTitle: {
    color: "#ECEFFF",
    fontSize: 17,
    fontWeight: "700"
  },
  rowSubtitle: {
    marginTop: 2,
    color: "#8F97B8",
    fontSize: 14
  },
  iconTile: {
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  iconTilePurple: {
    backgroundColor: "#2A2143",
    borderColor: "#43315E"
  },
  separator: {
    marginLeft: 68,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3049"
  },
  volumeRail: {
    width: 104,
    height: 4,
    borderRadius: 6,
    backgroundColor: "#373D58",
    overflow: "visible"
  },
  volumeFill: {
    height: 4,
    borderRadius: 6,
    backgroundColor: "#B084FF"
  },
  volumeThumb: {
    position: "absolute",
    top: -4,
    marginLeft: -5,
    width: 12,
    height: 12,
    borderRadius: 99,
    backgroundColor: "#F3EEFF",
    borderWidth: 1,
    borderColor: "#CBA9FF"
  },
  alertCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3D3456",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0
  },
  alertDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: "#A578FF"
  },
  alertTitle: {
    color: "#E6D7FF",
    fontSize: 16,
    fontWeight: "700"
  },
  alertSubtitle: {
    marginTop: 2,
    color: "#A895CD",
    fontSize: 13
  },
  alertRefresh: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#4A3F67",
    backgroundColor: "#2A2340"
  },
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: "#242A41",
    backgroundColor: "rgba(12, 15, 27, 0.94)",
    paddingTop: 8,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-around"
  },
  navItem: {
    alignItems: "center",
    minWidth: 84
  },
  navLabel: {
    marginTop: 4,
    color: "#6A7193",
    fontWeight: "500"
  },
  navLabelActive: {
    marginTop: 4,
    color: "#A578FF",
    fontWeight: "700"
  },
  activeDot: {
    marginTop: 4,
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#A578FF"
  }
});
