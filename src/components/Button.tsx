import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export default function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const handlePress = () => {
    ReactNativeHapticFeedback.trigger('impactLight');
    onPress();
  };

  const baseStyles: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexDirection: 'row',
  };

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 16 },
    md: { paddingVertical: 12, paddingHorizontal: 24 },
    lg: { paddingVertical: 16, paddingHorizontal: 32 },
  };

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: '#FF00FF' },
    secondary: { backgroundColor: '#1A1A2E' },
    ghost: { backgroundColor: 'transparent' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF00FF' },
  };

  const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#FFFFFE' },
    ghost: { color: '#FFFFFE' },
    outline: { color: '#FF00FF' },
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      style={[
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        disabled && { opacity: 0.5 },
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#FF00FF'} />
      ) : (
        <Text
          style={[
            { fontFamily: 'Rajdhani-Bold', textTransform: 'uppercase' },
            textSizeStyles[size],
            textVariantStyles[variant],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
