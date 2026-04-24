import React, { useEffect, useRef } from "react";
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function HomeScreen({ onOpenSettings }) {
  const { width } = useWindowDimensions();
  const scale = clamp(width / 390, 0.9, 1.08);
  const titleSize = Math.round(31 * scale);
  const orbSize = Math.round(186 * scale);
  const orbOuterSize = Math.round(232 * scale);

  const pulse = useRef(new Animated.Value(0)).current;
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
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
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
    waves.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 120);
    });

    return () => {
      pulseLoop.stop();
      waves.forEach((animation) => animation.stop());
    };
  }, [pulse, wave1, wave2, wave3, wave4, wave5]);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.045]
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1]
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08]
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.46]
  });

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
            </View>
          </View>

          <View style={[styles.glowWrap, { width: orbOuterSize + 42, height: orbOuterSize + 42, borderRadius: (orbOuterSize + 42) / 2 }]}>
            <Animated.View
              style={[
                styles.glowOrb,
                {
                  width: orbOuterSize + 42,
                  height: orbOuterSize + 42,
                  borderRadius: (orbOuterSize + 42) / 2,
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
                width: orbOuterSize,
                height: orbOuterSize,
                borderRadius: orbOuterSize / 2,
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity
              }
            ]}
          >
            <LinearGradient
              colors={["#AB74FF", "#7E4DFA", "#6C42E0"]}
              style={[styles.orbRing, { width: orbSize, height: orbSize, borderRadius: orbSize / 2 }]}
            >
              <View style={styles.orbInner}>
                <View style={styles.waveWrap}>
                  <Animated.View style={[styles.waveBar, { height: 12, transform: [{ scaleY: wave1 }] }]} />
                  <Animated.View style={[styles.waveBar, { height: 19, transform: [{ scaleY: wave2 }] }]} />
                  <Animated.View style={[styles.waveBar, { height: 30, transform: [{ scaleY: wave3 }] }]} />
                  <Animated.View style={[styles.waveBar, { height: 21, transform: [{ scaleY: wave4 }] }]} />
                  <Animated.View style={[styles.waveBar, { height: 14, transform: [{ scaleY: wave5 }] }]} />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.heroCopyWrap}>
            <Text style={styles.infoTitle}>How can I help you today?</Text>
            <Text style={styles.infoMeta}>Your personal voice assistant is ready to assist you.</Text>
          </View>

          <View style={styles.lateContentWrap}>
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
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem}>
            <Feather name="home" size={20} color="#A578FF" />
            <Text style={styles.navLabelActive}>Home</Text>
            <View style={styles.navDot} />
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
    paddingTop: 8,
    paddingBottom: 32
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
    fontSize: 13
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
  orbOuter: {
    marginTop: 18,
    marginBottom: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#2C2A4A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22, 19, 43, 0.3)"
  },
  glowWrap: {
    position: "absolute",
    top: 78,
    alignSelf: "center"
  },
  glowOrb: {
    position: "absolute",
    backgroundColor: "rgba(167, 117, 255, 0.12)",
    shadowColor: "#B38CFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 12
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
  infoTitle: {
    color: "#E7E9F7",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center"
  },
  infoMeta: {
    marginTop: 4,
    color: "#9AA3C2",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center"
  },
  quickTitle: {
    marginTop: 18,
    marginBottom: 10,
    color: "#F1F3FF",
    fontSize: 19,
    fontWeight: "800"
  },
  actionCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2A314A",
    backgroundColor: "rgba(21, 25, 41, 0.9)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
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
    fontSize: 16,
    fontWeight: "700"
  },
  actionSubtitle: {
    marginTop: 1,
    color: "#8F97B8",
    fontSize: 12
  },
  bottomSpacer: {
    height: 210
  },
  heroCopyWrap: {
    marginTop: 2,
    marginBottom: 14,
    alignItems: "center"
  },
  lateContentWrap: {
    marginTop: 54
  },
  bottomNav: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2A3149",
    backgroundColor: "rgba(14, 17, 29, 0.96)",
    paddingVertical: 12,
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
    fontSize: 11,
    fontWeight: "500"
  },
  navLabelActive: {
    marginTop: 3,
    color: "#A578FF",
    fontSize: 11,
    fontWeight: "700"
  },
  navDot: {
    marginTop: 4,
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#A578FF"
  }
});
