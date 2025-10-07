import React from 'react';
import {Platform, Text, View} from 'react-native';

export default class FoodQtyLabel extends React.PureComponent {
  render() {
    const {isBestseller, isOffer, qty} = this.props;

    return (
      <>
        {isBestseller ? (
          <View
            style={{
              paddingTop: 5,
              paddingBottom: 5,
              paddingRight: 8,
              paddingLeft: 8,
              backgroundColor: '#d92525',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              borderTopLeftRadius: 20,
              marginTop: 5,
              marginLeft: 5,
            }}>
            <Text
              style={{
                color: 'white',
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 14,
                marginTop: -2,
              }}>
              Bestseller
            </Text>
          </View>
        ) : null}

        {isOffer !== 0 ? (
          <View
            style={{
              width: 100,
              height: 25,
              backgroundColor: '#41d12e',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              marginTop: 30,
            }}>
            <Text
              style={{
                color: 'white',
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 14,
              }}>
              {isOffer}% LKR OFF
            </Text>
          </View>
        ) : null}

        {qty > 0 ? (
          <View style={{alignItems: 'flex-end', justifyContent: 'flex-end'}}>
            <View
              style={{
                backgroundColor: 'black',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                borderBottomRightRadius: 10,
              }}>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 14,
                  color: 'white',
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 3,
                  paddingBottom: 3,
                }}>
                {qty}
              </Text>
            </View>
          </View>
        ) : null}
      </>
    );
  }
}
