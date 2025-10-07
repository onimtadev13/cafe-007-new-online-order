import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

const TabBarBadge = props => (
  <View>
    {console.log(props.length)}
    <View
      style={{
        position: 'absolute',
        marginLeft: 5,
        height: 20,
        width: 20,
        borderRadius: 15,
        backgroundColor: 'red',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{color: 'white', fontSize: 12}}>
        {props.length >= 100 ? '+99' : props.length}
      </Text>
    </View>
  </View>
);

export default TabBarBadge;
