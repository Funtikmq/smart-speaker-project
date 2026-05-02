import React from 'react';
import { Text, View } from 'react-native';
import styles from '../../styles/settings/SettingsScreenStyles';

type Props = {
  message: string | null;
};

export default function SettingsFeedbackBanner({ message }: Props) {
  if (!message) return null;

  return (
    <View style={styles.feedbackBanner}>
      <Text style={styles.feedbackText}>{message}</Text>
    </View>
  );
}
