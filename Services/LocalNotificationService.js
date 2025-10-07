import {Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';

class LocalNoticationService { 
  constructor(onNotificationPop) {
    PushNotification.createChannel(
      {
        channelId: 'channel-id', // (required)
        channelName: 'My channel', // (required)
        channelDescription: 'A channel to categorise your notifications', // (optional) default: undefined.
        playSound: false, // (optional) default: true
        soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
        importance: 4, // (optional) default: 4. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration patten if true.
      },
      created => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
    );

    this.configure(onNotificationPop);
    this.lastId = 0;
  }

  configure(onNotificationPop) {
    PushNotification.configure({
      onRegister: function (token) {
        // console.log("[LocalNoticationService] onRegister ", token);
      },
      onNotification: function (notification) {
        const clicked = notification.userInteraction;
        if (clicked) {
          notification.userInteraction = true;
          if (onNotificationPop !== undefined) {
            onNotificationPop(notification);
          }

          if (Platform.OS === 'ios') {
            // (required) Called when a remote is received or opened, or local notification is opened
            // notification.finish(PushNotificationIOS.FetchResult.NoData)
          }
        } else {
          console.log('NOT CLICK');
        }
      },

      // IOS ONLY (optional): default: all - Permissions to register.
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: true,
    });
  }

  //Appears right away
  localNotification(Title, MSG, IMGURL, JSON) {
    this.lastId++;
    PushNotification.localNotification({
      channelId: 'channel-id',
      title: Title,
      message: MSG,
      playSound: true,
      soundName: 'default',
      bigPictureUrl: IMGURL,
      smallIcon: 'ic_stat_ic_notification',
      userInfo: JSON,
    });
  }

  //Appears after a specified time. App does not have to be open.
  scheduleNotification() {
    this.lastId++;
    PushNotification.localNotificationSchedule({
      date: new Date(Date.now() + 30 * 1000), //30 seconds
      title: 'Scheduled Notification',
      message: 'My Notification Message',
      playSound: true,
      soundName: 'default',
    });
  }

  checkPermission(cbk) {
    return PushNotification.checkPermissions(cbk);
  }

  cancelNotif() {
    PushNotification.cancelLocalNotifications({id: '' + this.lastId});
  }

  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }

  unregister() {
    PushNotification.unregister();
  }
}
export default new LocalNoticationService();
