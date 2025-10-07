import React from 'react';
import {View, Text, Dimensions, TouchableOpacity, Platform} from 'react-native';

const AlertDialog = props => {
  return (
    <View
      style={{
        position: 'absolute',
        height: '100%',
        width: '100%',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(52, 52, 52, 0.5)',
      }}>
      <View
        style={{
          width: Dimensions.get('window').width - 100,
          backgroundColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 12,
        }}>
        <Text
          style={{
            padding: 20,
            fontSize: 18,
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
          }}>
          A Gentle Reminder
        </Text>
        <View
          style={{
            height: 0.5,
            width: Dimensions.get('window').width - 150,
            backgroundColor: 'black',
            marginBottom: 20,
          }}
        />
        <Text
          style={{
            paddingBottom: 20,
            paddingHorizontal: 15,
            fontSize: 16,
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
          }}>
          {props.message}
        </Text>

        <View style={{marginBottom: 20}}>
          <TouchableOpacity onPress={() => props.onbuttonPress()}>
            <View
              style={{
                backgroundColor: 'black',
                height: 40,
                width: Dimensions.get('window').width - 200,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 12,
              }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  color: 'white',
                }}>
                Got it
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AlertDialog;
