import { StyleSheet } from 'react-native';

export const ACCENT_COLOR = '#F29D4E';
export const WARM_BG = '#1A120D';
export const WARM_BG_2 = '#22160F';
export const WARM_BG_3 = '#2C1C12';
export const WARM_BORDER = '#3B2A1E';
export const WARM_BORDER_SOFT = 'rgba(242, 157, 78, 0.14)';

export default StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WARM_BG,
  },
  content: {
    width: '100%',
    paddingTop: 12,
    gap: 18,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#E8C8A2',
    fontSize: 20,
    fontWeight: '700',
  },
  pageTitle: {
    color: '#FFF0DF',
    fontWeight: '800',
    marginBottom: 0,
  },
  sectionLabel: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#B88D69',
  },
  settingsGroup: {
    gap: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_2,
  },
  settingItemPressed: {
    opacity: 0.7,
    backgroundColor: WARM_BG_3,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconTile: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: WARM_BORDER,
    backgroundColor: WARM_BG_3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileBluetoothOn: {
    borderColor: '#4D9BFF',
    backgroundColor: 'rgba(77,155,255,0.14)',
  },
  iconTileWifiOn: {
    borderColor: '#48C78E',
    backgroundColor: 'rgba(72,199,142,0.14)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotOnline: {
    backgroundColor: '#48C78E',
  },
  statusDotOffline: {
    backgroundColor: '#6E6E6E',
  },
  settingTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  settingTitle: {
    color: '#FFF0DF',
    fontWeight: '700',
  },
  settingSubtitle: {
    marginTop: 3,
    color: '#C6A98D',
  },
  serverIndicator: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  serverIndicatorOnline: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  serverIndicatorOffline: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorDotOnline: {
    backgroundColor: '#4CAF50',
  },
  indicatorDotOffline: {
    backgroundColor: '#FF6B6B',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  actionButtonWarning: {
    borderColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  actionButtonInfo: {
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    color: '#FFF0DF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionButtonSubtitle: {
    color: '#C6A98D',
    fontSize: 12,
    marginTop: 2,
  },
  navWrapper: {
    backgroundColor: WARM_BG,
  },
  bottomNav: {
    borderTopWidth: 1,
    borderTopColor: WARM_BORDER,
    backgroundColor: WARM_BG,
    paddingTop: 6,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    minWidth: 70,
    flex: 1,
    paddingVertical: 6,
  },
  navGlyph: {
    color: '#B88D69',
    fontSize: 18,
    fontWeight: '700',
  },
  navGlyphActive: {
    color: ACCENT_COLOR,
    fontSize: 18,
    fontWeight: '800',
  },
  navLabel: {
    marginTop: 3,
    color: '#B88D69',
    fontWeight: '500',
  },
  navLabelActive: {
    marginTop: 3,
    color: ACCENT_COLOR,
    fontWeight: '700',
  },
  activeDot: {
    marginTop: 4,
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: ACCENT_COLOR,
  },
});
