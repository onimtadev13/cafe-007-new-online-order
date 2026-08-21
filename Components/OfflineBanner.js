import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const OfflineBanner = ({ visible }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          scale.setValue(0.96);
        }
      });
    }
  }, [visible, opacity, scale]);

  useEffect(() => {
    if (!mounted) {
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [mounted, pulse]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        <Animated.View
          style={[styles.logoWrap, { transform: [{ scale: pulse }] }]}
        >
          <Image
            source={require('../assets/cafe007-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.statusPill}>
          <FontAwesome6
            name="triangle-exclamation"
            size={11}
            color="#B45309"
            solid
          />
          <Text style={styles.statusPillText}>Temporarily Offline</Text>
        </View>

        <Text style={styles.title}>App is Temporarily Offline</Text>
        <Text style={styles.subtitle}>
          We're working on getting things back up. We'll let you know the
          moment we're back online.
        </Text>

        <Text style={styles.footer}>Thank you for being with Cafe 007</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: '#FBFAF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 340,
  },
  logoWrap: {
    marginBottom: 28,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 116,
    height: 116,
    borderRadius: 26,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  statusPillText: {
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
    fontSize: 12,
    color: '#B45309',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
    fontSize: 22,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
    fontSize: 15,
    lineHeight: 22,
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 28,
  },
  footer: {
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
    fontSize: 13,
    color: '#9A9A9A',
    textAlign: 'center',
  },
});

export default OfflineBanner;
