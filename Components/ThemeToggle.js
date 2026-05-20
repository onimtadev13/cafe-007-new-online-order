import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useTheme } from '../Context/ThemeContext';

export default function ThemeToggle({ size = 18, style }) {
  const { theme, isDark, toggleTheme } = useTheme();

  // Spin + scale animation on press
  const spin = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(spin, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 0.7,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => spin.setValue(0));

    toggleTheme();
  };

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: theme.surface, borderColor: theme.cardBorder },
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
        <FontAwesome6
          // moon = dark mode off (currently light, press to go dark)
          // sun  = currently dark, press to go light
          name={isDark ? 'sun' : 'moon'}
          size={size}
          solid
          color={isDark ? theme.accent : '#5A5080'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
