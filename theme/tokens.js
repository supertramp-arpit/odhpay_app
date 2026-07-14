// ODH Pay design tokens — materialized from .claude/skills/odhpay-ui-ux/references/design-system.md
// Single source of truth for color / type / spacing / radius / elevation.
// Never hardcode a hex or font size in a screen — import from here.

export const color = {
  // Neutral spine (the brand)
  ink900: '#0A0A0B',
  ink800: '#16171A',
  ink700: '#26282D',
  ink600: '#3A3D44',
  gray500: '#6B7280',
  gray400: '#9AA1AD',
  gray300: '#CDD2DA',
  gray200: '#E4E7EC',
  gray150: '#EEF0F3',
  gray100: '#F4F5F7',
  gray50: '#F7F8FA',
  white: '#FFFFFF',

  // Semantic — ONE family per meaning (base / fg / bg)
  success: '#0E9F6E',
  successFg: '#047857',
  successBg: '#E7F7EF',
  error: '#E5484D',
  errorFg: '#B42318',
  errorBg: '#FDECEC',
  warning: '#F59E0B',
  warningFg: '#B45309',
  warningBg: '#FEF3E0',
  info: '#2563EB',
  infoFg: '#1D4ED8',
  infoBg: '#E8F0FE',

  // Money semantics: credit = green, debit = ink (NOT red — red means failure)
  moneyCredit: '#047857',
  moneyDebit: '#0A0A0B',

  // Regulated brand (NPCI/UPI lockups only — never a general accent)
  brandUpi: '#5F259F',
  brandUpiFg: '#FFFFFF',

  // Surfaces, lines, interaction
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F4F5F7',
  surfaceSunken: '#EEF0F3',
  overlay: 'rgba(10,10,11,0.55)',
  text: '#0A0A0B',
  textSecondary: '#6B7280',
  textTertiary: '#9AA1AD',
  textDisabled: '#CDD2DA',
  textInverse: '#FFFFFF',
  border: '#E4E7EC',
  borderStrong: '#CDD2DA',
  divider: '#EEF0F3',
  pressTint: 'rgba(10,10,11,0.06)',
  pressTintInverse: 'rgba(255,255,255,0.14)',
};

// 4pt base spacing scale
export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  giant: 64,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14, // buttons, inputs
  lg: 18, // cards
  xl: 24, // large cards, bottom-sheet tops
  xxl: 32,
  pill: 999,
};

// Type scale — spread into Text styles: {...type.h2}
export const type = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.5 },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.4 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.2 },
  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodySm: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '500', letterSpacing: 0.1 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '500', letterSpacing: 0.2 },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600', letterSpacing: 0.1 },
  buttonSm: { fontSize: 14, lineHeight: 18, fontWeight: '600', letterSpacing: 0.1 },
};

// Numbers/money/OTP always add this so digits don't shift
export const tabularNums = { fontVariant: ['tabular-nums'] };

// Elevation — hairline border first, shadow second. Soft, low-spread.
export const elevation = {
  level1: {
    shadowColor: '#0A0A0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  level2: {
    shadowColor: '#0A0A0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Standard hitSlop to bring a small visual target up to >=44pt
export const hitSlop8 = { top: 8, bottom: 8, left: 8, right: 8 };
