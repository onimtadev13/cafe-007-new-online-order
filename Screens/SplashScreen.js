import React from 'react';
import { Image, Text, View } from 'react-native';
import BouncingPreloader from '../Components/BouncingPreLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';

export default class SplashScreen extends React.Component {
  constructor(props) {
    super(props);
  }

  // componentDidMount() {
  //   setTimeout(() => {
  //     this.props.navigation.replace('PromoCard');
  //   }, 5000);
  // }

  componentDidMount() {
    setTimeout(async () => {
      // Determine whether user is logged in based on stored phone number
      const phonenumber = await AsyncStorage.getItem('phonenumber');

      if (phonenumber) {
        // If logged in, navigate to the main app
        this.props.navigation.replace('App');
      } else {
        // Otherwise, go to the Auth flow
        this.props.navigation.replace('Auth');
      }
    }, 3000);
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
        }}
      >
        {/* <BouncingPreloader
                    icons={[
                        require('../assets/burger.png'),
                        require('../assets/french-fries.png'),
                        require('../assets/pizza.png'),
                        require('../assets/soft-drink.png'),
                    ]}
                    leftRotation="-680deg"
                    rightRotation="360deg"
                    leftDistance={-180}
                    rightDistance={-250}
                    speed={2500}
                /> */}
        {/* <Text style={{ margin: 30, textAlign: 'center', fontFamily: 'AsapBold', fontSize: 20 }}>
                    Think Choose Order Delivered {'\n'} Eat Enjoy and Repeat
                    </Text> */}
        <FastImage
          source={require('../assets/launch_screen.jpg')}
          resizeMethod="resize"
          resizeMode="contain"
          style={{ width: 200, height: 200 }}
        />
      </View>
    );
  }
}
