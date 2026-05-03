import { StyleSheet } from 'react-native';

// Color constants used by ModePickerCard styles
const ACCENT_COLOR = '#F29D4E';
const ACCENT_COLOR_SOFT = 'rgba(242, 157, 78, 0.12)';
const ACCENT_COLOR_SOFT_2 = 'rgba(242, 157, 78, 0.16)';
const ACCENT_COLOR_SOFT_5 = 'rgba(242, 157, 78, 0.22)';
const WARM_BG_2 = '#22160F';
const WARM_BG_3 = '#2C1C12';
const WARM_BORDER = '#3B2A1E';
const WARM_BORDER_SOFT = 'rgba(242, 157, 78, 0.14)';

export default StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: '#FFF0DF',
    fontSize: 15,
    fontWeight: '700',
  },
  rowSubtitle: {
    marginTop: 3,
    color: '#C6A98D',
    fontSize: 12,
  },
  iconTile: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.28)',
    backgroundColor: 'rgba(242, 157, 78, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    color: '#F6C089',
    fontSize: 16,
    fontWeight: '800',
  },
  separator: {
    marginLeft: 68,
    borderBottomWidth: 1,
    borderBottomColor: WARM_BORDER,
  },
  chevron: {
    color: '#B88D69',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
  },
  modeGridWrap: {
    marginTop: -2,
    marginBottom: 8,
    marginHorizontal: 12,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.2)',
    backgroundColor: WARM_BG_3,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  modeChip: {
    width: '48%',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.18)',
    backgroundColor: WARM_BG_2,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipActive: {
    borderColor: ACCENT_COLOR,
    backgroundColor: 'rgba(242, 157, 78, 0.18)',
  },
  modeChipText: {
    color: '#DCE4FF',
    fontSize: 13,
    fontWeight: '700',
  },
  modeChipTextActive: {
    color: '#F8D1A6',
  },
  historyWrap: {
    marginHorizontal: 12,
    marginTop: -2,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.22)',
    backgroundColor: WARM_BG_2,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 2,
    paddingHorizontal: 2,
  },
  historyHeaderTitle: {
    color: '#FFF0DF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  historyHeaderMeta: {
    color: '#C6A98D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  historyMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: ACCENT_COLOR_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.16)',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(242, 157, 78, 0.16)',
    backgroundColor: WARM_BG_3,
  },
  historyDivider: {
    height: 1,
    marginLeft: 40,
    marginTop: 1,
    marginBottom: 1,
    backgroundColor: WARM_BORDER_SOFT,
  },
  historyLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  historyDotWrap: {
    width: 20,
    height: 20,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT_COLOR_SOFT_2,
    borderWidth: 1,
    borderColor: ACCENT_COLOR_SOFT_5,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: ACCENT_COLOR,
  },
  historyTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  historyCommand: {
    color: '#FFF0DF',
    fontSize: 13,
    fontWeight: '700',
  },
  historyTime: {
    marginTop: 2,
    color: '#C6A98D',
    fontSize: 10,
  },
  historyArrow: {
    color: '#B88D69',
    fontSize: 18,
    fontWeight: '700',
  },
});
