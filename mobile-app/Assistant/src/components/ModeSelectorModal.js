import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MODES = ["Standard", "Loud", "Quiet", "Night", "Music", "Private"];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function ModeSelectorModal({ visible, selectedMode, onClose, onSelect }) {
  const { width } = useWindowDimensions();
  const scale = clamp(width / 390, 0.9, 1.08);

  const tokens = useMemo(
    () => ({
      titleSize: Math.round(20 * scale),
      bodySize: Math.round(14 * scale),
      modeSize: Math.round(16 * scale),
      tilePadV: Math.round(14 * scale),
      tilePadH: Math.round(12 * scale)
    }),
    [scale]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={[styles.title, { fontSize: tokens.titleSize }]}>Speaker Mode</Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            <Text style={[styles.subtitle, { fontSize: tokens.bodySize }]}>Choose how your smart speaker should respond.</Text>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
            >
              {MODES.map((mode) => {
                const isActive = selectedMode === mode;
                return (
                  <Pressable
                    key={mode}
                    style={[
                      styles.modeTile,
                      {
                        paddingVertical: tokens.tilePadV,
                        paddingHorizontal: tokens.tilePadH
                      },
                      isActive && styles.modeTileActive
                    ]}
                    onPress={() => {
                      onSelect(mode);
                      onClose();
                    }}
                  >
                    <Text style={[styles.modeText, { fontSize: tokens.modeSize }, isActive && styles.modeTextActive]}>
                      {mode}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(3, 5, 10, 0.52)"
  },
  backdrop: {
    flex: 1
  },
  sheetSafeArea: {
    width: "100%"
  },
  sheet: {
    width: "100%",
    maxHeight: "74%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#2F3551",
    backgroundColor: "#0F1322",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 10
  },
  handle: {
    alignSelf: "center",
    width: "16%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#596087",
    opacity: 0.8
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    color: "#EEF1FF",
    fontWeight: "800"
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#394062",
    backgroundColor: "#1C233A",
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  closeText: {
    color: "#B4C0EA",
    fontSize: 12,
    fontWeight: "700"
  },
  subtitle: {
    color: "#909ABF"
  },
  scroll: {
    width: "100%"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 8
  },
  modeTile: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#343C5A",
    backgroundColor: "#161D31",
    alignItems: "center",
    justifyContent: "center"
  },
  modeTileActive: {
    borderColor: "#A578FF",
    backgroundColor: "#2B2148"
  },
  modeText: {
    color: "#DCE4FF",
    fontWeight: "700"
  },
  modeTextActive: {
    color: "#CBAFFF"
  }
});
