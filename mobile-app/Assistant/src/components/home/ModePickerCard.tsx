import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import styles from '../../styles/home/ModePickerStyles';

interface ModePickerCardProps {
  cardRadius: number;
  iconTile: number;
  isModePickerOpen: boolean;
  setIsModePickerOpen: (value: boolean) => void;
  selectedMode: string;
  setSelectedMode: (mode: string) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (value: boolean) => void;
}

const SPEAKER_MODES = ['Standard', 'Loud', 'Quiet', 'Night', 'Music', 'Private'];

const HISTORY_ITEMS = [
  { text: 'Play lo-fi music', time: 'Today, 09:14' },
  { text: 'Set volume to 60%', time: 'Today, 08:57' },
  { text: 'Enable night mode', time: 'Yesterday, 23:10' },
  { text: 'What is the weather?', time: 'Yesterday, 19:42' },
];


export default function ModePickerCard({
  cardRadius,
  iconTile,
  isModePickerOpen,
  setIsModePickerOpen,
  selectedMode,
  setSelectedMode,
  isHistoryOpen,
  setIsHistoryOpen,
}: ModePickerCardProps) {
  const historyReveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(historyReveal, {
      toValue: isHistoryOpen ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [historyReveal, isHistoryOpen]);

  return (
    <>
      <Text style={{ marginTop: 2, marginBottom: -4, fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: '#7C84A6' }}>
        ASSISTANT
      </Text>
      <View style={[styles.card, { borderRadius: cardRadius }]}>
        <Pressable style={styles.row} onPress={() => setIsModePickerOpen(!isModePickerOpen)}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconTile, { width: iconTile, height: iconTile }]}>
              <Text style={styles.iconGlyph}>≡</Text>
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Select Mod</Text>
              <Text style={styles.rowSubtitle}>{selectedMode}</Text>
            </View>
          </View>
          <Text style={styles.chevron}>{isModePickerOpen ? '⌃' : '⌄'}</Text>
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

        <Pressable style={styles.row} onPress={() => setIsHistoryOpen(!isHistoryOpen)}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconTile, { width: iconTile, height: iconTile }]}>
              <Text style={styles.iconGlyph}>◷</Text>
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>History</Text>
              <Text style={styles.rowSubtitle}>12 commands today</Text>
            </View>
          </View>
          <Text style={styles.chevron}>{isHistoryOpen ? '⌃' : '⌄'}</Text>
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
                      outputRange: [-4, 0],
                    }),
                  },
                  {
                    scale: historyReveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1],
                    }),
                  },
                ],
              },
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
                  <Text style={styles.historyArrow}>›</Text>
                </View>
                {index < HISTORY_ITEMS.length - 1 ? <View style={styles.historyDivider} /> : null}
              </View>
            ))}
          </Animated.View>
        ) : null}
      </View>
    </>
  );
}
