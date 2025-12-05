import { Platform } from 'react-native';
import PushNotification, { Importance } from 'react-native-push-notification';
import { PermissionsAndroid } from 'react-native';

class LocalNotificationService {
  constructor() {
    this.lastId = 0;
    this._createDefaultChannels();
  }

  // Create notification channels (Android 8.0+)
  _createDefaultChannels() {
    PushNotification.createChannel(
      {
        channelId: 'channel-id', // Match this in your notifications
        channelName: 'My channel',
        channelDescription: 'A channel to categorise your notifications',
        playSound: true,
        soundName: 'default',
        importance: Importance.HIGH,
        vibrate: true,
      },
      created => console.log(`Default channel created: ${created}`),
    );

    // PushNotification.createChannel(
    //   {
    //     // channelId: 'order-channel-id',
    //     // channelName: 'Order Notifications',
    //     channelId: 'channel-id', // Match this in your notifications
    //     channelName: 'My channel',
    //     channelDescription: 'Notifications for order updates',
    //     playSound: true,
    //     soundName: 'default',
    //     importance: Importance.HIGH,
    //     vibrate: true,
    //   },
    //   (created) => console.log(`Order channel created: ${created}`)
    // );
  }

  // Configure push notifications
  configure(onNotificationPop) {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('[LocalNotificationService] Token:', token);
      },

      onNotification: function (notification) {
        console.log('[LocalNotificationService] Notification:', notification);

        // Check if notification was clicked
        const clicked = notification.userInteraction;

        if (clicked && onNotificationPop) {
          onNotificationPop(notification);
        }

        // Required for iOS
        if (Platform.OS === 'ios') {
          notification.finish('UIBackgroundFetchResultNoData');
        }
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      // iOS permissions
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Request permissions on iOS
      requestPermissions: Platform.OS === 'ios',
    });
  }

  // Request Android 13+ notification permission
  async requestPermissions() {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs permission to show notifications',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          console.warn('[LocalNotificationService] Permission error:', err);
          return false;
        }
      }
      return true; // Android < 13 doesn't need runtime permission
    }
    return true;
  }

  // Show local notification immediately
  localNotification(title, message, imageUrl, data) {
    this.lastId++;

    const notification = {
      id: this.lastId.toString(),
      channelId: 'channel-id', // Must match created channel
      title: title || 'Notification',
      message: message || '',
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      vibrate: true,
      vibration: 300,
      userInfo: data || {},
      data: data || {},
    };

    // Add image if provided (Android only)
    if (Platform.OS === 'android' && imageUrl) {
      notification.bigPictureUrl = imageUrl;
      notification.largeIconUrl = imageUrl;
      notification.smallIcon = 'ic_stat_ic_notification';
    }

    // iOS specific
    if (Platform.OS === 'ios' && imageUrl) {
      notification.attachments = [
        {
          url: imageUrl,
        },
      ];
    }

    PushNotification.localNotification(notification);
  }

  // Schedule notification for later
  scheduleNotification(title, message, date, data) {
    this.lastId++;

    PushNotification.localNotificationSchedule({
      id: this.lastId.toString(),
      channelId: 'default-channel-id',
      title: title || 'Scheduled Notification',
      message: message || '',
      date: date || new Date(Date.now() + 60 * 1000), // 1 minute from now
      playSound: true,
      soundName: 'default',
      userInfo: data || {},
      data: data || {},
    });
  }

  // Check notification permissions
  checkPermissions(callback) {
    PushNotification.checkPermissions(callback);
  }

  // Cancel specific notification
  cancelNotification(id) {
    PushNotification.cancelLocalNotification(id || this.lastId.toString());
  }

  // Cancel all notifications
  cancelAllNotifications() {
    PushNotification.cancelAllLocalNotifications();
  }

  // Remove all delivered notifications
  removeAllDeliveredNotifications() {
    PushNotification.removeAllDeliveredNotifications();
  }

  // Unregister from notifications
  unregister() {
    PushNotification.unregister();
  }

  // Get notification channels (Android)
  getChannels(callback) {
    PushNotification.getChannels(callback);
  }
}

export default new LocalNotificationService();
