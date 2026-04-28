import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const SPEAKER_MODES = ["Standard", "Loud", "Quiet", "Night", "Music", "Private"];

const HISTORY_ITEMS = [
  { text: "Play lo-fi music", time: "Today, 09:14" },
  { text: "Set volume to 60%", time: "Today, 08:57" },
  { text: "Enable night mode", time: "Yesterday, 23:10" },
  { text: "What is the weather?", time: "Yesterday, 19:42" }
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function HomeScreen({ onOpenSettings }) {
  const { width } = useWindowDimensions();
  const scale = clamp(width / 390, 0.9, 1.08);
  const isSmall = width <= 370;

  const tokens = useMemo(
    () => ({
      pad: isSmall ? 14 : 16,
      navLabel: Math.round(13 * scale),
      titleSize: Math.round(30 * scale),
      metaSize: Math.round(18 * scale),
      iconTile: Math.round(40 * scale),
      cardRadius: Math.round(15 * scale),
      pageTitle: Math.round((32 + (isSmall ? 0 : 2)) * scale),
      topGap: isSmall ? 8 : 10,
      sectionGap: isSmall ? 14 : 18
    }),
    [isSmall, scale]
  );

  const coreSize = Math.round(166 * scale);
  const ringFieldSize = Math.round(298 * scale);
  const [isModePickerOpen, setIsModePickerOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState("Standard");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    const outerWaveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(outerWave, {
          toValue: 1,
          duration: 2800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.timing(outerWave, {
          toValue: 0,
          duration: 250,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ])
    );

    const innerGlowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(innerGlow, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(innerGlow, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    );

    const waves = [wave1, wave2, wave3, wave4, wave5].map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 700 + index * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(value, {
            toValue: 0.35 + index * 0.12,
            duration: 700 + index * 120,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      )
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
      useNativeDriver: true
    }).start();
  }, [historyReveal, isHistoryOpen]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03]
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1]
  });

  const glowScale = innerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08]
  });

  const glowOpacity = innerGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0.52]
  });

  const waveScale = outerWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0.86, 1.36]
  });

  const waveOpacity = outerWave.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.3, 0.12, 0]
  });

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#090C16" />
      <LinearGradient colors={["#0B0E1D", "#0A0C18", "#080A13"]} style={styles.page}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: tokens.pad,
              paddingBottom: 120,
              maxWidth: 470,
              alignSelf: "center",
              gap: tokens.sectionGap
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable style={styles.circleIcon}>
              <Feather name="home" size={16} color="#C8D0EE" />
            </Pressable>
            <View style={styles.headerRight}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
              <Pressable style={styles.circleIcon} onPress={onOpenSettings}>
                <Feather name="settings" size={14} color="#9CA7D2" />
              </Pressable>
            </View>
          </View>

          <Text style={[styles.pageTitle, { fontSize: tokens.pageTitle }]}>Home</Text>

          <View
            style={[
              styles.ringsField,
              {
                width: ringFieldSize,
                height: ringFieldSize
              }
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
                  opacity: waveOpacity
                }
              ]}
            />

            <View
              style={[
                styles.staticRing,
                {
                  width: ringFieldSize * 0.92,
                  height: ringFieldSize * 0.92,
                  borderRadius: (ringFieldSize * 0.92) / 2
                }
              ]}
            />
            <View
              style={[
                styles.staticRing,
                {
                  width: ringFieldSize * 0.78,
                  height: ringFieldSize * 0.78,
                  borderRadius: (ringFieldSize * 0.78) / 2
                }
              ]}
            />
            <View
              style={[
                styles.staticRing,
                {
                  width: ringFieldSize * 0.64,
                  height: ringFieldSize * 0.64,
                  borderRadius: (ringFieldSize * 0.64) / 2
                }
              ]}
            />

            <View
              style={[
                styles.glowOrb,
                {
                  width: coreSize + 70,
                  height: coreSize + 70,
                  borderRadius: (coreSize + 70) / 2
                }
              ]}
            >
              <Animated.View
                style={[
                  styles.glowPulse,
                  {
                    transform: [{ scale: glowScale }],
                    opacity: glowOpacity
                  }
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
                  opacity: pulseOpacity
                }
              ]}
            >
              <LinearGradient
                colors={["#B585FF", "#8354FF", "#7046EA"]}
                style={[styles.orbRing, { width: coreSize, height: coreSize, borderRadius: coreSize / 2 }]}
              >
                <View style={styles.orbInner}>
                  <View style={styles.waveWrap}>
                    <Animated.View style={[styles.waveBar, { height: 12, transform: [{ scaleY: wave1 }] }]} />
                    <Animated.View style={[styles.waveBar, { height: 18, transform: [{ scaleY: wave2 }] }]} />
                    <Animated.View style={[styles.waveBar, { height: 30, transform: [{ scaleY: wave3 }] }]} />
                    <Animated.View style={[styles.waveBar, { height: 20, transform: [{ scaleY: wave4 }] }]} />
                    <Animated.View style={[styles.waveBar, { height: 13, transform: [{ scaleY: wave5 }] }]} />
                  </View>
                </View>
              </LinearGradient>
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
                  <Feather name="sliders" size={18} color="#B690FF" />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowTitle}>Select Mod</Text>
                  <Text style={styles.rowSubtitle}>{selectedMode}</Text>
                </View>
              </View>
              <Feather name={isModePickerOpen ? "chevron-up" : "chevron-down"} size={16} color="#697193" />
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
                  <Feather name="clock" size={18} color="#B690FF" />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowTitle}>History</Text>
                  <Text style={styles.rowSubtitle}>12 commands today</Text>
                </View>
              </View>
              <Feather name={isHistoryOpen ? "chevron-up" : "chevron-down"} size={16} color="#697193" />
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
                          outputRange: [-4, 0]
                        })
                      },
                      {
                        scale: historyReveal.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.98, 1]
                        })
                      }
                    ]
                  }
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
                      <Feather name="chevron-right" size={14} color="#7280A6" />
                    </View>
                    {index < HISTORY_ITEMS.length - 1 ? <View style={styles.historyDivider} /> : null}
                  </View>
                ))}
                </Animated.View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem}>
            <Feather name="home" size={20} color="#A578FF" />
            <Text style={[styles.navLabelActive, { fontSize: tokens.navLabel }]}>Home</Text>
            <View style={styles.activeDot} />
          </Pressable>
          <Pressable style={styles.navItem}>
            <Feather name="mic" size={20} color="#646D8D" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Assistant</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={onOpenSettings}>
            <Feather name="settings" size={20} color="#646D8D" />
            <Text style={[styles.navLabel, { fontSize: tokens.navLabel }]}>Settings</Text>
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
    gap: 18
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
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
    borderColor: "#5A3EA7",
    backgroundColor: "#2A1F4A",
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: "#A578FF"
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#BFA7FF"
  },
  pageTitle: {
    color: "#F0F3FF",
    fontWeight: "800",
    marginBottom: 2
  },
  ringsField: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center"
  },
  staticRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(145, 122, 236, 0.22)"
  },
  travelWave: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(164, 132, 255, 0.34)"
  },
  orbOuter: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(114, 87, 197, 0.8)",
    backgroundColor: "rgba(26, 20, 51, 0.33)"
  },
  glowOrb: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  glowPulse: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(168, 122, 255, 0.12)",
    shadowColor: "#B38CFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 34,
    elevation: 16
  },
  orbRing: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A674FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12
  },
  orbInner: {
    width: "86%",
    height: "86%",
    borderRadius: 999,
    backgroundColor: "#0D1122",
    borderWidth: 1,
    borderColor: "#473279",
    alignItems: "center",
    justifyContent: "center"
  },
  waveWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  waveBar: {
    width: 4,
    borderRadius: 99,
    backgroundColor: "#A882FF"
  },
  heroCopyWrap: {
    alignSelf: "center",
    maxWidth: 300,
    alignItems: "center"
  },
  sectionLabel: {
    marginTop: 2,
    marginBottom: -4,
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
    borderColor: "#43315E",
    backgroundColor: "#2A2143",
    alignItems: "center",
    justifyContent: "center"
  },
  separator: {
    marginLeft: 68,
    borderBottomWidth: 1,
    borderBottomColor: "#2A3049"
  },
  modeGridWrap: {
    marginTop: -2,
    marginBottom: 10,
    marginHorizontal: 14,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2E3450",
    backgroundColor: "rgba(17, 22, 37, 0.7)",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8
  },
  modeChip: {
    width: "48%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#343C5A",
    backgroundColor: "#161D31",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  modeChipActive: {
    borderColor: "#A578FF",
    backgroundColor: "#2B2148"
  },
  modeChipText: {
    color: "#DCE4FF",
    fontSize: 14,
    fontWeight: "700"
  },
  modeChipTextActive: {
    color: "#CBAFFF"
  },
  historyWrap: {
    marginHorizontal: 14,
    marginTop: -2,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#424D74",
    backgroundColor: "rgba(17, 22, 38, 0.94)",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 2,
    paddingHorizontal: 2
  },
  historyHeaderTitle: {
    color: "#F4F6FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1
  },
  historyHeaderMeta: {
    color: "#B7BFD8",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  historyMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(145, 160, 205, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(145, 160, 205, 0.16)"
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(59, 68, 102, 0.85)",
    backgroundColor: "rgba(23, 28, 46, 0.86)"
  },
  historyDivider: {
    height: 1,
    marginLeft: 40,
    marginTop: 1,
    marginBottom: 1,
    backgroundColor: "rgba(82, 92, 130, 0.26)"
  },
  historyLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0
  },
  historyDotWrap: {
    width: 20,
    height: 20,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(165, 120, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(165, 120, 255, 0.28)"
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: "#A578FF"
  },
  historyTextWrap: {
    flex: 1,
    minWidth: 0
  },
  historyCommand: {
    color: "#F4F6FF",
    fontSize: 14,
    fontWeight: "700"
  },
  historyTime: {
    marginTop: 2,
    color: "#A1A9C7",
    fontSize: 11
  },
  infoTitle: {
    color: "#EDF0FF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center"
  },
  infoMeta: {
    marginTop: 6,
    color: "#B8BFD9",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center"
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
