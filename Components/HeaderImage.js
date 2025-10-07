import React from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import FastImage from 'react-native-fast-image';

const screenwidth = Dimensions.get('window').width;

export default class HeaderImage extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const {ImageURl} = this.props;

    return (
      <View>
        {/* <FastImage source={require('../assets/headerbackground.jpg')} style={{ width: screenwidth, height: 200 }} resizeMethod={'resize'} resizeMode={'cover'} /> */}
        <FastImage
          source={{
            uri: ImageURl,
            cache: FastImage.cacheControl.web,
            priority: FastImage.priority.high,
          }}
          style={{width: screenwidth, height: 200}}
          resizeMethod={'resize'}
          resizeMode={'cover'}
        />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {backgroundColor: 'rgba(0,0,0,0.3)'},
          ]}
        />
      </View>
    );
  }
}
