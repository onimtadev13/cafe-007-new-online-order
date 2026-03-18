// import React from 'react';
// import {Image, Text, View} from 'react-native';
// import BouncingPreloader from '../Components/BouncingPreLoader';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export default class SplashScreen extends React.Component {
//   constructor(props) {
//     super(props);
//   }

//   // componentDidMount() {
//   //   setTimeout(() => {
//   //     this.props.navigation.replace('PromoCard');
//   //   }, 5000);
//   // }

//   componentDidMount() {
//     setTimeout(async () => {
//       const shownPromo = await AsyncStorage.getItem('shownPromo');
//       if (!shownPromo) {
//         this.props.navigation.replace('PromoCardScreen');
//         await AsyncStorage.setItem('shownPromo', 'true');
//       } else {
//         this.props.navigation.replace('LoginScreen');
//       }
//     }, 5000);
//   }

//   render() {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: 'center',
//           alignItems: 'center',
//           backgroundColor: 'black',
//         }}>
//         {/* <BouncingPreloader
//                     icons={[
//                         require('../assets/burger.png'),
//                         require('../assets/french-fries.png'),
//                         require('../assets/pizza.png'),
//                         require('../assets/soft-drink.png'),
//                     ]}
//                     leftRotation="-680deg"
//                     rightRotation="360deg"
//                     leftDistance={-180}
//                     rightDistance={-250}
//                     speed={2500}
//                 /> */}
//         {/* <Text style={{ margin: 30, textAlign: 'center', fontFamily: 'AsapBold', fontSize: 20 }}>
//                     Think Choose Order Delivered {'\n'} Eat Enjoy and Repeat
//                     </Text> */}
//         <Image
//           source={require('../assets/launch_image.jpg')}
//           resizeMethod="resize"
//           resizeMode="cover"
//         />
//       </View>
//     );
//   }
// }

import React, { useEffect, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
  runAnimation();

  const timer = setTimeout(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true, // ✅ was false, must match the driver used above
    }).start(() => onFinish());
  }, 5000);

  return () => clearTimeout(timer);
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