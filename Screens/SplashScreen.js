import React, { useEffect, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const hasFinished = useRef(false); 
  const runAnimation = useCallback(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    hasFinished.current = false; 
    runAnimation();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (!hasFinished.current) { 
          hasFinished.current = true;
          onFinish();
        }
      });
    }, 5000);

    return () => {
      clearTimeout(timer);
      hasFinished.current = true; 
    };
  }, [fadeAnim, scaleAnim, onFinish, runAnimation]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <Image
          source={require('../assets/launch_screen.jpg')}
          style={styles.logo}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) * 0.22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    backgroundColor: '#D4C4A8',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;