import { StyleSheet } from 'react-native';

// Color constants used by OrbAnimation styles
const ACCENT_COLOR = '#F29D4E';
const ACCENT_COLOR_SOFT = 'rgba(242, 157, 78, 0.12)';
const WARM_BORDER = '#3B2A1E';

export default StyleSheet.create({
  ringsField: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.22)',
  },
  travelWave: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.28)',
  },
  orbOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.34)',
    backgroundColor: 'rgba(242, 157, 78, 0.12)',
  },
  glowOrb: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowPulse: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: ACCENT_COLOR_SOFT,
    shadowColor: '#F6B873',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 34,
    elevation: 16,
  },
  orbRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F29D4E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
  orbInner: {
    width: '86%',
    height: '86%',
    borderRadius: 999,
    backgroundColor: '#0D1122',
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  waveBar: {
    width: 4,
    borderRadius: 99,
    backgroundColor: ACCENT_COLOR,
  },
  responseGlyphWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseGlyph: {
    color: '#7FD3FF',
    fontSize: 26,
    fontWeight: '900',
  },
  idleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT_COLOR,
  },
});
