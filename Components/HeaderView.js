import React from 'react';
import {Dimensions, Platform, Text, View} from 'react-native';
import {isTablet} from 'react-native-device-info';
import FastImage from 'react-native-fast-image';

const screenwidth = Dimensions.get('screen').width;

export default class HeaderView extends React.PureComponent {
  render() {
    const {item} = this.props;

    return (
      <View style={{width: '100%', height: 170, backgroundColor: '#F0F0F0'}}>
        <FastImage
          source={
            isTablet()
              ? require('../assets/section_tablet_img.png')
              : require('../assets/section_img.png')
          }
          style={{width: screenwidth, height: '100%', position: 'absolute'}}
          resizeMode={FastImage.resizeMode.stretch}
        />
        <View style={{flex: 1, margin: 10, justifyContent: 'center'}}>
          <Text
            style={{
              fontSize: 18,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
            }}>
            {item.Prod_Name}
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            }}
            numberOfLines={5}>
            {item.Dept_Content}
          </Text>
        </View>
      </View>
    );
  }
}
