import React from 'react';
import {Platform, Text, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default class RatingStarIcon extends React.PureComponent {
  render() {
    const {rate, isSoldOut} = this.props;

    return (
      <View
        style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
        <Ionicons name="star" size={20} color={'#fcba03'} />
        <Text
          style={{
            flex: 1,
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 14,
            marginLeft: 5,
          }}>
          {rate}
        </Text>
        {isSoldOut ? (
          <View
            style={{
              paddingTop: 5,
              paddingBottom: 5,
              paddingRight: 8,
              paddingLeft: 8,
              backgroundColor: 'red',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                color: 'white',
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 14,
                marginTop: -2,
              }}>
              Sold out
            </Text>
          </View>
        ) : null}
      </View>
    );
  }
}
