import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function QuickActionCard({ title, subtitle, accent, onPress }) {
  return (
    <Pressable style={[styles.card, { borderColor: accent }]} onPress={onPress}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: "#FFFFFF"
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 99,
    marginBottom: 12
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1C20"
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#5D6572",
    lineHeight: 18
  }
});
