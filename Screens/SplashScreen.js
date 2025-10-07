import React from 'react';
import {Image, Text, View} from 'react-native';
import BouncingPreloader from '../Components/BouncingPreLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const shownPromo = await AsyncStorage.getItem('shownPromo');
      if (!shownPromo) {
        this.props.navigation.replace('PromoCardScreen');
        await AsyncStorage.setItem('shownPromo', 'true');
      } else {
        this.props.navigation.replace('LoginScreen');
      }
    }, 5000);
  }

  render() {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
        }}>
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
        <Image
          source={require('../assets/launch_image.jpg')}
          resizeMethod="resize"
          resizeMode="cover"
        />
      </View>
    );
  }
}
