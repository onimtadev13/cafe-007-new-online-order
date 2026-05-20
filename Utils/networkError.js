import { Alert, BackHandler, Platform } from 'react-native';

export const showNetworkError = (error, onRetry) => {
  const msg = error?.message?.toLowerCase() || '';
  const isNetworkError =
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('timeout') ||
    msg.includes('connection refused') ||
    msg.includes('no internet');

  const message = isNetworkError
    ? 'No internet connection'
    : "The operation couldn't be completed. Please try again.";

  const handleClose = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      // iOS: no programmatic exit allowed, just dismiss
      console.warn('Please close the app manually.');
    }
  };

  const buttons = [];
  buttons.push({ text: 'Close', onPress: handleClose }); 

  if (onRetry) buttons.push({ text: 'Try Again', onPress: onRetry });
  
  Alert.alert('Connection Error', message, buttons, { cancelable: false });
};