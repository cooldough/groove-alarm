import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export default function Card({ children, style, testID }: CardProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: '#1A1A2E',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: '#3A3A50',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
