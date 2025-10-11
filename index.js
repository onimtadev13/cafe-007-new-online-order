/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import { firebase } from '@react-native-firebase/messaging';

import Ionicons from 'react-native-vector-icons/Ionicons';

Ionicons.loadFont();

firebase.messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
