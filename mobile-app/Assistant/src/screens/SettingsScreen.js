import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

const initialSettings = {
  wakeWord: true,
  cloudSync: false,
  notifications: false,
  autoPlayResponses: true,
  volume: 75,
  language: "English"
};

const SETTINGS_STORAGE_KEY = "assistant_settings_v1";

function SettingItem({ icon, title, subtitle, onPress }) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <View style={styles.settingLeftSide}>
        <View style={styles.iconWrap}>{icon}</View>
        <View style={styles.settingTextWrap}>
          <Text style={styles.settingLabel}>{title}</Text>
          <Text style={styles.settingDescription}>{subtitle}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={18} color="#6B7382" />
    </Pressable>
  );
}

export default function SettingsScreen({ onBack }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const rawValue = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!rawValue || !isMounted) {
          return;
        }

        const parsed = JSON.parse(rawValue);
        if (parsed && typeof parsed === "object") {
          setSettings((current) => ({ ...current, ...parsed }));
        }
      } catch {
        // Keep defaults if persisted payload is missing or invalid.
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings)).catch(() => {
      // Fail silently for now; toggles still work in-memory.
    });
  }, [settings, isReady]);

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function cycleVolume() {
    const next = settings.volume >= 100 ? 50 : settings.volume + 25;
    updateSetting("volume", next);
  }

  function toggleAssistantConfig() {
    updateSetting("wakeWord", !settings.wakeWord);
  }

  function toggleConnection() {
    updateSetting("cloudSync", !settings.cloudSync);
  }

  const statusLabel = settings.cloudSync ? "Connected" : "Disconnected";
  const statusStyle = settings.cloudSync ? styles.statusPillOnline : styles.statusPillOffline;
  const statusDotStyle = settings.cloudSync ? styles.statusDotOnline : styles.statusDotOffline;
  const deviceSubtitle = settings.cloudSync ? "192.168.1.42" : "Unavailable on network";
  const wifiSubtitle = settings.cloudSync ? "Home_Network_5G" : "Tap to reconnect";
  const assistantSubtitle = `${settings.wakeWord ? "Wake word on" : "Wake word off"} - ${settings.language}`;
  const alertText = settings.cloudSync
    ? "Pi Zero is online and synced"
    : "Pi Zero unreachable - last seen 4 min ago";

  return (
    <SafeAreaView style={styles.pageRoot}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1015" />
      <LinearGradient
        colors={["#161A22", "#11141B", "#0D1015"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.page}
      >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Feather name="arrow-left" size={18} color="#E8ECF5" />
          </Pressable>
          <View style={[styles.statusPill, statusStyle]}>
            <View style={[styles.statusDot, statusDotStyle]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.heading}>Settings</Text>

        <Text style={styles.sectionLabel}>RASPBERRY PI</Text>
        <View style={styles.panelCard}>
          <SettingItem
            icon={<MaterialCommunityIcons name="monitor" size={20} color="#DDE4F2" />}
            title="Pi Zero"
            subtitle={deviceSubtitle}
            onPress={toggleConnection}
          />
          <View style={styles.separator} />
          <SettingItem
            icon={<MaterialCommunityIcons name="wifi" size={20} color="#DDE4F2" />}
            title="Configure Wi-Fi"
            subtitle={wifiSubtitle}
            onPress={toggleConnection}
          />
        </View>

        <Text style={styles.sectionLabel}>ASSISTANT</Text>
        <View style={styles.panelCard}>
          {!isReady ? <Text style={styles.syncText}>Loading saved settings...</Text> : null}
          <SettingItem
            icon={<Feather name="volume-2" size={20} color="#DDE4F2" />}
            title="Volume"
            subtitle={`${settings.volume}%`}
            onPress={cycleVolume}
          />
          <View style={styles.separator} />
          <SettingItem
            icon={<Feather name="user" size={20} color="#DDE4F2" />}
            title="Configure assistant"
            subtitle={assistantSubtitle}
            onPress={toggleAssistantConfig}
          />
          <View style={styles.separator} />
          <SettingItem
            icon={<Feather name="clock" size={20} color="#DDE4F2" />}
            title="History"
            subtitle="View all commands"
            onPress={() => {}}
          />
        </View>

        <View style={styles.alertCard}>
          <View style={[styles.alertDot, statusDotStyle]} />
          <Text style={styles.alertText}>{alertText}</Text>
        </View>
      </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: "#0D1015"
  },
  page: {
    flex: 1,
    backgroundColor: "#0D1015"
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12
  },
  topBar: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#293140",
    backgroundColor: "#161C27"
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  statusPillOnline: {
    borderColor: "#235C44",
    backgroundColor: "#122D22"
  },
  statusPillOffline: {
    borderColor: "#5B2626",
    backgroundColor: "#2A1619"
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 99
  },
  statusDotOnline: {
    backgroundColor: "#58D68D"
  },
  statusDotOffline: {
    backgroundColor: "#FF7C7C"
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F2F5FB"
  },
  heading: {
    marginTop: 14,
    marginBottom: 4,
    fontSize: 38,
    fontWeight: "800",
    color: "#F2F5FB"
  },
  sectionLabel: {
    marginTop: 10,
    marginBottom: 2,
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: "700",
    color: "#757F90"
  },
  panelCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#242C39",
    backgroundColor: "#161C27",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  syncText: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
    fontSize: 12,
    color: "#8D98AA"
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 12
  },
  settingLeftSide: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  iconWrap: {
    width: 28,
    alignItems: "center"
  },
  settingTextWrap: {
    flex: 1
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F3F6FC"
  },
  settingDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    color: "#9CA6B8"
  },
  separator: {
    marginLeft: 42,
    borderBottomWidth: 1,
    borderBottomColor: "#242E3C"
  },
  alertCard: {
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3B4250",
    backgroundColor: "#171D28",
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 99
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#D9E0ED"
  }
});
