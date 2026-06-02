export const CURRENCY = '₹';

export const typography = {
  h1: { fontSize: 32, fontWeight: '800', color: '#0B1A2B', letterSpacing: -0.8 },
  h2: { fontSize: 26, fontWeight: '700', color: '#0B1A2B', letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '700', color: '#0B1A2B', letterSpacing: -0.3 },
  h4: { fontSize: 17, fontWeight: '600', color: '#0B1A2B' },
  body: { fontSize: 15, fontWeight: '500', color: '#0B1A2B' },
  bodySmall: { fontSize: 13, fontWeight: '500', color: '#4A5B72' },
  caption: { fontSize: 12, fontWeight: '600', color: '#8896AB' },
  label: { fontSize: 11, fontWeight: '700', color: '#8896AB', textTransform: 'uppercase', letterSpacing: 0.8 },
};

export const colors = {
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  primaryGradient: ['#0D9488', '#14B8A6'],

  accent: '#F43F5E',
  accentLight: '#FB7185',
  accentBg: '#FFF1F2',

  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFBFC',

  text: '#0B1A2B',
  textSecondary: '#4A5B72',
  textMuted: '#8896AB',
  textOnPrimary: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  error: '#EF4444',
  errorLight: '#FEF2F2',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  statusScheduled: '#6B7B8D',
  statusScheduledBg: '#F1F5F9',
  statusConfirmed: '#0D9488',
  statusConfirmedBg: '#EDFCF7',
  statusInProgress: '#F59E0B',
  statusInProgressBg: '#FFFBEB',
  statusCompleted: '#10B981',
  statusCompletedBg: '#ECFDF5',
  statusCancelled: '#EF4444',
  statusCancelledBg: '#FEF2F2',
  statusNoShow: '#6B7B8D',
  statusNoShowBg: '#F1F5F9',

  tabInactive: '#8896AB',
  male: '#0D9488',
  female: '#F43F5E',
  other: '#6B7B8D',
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#0B1A2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#0B1A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0B1A2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: '#0B1A2B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
};

export const getStatusStyle = (status) => {
  switch (status) {
    case 'SCHEDULED': return { bg: colors.statusScheduledBg, text: colors.statusScheduled };
    case 'CONFIRMED': return { bg: colors.statusConfirmedBg, text: colors.statusConfirmed };
    case 'IN_PROGRESS': return { bg: colors.statusInProgressBg, text: colors.statusInProgress };
    case 'COMPLETED': return { bg: colors.statusCompletedBg, text: colors.statusCompleted };
    case 'CANCELLED': return { bg: colors.statusCancelledBg, text: colors.statusCancelled };
    case 'NO_SHOW': return { bg: colors.statusNoShowBg, text: colors.statusNoShow };
    default: return { bg: colors.statusScheduledBg, text: colors.statusScheduled };
  }
};

export const getGenderStyle = (gender) => {
  const g = (gender || '').toLowerCase().trim();
  if (g.startsWith('m')) return { bg: '#EDFCF7', text: colors.male };
  if (g.startsWith('f')) return { bg: '#FFF1F2', text: colors.female };
  return { bg: '#F1F5F9', text: colors.other };
};
