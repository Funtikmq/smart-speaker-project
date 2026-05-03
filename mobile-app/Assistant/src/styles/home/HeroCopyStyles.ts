import { StyleSheet } from 'react-native';

// Color constants used by HeroCopy styles
const WARM_ACCENT = '#C6A98D';

export default StyleSheet.create({
  heroCopyWrap: {
    alignSelf: 'center',
    maxWidth: 300,
    alignItems: 'center',
  },
  infoTitle: {
    color: '#FFF0DF',
    fontWeight: '700',
    textAlign: 'center',
  },
  infoMeta: {
    marginTop: 6,
    color: WARM_ACCENT,
    textAlign: 'center',
  },
});
