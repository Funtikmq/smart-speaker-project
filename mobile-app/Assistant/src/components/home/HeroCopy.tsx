import React from 'react';
import { Text, View } from 'react-native';
import styles from '../../styles/home/HeroCopyStyles';

interface HeroCopyProps {
  isSpeaking: boolean;
  isResponding: boolean;
  titleSize: number;
  metaSize: number;
  topGap: number;
}


export default function HeroCopy({
  isSpeaking,
  isResponding,
  titleSize,
  metaSize,
  topGap,
}: HeroCopyProps) {

  return (
    <View style={[styles.heroCopyWrap, { marginTop: topGap }]}>
      <Text style={[styles.infoTitle, { fontSize: titleSize }]}>How can I help you today?</Text>
      <Text style={[styles.infoMeta, { fontSize: metaSize, lineHeight: Math.round(metaSize * 1.45) }]}>
        {isSpeaking
          ? 'Voice is active and animating.'
          : isResponding
            ? 'Generating a response.'
            : 'Your personal voice assistant is ready to assist you.'}
      </Text>
    </View>
  );
}
