// ClinicFlow — Unique warm-emerald design system

export const colors = {
  primary: '#0F766E',
  primaryLight: '#14B8A6',
  primaryDark: '#0D5E57',
  secondary: '#D97706',
  secondaryLight: '#F59E0B',

  bg: '#F5F2EE',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAF9',

  text: '#1C1917',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',

  border: '#E7E5E4',
  borderLight: '#F0EDEA',

  error: '#DC2626',
  errorLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  info: '#0284C7',
  infoLight: '#F0F9FF',

  statusScheduled: '#78716C',
  statusScheduledBg: '#F5F5F4',
  statusConfirmed: '#0284C7',
  statusConfirmedBg: '#F0F9FF',
  statusInProgress: '#D97706',
  statusInProgressBg: '#FFFBEB',
  statusCompleted: '#16A34A',
  statusCompletedBg: '#F0FDF4',
  statusCancelled: '#DC2626',
  statusCancelledBg: '#FEF2F2',
  statusNoShow: '#78716C',
  statusNoShowBg: '#F5F5F4',

  tabInactive: '#A8A29E',
  male: '#0EA5E9',
  female: '#EC4899',
  other: '#78716C',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1C1917',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: '700', color: colors.text },
  h4: { fontSize: 16, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '500', color: colors.text },
  bodySmall: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
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
  if (g.startsWith('m')) return { bg: '#F0F9FF', text: colors.male };
  if (g.startsWith('f')) return { bg: '#FDF2F8', text: colors.female };
  return { bg: '#F5F5F4', text: colors.other };
};
