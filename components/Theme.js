import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 768;
const isLargeDevice = width >= 768;
const isWeb = Platform.OS === 'web';

const Theme = {
  colors: {
    primary: '#000000',
    primaryDark: '#000000',
    primaryLight: '#8B85FF',
    secondary: '#FFFFFF',
    background: '#F8F9FE',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    accent: '#FF6B6B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    border: '#E5E7EB',
    inputBg: '#F3F4F6',
    shadow: 'rgba(108, 99, 255, 0.15)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    gradient: {
      start: '#6C63FF',
      end: '#8B85FF',
    },
    BottomNav: '#000000',
    HeaderTint: '#FFFFFF',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    h1: {
      fontSize: isSmallDevice ? 28 : isLargeDevice ? 36 : 32,
      fontWeight: '700',
      lineHeight: isSmallDevice ? 36 : isLargeDevice ? 44 : 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: isSmallDevice ? 22 : isLargeDevice ? 28 : 24,
      fontWeight: '600',
      lineHeight: isSmallDevice ? 30 : isLargeDevice ? 36 : 32,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: isSmallDevice ? 18 : isLargeDevice ? 22 : 20,
      fontWeight: '600',
      lineHeight: isSmallDevice ? 26 : isLargeDevice ? 30 : 28,
    },
    body: {
      fontSize: isSmallDevice ? 14 : 16,
      fontWeight: '400',
      lineHeight: isSmallDevice ? 22 : 24,
    },
    bodySmall: {
      fontSize: isSmallDevice ? 12 : 14,
      fontWeight: '400',
      lineHeight: isSmallDevice ? 18 : 20,
    },
    caption: {
      fontSize: isSmallDevice ? 11 : 12,
      fontWeight: '400',
      lineHeight: isSmallDevice ? 16 : 18,
    },
    button: {
      fontSize: isSmallDevice ? 14 : 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 6,
    },
  },

  layout: {
    screenPadding: isSmallDevice ? 16 : isLargeDevice ? 32 : 24,
    maxWidth: isLargeDevice ? 480 : '100%',
    containerWidth: Math.min(width, 480),
  },

  responsive: {
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isWeb,
    width,
    height,
  },

  Text: {
    Company: "ODH"
  }
};

export const getResponsiveValue = (small, medium, large) => {
  if (isSmallDevice) return small;
  if (isLargeDevice) return large;
  return medium;
};

export default Theme;
