export enum FBColorPalette {
  // general use colors
  primary = '#45B877',
  secondary = '#0E2F34',
  accent = '#A8DDB5',
  complementary = '#62A88E',
  neutral = '#333333',
  error = '#EB2626',
  faded = 'rgba(0, 0, 0, 0.13)',
  amber = '#FFBF1A',
  mediumBlue = '#1e90ff',

  // named colors
  lightGreen = 'rgba(168, 221, 181, 0.2)',
  deepTeal = '#006446',
  white = '#FFFFFF',
  lightGray = 'rgba(6, 6, 6, 0.5)',
  darkGray = '#242424',
  mediumGray = 'rgba(51, 51, 51, 0.7)',
  black = '#000000',
  input = '#F9FAFB',
  inputAlternate = '#FAFAF9',
  inputBorder = '#E5E7EB',
  inputBorderAlternate = '#EBEBE6',
  disabledInputText = '#9CA3AF',
  slate = 'rgba(107, 114, 128, 1)',
  steelBlue = '#6B7280',
  redGradient = '#D9534F',
  lightRed = '#F2DEDE',
  lightYellow = '#FFF2CC',

  //   backgrounds
  bgPrimary = '#F5F5F5',
  bgSecondary = '#F4EEDE',
  sky = 'rgba(150, 217, 255, 0.4)',
  subtleBlack = 'rgba(0, 0, 0, 0.05)',
  pastelGreen = '#ECFDF5',
  shellPink = '#FEE2E2',
  seaShell = 'rgba(244, 238, 222, 0.1)',
  disabledBG = '#C0C4CA',
  softBlue = '#F8FAFC',

  //   borders
  borderPrimary = 'rgba(229, 231, 235, 1)',
  borderSecondary = '#D9D9D9',
  borderYellow = '#deb887',

  // gradient
  gradientPrimaryStart = 'rgba(244, 238, 222, 0.29)',
  gradientPrimaryEnd = 'rgba(144, 152, 163, 0)',

  // text
  text = '#0E2F34',
  placeHolderPrimary = 'rgba(156, 163, 175, 1)',
}

// Typographic styles

export type Colors =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'lightGray'
  | 'mediumGray'
  | 'darkGray'
  | 'white'
  | 'faded'
  | 'complementary'
  | 'error'
  | 'slate'
  | 'accent'
  | 'disabledInputText'
  | 'amber'
  | 'steelBlue'
  | 'redGradient'
  | 'lightRed'
  | 'lightYellow'
  | 'placeHolderPrimary';

export enum FontSizeEnum {
  'xxs' = '8@s',
  'xs' = '10@s',
  'sm' = '12@s',
  'base' = '14@s',
  'lg' = '18@s',
  'xl' = '22@s',
  '2xl' = '26@s',
  '3xl' = '30@s',
  '4xl' = '34@s',
}

export type FontSize =
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';

export enum FBColors {
  primary = FBColorPalette.primary,
  secondary = FBColorPalette.secondary,
  neutral = FBColorPalette.neutral,
  white = FBColorPalette.white,
  lightGray = FBColorPalette.lightGray,
  darkGray = FBColorPalette.darkGray,
  faded = FBColorPalette.faded,
  complementary = FBColorPalette.complementary,
  mediumGray = FBColorPalette.mediumGray,
  error = FBColorPalette.error,
  slate = FBColorPalette.slate,
  accent = FBColorPalette.accent,
  steelBlue = FBColorPalette.steelBlue,
  disabledInputText = FBColorPalette.disabledInputText,
  amber = FBColorPalette.amber,
  redGradient = FBColorPalette.redGradient,
  lightRed = FBColorPalette.lightRed,
  lightYellow = FBColorPalette.lightYellow,

  // placeholders
  placeHolderPrimary = FBColorPalette.placeHolderPrimary,
}

export enum FBBackground {
  primary = FBColorPalette.bgPrimary,
  secondary = FBColorPalette.bgSecondary,
  darkGreen = FBColorPalette.secondary,
  white = FBColorPalette.white,
  sky = FBColorPalette.sky,
  subtleBlack = FBColorPalette.subtleBlack,
  pastelGreen = FBColorPalette.pastelGreen,
  shellPink = FBColorPalette.shellPink,
  seaShell = FBColorPalette.seaShell,
  input = FBColorPalette.input,
  inputAlternate = FBColorPalette.inputAlternate,
  active = FBColorPalette.primary,
  accent = FBColorPalette.accent,
  deepTeal = FBColorPalette.deepTeal,
  complementary = FBColorPalette.complementary,
  disabled = FBColorPalette.disabledBG,
  softBlue = FBColorPalette.softBlue,
  lightYellow = FBColorPalette.lightYellow,
  error = FBColorPalette.error,
  blue = FBColorPalette.mediumBlue,
}

export enum FBBorders {
  primary = FBColorPalette.borderPrimary,
  secondary = FBColorPalette.borderSecondary,
  darkGreen = FBColorPalette.secondary,
  input = FBColorPalette.inputBorder,
  inputAlternate = FBColorPalette.inputBorderAlternate,
  forestGreen = FBColorPalette.primary,
  disabledInputText = FBColorPalette.disabledInputText,
  borderYellow = FBColorPalette.borderYellow,
  error = FBColorPalette.error,
  complementary = FBColorPalette.complementary,
}
