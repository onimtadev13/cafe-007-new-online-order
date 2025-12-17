// since App.js now handles the auth logic

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';

export default class SplashScreen extends React.Component {
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
