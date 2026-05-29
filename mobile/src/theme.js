// ClinicFlow — Healthcare-inspired premium design system

export const CURRENCY = '₹';

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '700', color: '#0F172A', letterSpacing: -0.2 },
  h4: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  body: { fontSize: 15, fontWeight: '500', color: '#0F172A' },
  bodySmall: { fontSize: 13, fontWeight: '500', color: '#475569' },
  caption: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  label: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 },
};

export const colors = {
  primary: '#0D5E6E',
  primaryLight: '#1A8A9E',
  primaryDark: '#093F4B',
  primaryGradient: ['#0D5E6E', '#1A8A9E'],

  accent: '#E8634A',
  accentLight: '#FF7B62',
  accentBg: '#FFF0ED',

  bg: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAF9',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  error: '#DC2626',
  errorLight: '#FEF2F2',
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  info: '#0284C7',
  infoLight: '#F0F9FF',

  statusScheduled: '#64748B',
  statusScheduledBg: '#F1F5F9',
  statusConfirmed: '#0D5E6E',
  statusConfirmedBg: '#EDF7FA',
  statusInProgress: '#D97706',
  statusInProgressBg: '#FFFBEB',
  statusCompleted: '#059669',
  statusCompletedBg: '#ECFDF5',
  statusCancelled: '#DC2626',
  statusCancelledBg: '#FEF2F2',
  statusNoShow: '#64748B',
  statusNoShowBg: '#F1F5F9',

  tabInactive: '#94A3B8',
  male: '#0D5E6E',
  female: '#E8634A',
  other: '#64748B',
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
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
  if (g.startsWith('m')) return { bg: '#EDF7FA', text: colors.male };
  if (g.startsWith('f')) return { bg: '#FFF0ED', text: colors.female };
  return { bg: '#F1F5F9', text: colors.other };
};
