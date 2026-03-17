import { View, Text, ViewStyle } from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'accent' | 'muted';
  style?: ViewStyle;
}

export default function Badge({ text, variant = 'primary', style }: BadgeProps) {
  const variantStyles: Record<string, { bg: string; text: string }> = {
    primary: { bg: '#FF00FF', text: '#FFFFFF' },
    accent: { bg: '#00FFFF', text: '#0F0E17' },
    muted: { bg: '#2A2A40', text: '#A0A0B0' },
  };

  const colors = variantStyles[variant];

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 4,
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 10,
          fontFamily: 'Rajdhani-Bold',
          textTransform: 'uppercase',
        }}
      >
        {text}
      </Text>
    </View>
  );
}
