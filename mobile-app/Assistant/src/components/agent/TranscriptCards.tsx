import React from 'react';
import { Text, View } from 'react-native';
import styles from '../../styles/agent/AgentScreenStyles';

type Props = {
  partialText: string;
  transcript: string;
  response: string;
  error: string | null;
  cardRadius: number;
};

export default function TranscriptCards({ partialText, transcript, response, error, cardRadius }: Props) {
  return (
    <>
      {partialText.length > 0 ? (<><Text style={styles.sectionLabel}>LIVE TRANSCRIPT</Text><View style={[styles.card, { borderRadius: cardRadius }]}><Text style={styles.liveText}>{partialText}</Text></View></>) : null}
      {transcript.length > 0 ? (<><Text style={styles.sectionLabel}>YOU SAID</Text><View style={[styles.card, styles.transcriptCard, { borderRadius: cardRadius }]}><Text style={styles.mainText}>{transcript}</Text></View></>) : null}
      {response.length > 0 ? (<><Text style={styles.sectionLabel}>ASSISTANT</Text><View style={[styles.card, styles.responseCard, { borderRadius: cardRadius }]}><Text style={styles.mainText}>{response}</Text></View></>) : null}
      {error ? (<><Text style={styles.sectionLabel}>ERROR</Text><View style={[styles.card, styles.errorCard, { borderRadius: cardRadius }]}><Text style={styles.errorText}>{error}</Text></View></>) : null}
    </>
  );
}
