// import {NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme} from '@react-navigation/native';
import { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  BackHandler,
  StatusBar,
  Platform,
  Linking,
  AppState,
} from 'react-native';
import AuthContext from './Components/Context';
import BottomTabNavigation from './Routes/BottomTabNavigation';
import { Provider } from 'react-redux';
import store from './Store';
import { openDatabase } from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackNavigation } from './Routes/StackNavigation';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from 'react-native-splash-screen';
import { APIURL, OTPAPIURL, SENDTESTNOTIFICTION } from './Data/CloneData';
import messaging from '@react-native-firebase/messaging';
import { firebase } from '@react-native-firebase/app';
import { getVersion } from 'react-native-device-info';
import branch from 'react-native-branch';
import LocalNotificationService from './Services/LocalNotificationService';
import NotificationModal from './Components/NotificationModal';
import PromoCard from './Components/PromoCard';

import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

var db = openDatabase({ name: 'UserDatabase.db' });
const RootStack = createStackNavigator();

const App = () => {
  const [isClick, setClick] = React.useState(false);
  const [isOTPVisible, setOTPVisible] = React.useState(false);
  const [OtpCode, setOtpCode] = React.useState('');
  const otpRef = React.useRef('');
  const [OtpNotification, setOtpNotification] = React.useState('');
  const [isButtonClick, setButtonClick] = React.useState(false);
  const [isRegister, setRegister] = React.useState(false);
  const appState = React.useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = React.useState(
    appState.current,
  );
  const [isUpdated, setUpdated] = React.useState(false);
  const [state, setstate] = React.useState({
    Type: '',
    Image: '',
    ItemCode: '',
    Description: '',
    More_Description: '',
    isMenuButtonVisible: false,
    isVisible: false,
  });

  const navigationRef = React.createRef();

  const [showPromo, setShowPromo] = useState(false);

  function navigate(name, params) {
    navigationRef.current && navigationRef.current.navigate(name, params);
  }

  function replace(name, params) {
    navigationRef.current && navigationRef.current.replace(name, params);
  }

  const Initialloginstate = {
    isLoading: true,
    userToken: null,
  };

  const LoginReducer = (prevstate, action) => {
    switch (action.Type) {
      case 'RETREIVE_TOKEN':
        return {
          ...prevstate,
          userToken: action.Token,
          isLoading: false,
        };

      case 'LOGIN':
        return {
          ...prevstate,
          userToken: action.Token,
          isLoading: false,
        };

      case 'LOGOUT':
        return {
          ...prevstate,
          userToken: null,
          isLoading: false,
        };
    }
  };

  const [loginstate, dispatch] = React.useReducer(
    LoginReducer,
    Initialloginstate,
  );

  const authContext = React.useMemo(
    () => ({
      login: mobilenumber => {
        if (mobilenumber == '') {
          Alert.alert('Warning', 'Required Mobile Number');
        } else if (mobilenumber === '11111') {
          setOTPVisible(true);
          testNotification();
        } else if (mobilenumber.length < 9) {
          Alert.alert('Warning', 'Please type valid mobile number');
        } else {
          if (!isButtonClick) {
            setButtonClick(true);
            setOTPVisible(true);
            sendSMS(mobilenumber);
          }
        }
      },

      OTPVerification: async (OTPCode, mobilenumber, navigation) => {
        console.log('Entered OTPCode:', OTPCode);
        console.log('Expected OtpCode(ref):', otpRef.current);

        if (!OTPCode || OTPCode.trim() === '') {
          setOTPVisible(false);
          setButtonClick(false);
          Alert.alert(
            'Warning',
            'The OTP you entered could not be authenticated. Please try again.',
          );
          return;
        }

        if (OTPCode !== otpRef.current) {
          Alert.alert('Warning', 'Incorrect OTP. Please try again.');
          return;
        }

        setOTPVisible(false);
        setButtonClick(false);

        getToken().then(fcmToken => {
          CheckUserDetailExist(mobilenumber, navigation);
        });
      },

      ResendOTP: async mobilenumber => {
        if (mobilenumber === '11111') {
          testNotification();
        } else {
          ResendSMS(mobilenumber);
        }
      },

      CloseOtpBox: () => {
        setOTPVisible(false);
        setButtonClick(false);
      },

      SkipButton: async () => {
        const keys = [
          'address',
          'firstname',
          'lastname',
          'email',
          'phonenumber',
          'city',
          'EditStatus',
          'LOCA',
          'PUSH',
          'NID',
        ];

        AsyncStorage.multiRemove(keys).then(res => {
          dispatch({ Type: 'LOGIN', Token: 'Osanda' });
        });
      },

      SignUp: (firstname, lastname, mobilenumber, email, address, city) => {
        setRegister(true);
        getToken().then(fcmToken => {
          RegisterUser(firstname, lastname, mobilenumber, email, address, city);
        });
      },

      CheckSign: () => {
        dispatch({ Type: 'LOGOUT' });
      },

      Rememberme: () => {
        dispatch({ Type: 'LOGIN', Token: 'Osanda' });
      },

      logout: async () => {
        dispatch({ Type: 'LOGOUT' });
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const registerAppWithFCM = async () => {
    if (Platform.OS === 'ios') {
      await messaging().setAutoInitEnabled(true);
    }
  };

  const checkPermission = () => {
    messaging()
      .hasPermission()
      .then(enabled => {
        if (enabled) {
          getToken();
        } else {
          requestPermission();
        }
      })
      .catch(err => {
        Alert.alert('FCMService', 'Permission Reject');
      });
  };

  const getToken = async () => {
    return new Promise((resolve, reject) => {
      messaging()
        .getToken()
        .then(fcmToken => {
          if (fcmToken === null) {
            Alert.alert('FCMService', 'User does not have a device token');
          } else if (fcmToken === undefined) {
            Alert.alert('FCMService', 'User does not have a device token');
          } else if (fcmToken === '') {
            console.log('getToken');
            getToken();
          } else {
            AsyncStorage.setItem('fcmToken', fcmToken);
            console.log('FCM Token', fcmToken);
            resolve(fcmToken);
          }
        })
        .catch(err => {
          Alert.alert('FCMService', 'getToken rejected');
          reject(err);
        });
    });
  };

  const requestPermission = async () => {
    messaging()
      .requestPermission()
      .then(() => {
        getToken();
      })
      .catch(err => {
        Alert.alert('Permission', 'Request Permission rejected');
      });
  };

  const generateOTP = length => {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  };

  const sendEmail = (email, firstname) => {
    fetch('http://139.59.83.223:3001/api/email-verification/details', {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        name: firstname,
        email: email,
        link: 'https://onlineorderapp.page.link/confirmemail',
      }),
    });
  };

  const testNotification = async () => {
    let FCMToken = await AsyncStorage.getItem('fcmToken');
    var code = generateOTP(4);
    setOtpCode(code);
    otpRef.current = code;

    fetch(SENDTESTNOTIFICTION, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        ftoken: FCMToken,
        otp: code,
      }),
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        // console.log(JSON.stringify(json));
      })
      .catch(er => {
        Alert.alert('Warning', 'Required Valid Mobile Number');
      });
  };

  const sendSMS = mobilenumber => {
    var code = generateOTP(4);

    setOtpCode(code);
    otpRef.current = code;

    console.log('Generated OTP:', code);

    fetch(OTPAPIURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        dst: mobilenumber,
        msg: code,
      }),
    });

    SaveOTP(mobilenumber, code);
  };

  const SaveOTP = (mobilenumber, OTP) => {
    fetch(APIURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        HasReturnData: 'F',
        Parameters: [
          {
            Para_Data: '107',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: mobilenumber,
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: OTP,
            Para_Direction: 'Input',
            Para_Lenth: 50000,
            Para_Name: '@Text2',
            Para_Type: 'varchar',
          },
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    });
  };

  const ResendSMS = mobilenumber => {
    var code = generateOTP(4);
    setOtpCode(code);
    otpRef.current = code;

    fetch(OTPAPIURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        dst: mobilenumber,
        msg: code,
      }),
    });
    SaveOTP(mobilenumber, code);
  };

  const CreatSqlitTable = () => {
    db.transaction(function (txn) {
      txn.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='credit_card'",
        [],
        function (tx, res) {
          if (res.rows.length == 0) {
            txn.executeSql('DROP TABLE IF EXISTS credit_card', []);
            txn.executeSql(
              'CREATE TABLE IF NOT EXISTS credit_card(Id_No INTEGER PRIMARY KEY AUTOINCREMENT, user_name VARCHAR(100), card_type VARCHAR(100), card_number VARCHAR(255), card_exp VARCHAR(100), card_cvv VARCHAR(100), userID VARCHAR(225))',
              [],
            );
          }
        },
      );
    });
  };

  const openAppStore = URl => {
    const link = URl;
    Linking.canOpenURL(link).then(
      supported => {
        supported && Linking.openURL(link);
      },
      err => console.log(err),
    );
  };

  const CheckAppVersion = () => {
    fetch(APIURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        HasReturnData: 'T',
        Parameters: [
          {
            Para_Data: '92',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: getVersion(),
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: Platform.OS,
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text2',
            Para_Type: 'varchar',
          },
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        const Status = json.CommonResult.Table[0].Status;
        var AppURL = json.CommonResult.Table[0].AppURL;

        if (Status === 'Exist') {
          setUpdated(true);
          CheckUserLogin();
        } else {
          setUpdated(false);
          SplashScreen.hide();
          Alert.alert(
            'Update is available',
            'An update for the application is available',
            [
              {
                text: 'Update',
                onPress: () => openAppStore(AppURL),
              },
            ],
            { cancelable: false },
          );
        }
      })
      .catch(er => {
        console.log('CheckAppVersion', er);

        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => CheckAppVersion(),
            },
            {
              text: 'Close',
              onPress: () => BackHandler.exitApp(),
            },
          ],
          { cancelable: false },
        );
      });
  };

  useEffect(() => {
    if (loginstate.userToken) {
      AsyncStorage.removeItem('promoShown');
    }
  }, [loginstate.userToken]);

  useEffect(() => {
    if (!loginstate.userToken) return;

    const checkPromo = async () => {
      const hasShown = await AsyncStorage.getItem('promoShown');
      if (!hasShown) {
        setShowPromo(true);
        await AsyncStorage.setItem('promoShown', 'true');
      }
    };

    checkPromo();

    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active' &&
          loginstate.userToken
        ) {
          await AsyncStorage.removeItem('promoShown');
          setShowPromo(true);
          await AsyncStorage.setItem('promoShown', 'true');
        }
        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, [loginstate.userToken]);

  const handleDismissPromo = () => {
    setShowPromo(false);
  };

  const handleMoreOptions = () => {
    setShowPromo(false);
    navigate('PromotionsScreen', {
      screen: 'PromotionsScreen',
      params: {},
    });
  };

  const CheckUserDetailExist = async (mobilenumber, navigation) => {
    AsyncStorage.getItem('fcmToken').then(FCMToken => {
      console.log(FCMToken);

      fetch(APIURL, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify({
          HasReturnData: 'T',
          Parameters: [
            {
              Para_Data: '87',
              Para_Direction: 'Input',
              Para_Lenth: 10,
              Para_Name: '@Iid',
              Para_Type: 'int',
            },
            {
              Para_Data: mobilenumber,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text1',
              Para_Type: 'varchar',
            },
            {
              Para_Data: FCMToken,
              Para_Direction: 'Input',
              Para_Lenth: 50000,
              Para_Name: '@Text2',
              Para_Type: 'varchar',
            },
          ],
          SpName: 'sp_Android_Common_API',
          con: '1',
        }),
      })
        .then(res => {
          return res.json();
        })
        .then(json => {
          var UserExist = json.CommonResult.Table[0].Message;
          var UserAddress = json.CommonResult.Table[0].Address;
          var UserFirstname = json.CommonResult.Table[0].FirstName;
          var UserLastname = json.CommonResult.Table[0].LastName;
          var UserEmail = json.CommonResult.Table[0].Email;
          var UserCity = json.CommonResult.Table[0].City;

          if (UserExist === 'Success') {
            const items = [
              ['firstname', UserFirstname],
              ['lastname', UserLastname],
              ['email', UserEmail],
              ['phonenumber', mobilenumber],
              ['address', UserAddress],
              ['city', UserCity],
              ['EditStatus', 'false'],
            ];

            AsyncStorage.multiSet(items, () => {
              setRegister(false);
              dispatch({ Type: 'LOGIN', Token: mobilenumber });
            });
          } else {
            navigation.navigate('AddInfoScreen', {
              mobilenumber: mobilenumber,
            });
          }
        })
        .catch(er => {
          console.log('Login User Detail Exist Error', er);
          Alert.alert(
            'Warning',
            "The operation couldn't be completed.",
            [
              {
                text: 'Try Again',
                onPress: () => CheckUserDetailExist(mobilenumber, navigation),
              },
              {
                text: 'Close',
                onPress: () => BackHandler.exitApp(),
              },
            ],
            { cancelable: false },
          );
        });
    });
  };

  const CheckUserExist = async mobilenumber => {
    AsyncStorage.getItem('fcmToken').then(FCMToken => {
      console.log(FCMToken);

      fetch(APIURL, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify({
          HasReturnData: 'T',
          Parameters: [
            {
              Para_Data: '87',
              Para_Direction: 'Input',
              Para_Lenth: 10,
              Para_Name: '@Iid',
              Para_Type: 'int',
            },
            {
              Para_Data: mobilenumber,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text1',
              Para_Type: 'varchar',
            },
            {
              Para_Data: FCMToken,
              Para_Direction: 'Input',
              Para_Lenth: 50000,
              Para_Name: '@Text2',
              Para_Type: 'varchar',
            },
            {
              Para_Data: 'CC',
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text3',
              Para_Type: 'varchar',
            },
          ],
          SpName: 'sp_Android_Common_API',
          con: '1',
        }),
      })
        .then(res => {
          return res.json();
        })
        .then(json => {
          var UserExist = json.CommonResult.Table[0].Message;
          var UserAddress = json.CommonResult.Table[0].Address;
          var UserFirstname = json.CommonResult.Table[0].FirstName;
          var UserLastname = json.CommonResult.Table[0].LastName;
          var UserEmail = json.CommonResult.Table[0].Email;
          var UserCity = json.CommonResult.Table[0].City;

          if (UserExist === 'Success') {
            const items = [
              ['firstname', UserFirstname],
              ['lastname', UserLastname],
              ['email', UserEmail],
              ['phonenumber', mobilenumber],
              ['address', UserAddress],
              ['city', UserCity],
              ['EditStatus', 'false'],
            ];

            AsyncStorage.multiSet(items, () => {
              setRegister(false);
              dispatch({ Type: 'LOGIN', Token: mobilenumber });
            });
          } else {
            dispatch({ Type: 'RETREIVE_TOKEN', Token: null });
          }
        })
        .catch(er => {
          console.log('Login User Exist Error', er);
          Alert.alert(
            'Warning',
            "The operation couldn't be completed.",
            [
              {
                text: 'Try Again',
                onPress: () => CheckUserExist(mobilenumber),
              },
              {
                text: 'Close',
                onPress: () => BackHandler.exitApp(),
              },
            ],
            { cancelable: false },
          );
        })
        .finally(() => {
          setTimeout(() => {
            SplashScreen.hide();
          }, 1000);
        });
    });
  };

  const RegisterUser = async (
    firstname,
    lastname,
    mobilenumber,
    email,
    address,
    city,
  ) => {
    AsyncStorage.getItem('fcmToken').then(FCMToken => {
      console.log(FCMToken);

      fetch(APIURL, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify({
          HasReturnData: 'T',
          Parameters: [
            {
              Para_Data: '88',
              Para_Direction: 'Input',
              Para_Lenth: 10,
              Para_Name: '@Iid',
              Para_Type: 'int',
            },
            {
              Para_Data: mobilenumber,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text1',
              Para_Type: 'varchar',
            },
            {
              Para_Data: firstname,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text2',
              Para_Type: 'varchar',
            },
            {
              Para_Data: lastname,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text3',
              Para_Type: 'varchar',
            },
            {
              Para_Data: email,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text4',
              Para_Type: 'varchar',
            },
            {
              Para_Data: address,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text5',
              Para_Type: 'varchar',
            },
            {
              Para_Data: city,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text6',
              Para_Type: 'varchar',
            },
            {
              Para_Data: FCMToken,
              Para_Direction: 'Input',
              Para_Lenth: 50000,
              Para_Name: '@Text7',
              Para_Type: 'varchar',
            },
          ],
          SpName: 'sp_Android_Common_API',
          con: '1',
        }),
      })
        .then(res => {
          return res.json();
        })
        .then(json => {
          var UserExist = json.CommonResult.Table[0].Message;

          if (UserExist === 'Success') {
            sendEmail(email, firstname);

            const items = [
              ['firstname', firstname],
              ['lastname', lastname],
              ['email', email],
              ['phonenumber', mobilenumber],
              ['address', address],
              ['city', city],
              ['EditStatus', 'false'],
            ];

            AsyncStorage.multiSet(items, () => {
              setRegister(false);
              dispatch({ Type: 'LOGIN', Token: mobilenumber });
            });
          } else {
            setRegister(false);
            Alert.alert(
              'Warning',
              'Something went wrong. User Registration failed',
              [
                {
                  text: 'Try Again',
                  onPress: () =>
                    dispatch({ Type: 'RETREIVE_TOKEN', Token: null }),
                },
              ],
              { cancelable: false },
            );
          }
        })
        .catch(er => {
          console.log('Register User Error', er);
          setRegister(false);
          Alert.alert(
            'Warning',
            "The operation coundn't be completed.",
            [
              {
                text: 'Try Again',
                onPress: () =>
                  RegisterUser(
                    firstname,
                    lastname,
                    mobilenumber,
                    email,
                    address,
                    city,
                  ),
              },
              {
                text: 'Close',
                onPress: () => BackHandler.exitApp(),
              },
            ],
            { cancelable: false },
          );
        });
    });
  };

  const UpdateEmailVerify = async () => {
    var mobilenumber = await AsyncStorage.getItem('phonenumber');
    fetch(APIURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        HasReturnData: 'F',
        Parameters: [
          {
            Para_Data: '105',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: mobilenumber,
            Para_Direction: 'Input',
            Para_Lenth: 50000,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        if (json.strRturnRes) {
          Alert.alert('Alert', 'Congrats Your email has been verified');
        } else {
          Alert.alert('Failure', 'Sorry Your email not verified successfully');
        }
      })
      .catch(er => {
        console.log('UpdateEmailVerify', er);
        Alert.alert(
          'Warning',
          "THe email verify operation coundn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => UpdateEmailVerify(),
            },
            {
              text: 'Close',
              onPress: () => BackHandler.exitApp(),
            },
          ],
          { cancelable: false },
        );
      });
  };

  const CheckUserLogin = async () => {
    let mobilenumber;
    mobilenumber = null;
    mobilenumber = await AsyncStorage.getItem('phonenumber');
    getToken().then(fcmToken => {
      CheckUserExist(mobilenumber);
    });
  };

  const handleBranchLink = params => {
    // Branch passes data in params object
    if (
      params &&
      params.link_url === 'https://cafe007.lk/embilipitiya-cafe007/'
    ) {
      UpdateEmailVerify();
    }
    // You can also check for specific keys you set when creating the link
    if (params && params.action === 'email_verification') {
      UpdateEmailVerify();
    }
  };

  const onNotification_Model_Press = ItemCode => {
    setstate(prevState => ({ ...prevState, isVisible: false }));
    if (ItemCode === 'Menu') {
      navigate('Home', {
        screen: 'HomeScreen',
        params: {},
      });
    } else {
      navigate('Home', {
        screen: 'DashboardScreen',
        params: {
          Location: 'Banner',
          PCode: ItemCode,
        },
      });
    }
  };

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log(
      '[FCMService] onNotificationOpenedApp Notification caused app to open',
    );
    console.log(remoteMessage.data);

    if (remoteMessage) {
      if (remoteMessage.data.OrderID !== undefined) {
        const OrderID = remoteMessage.data.OrderID;
        navigate('Orders', {
          screen: 'OrderDetailsScreen',
          params: { OrderID: OrderID },
        });
      } else if (Platform.OS === 'android') {
        if (remoteMessage.notification.android.imageUrl !== '') {
          setstate(prevState => ({
            ...prevState,
            Type: remoteMessage.data.type,
            Description: remoteMessage.notification.body,
            More_Description: remoteMessage.data.item_description,
            Image: remoteMessage.notification.android.imageUrl,
            ItemCode: remoteMessage.data.item_code,
            isVisible: true,
            isMenuButtonVisible: remoteMessage.data.is_visible_Menu_Button,
          }));

          AsyncStorage.setItem('NID', remoteMessage.data.notification_id);
        } else {
          setstate(prevState => ({ ...prevState, isVisible: false }));
        }
      } else {
        if (remoteMessage.data.fcm_options.image !== '') {
          setstate(prevState => ({
            ...prevState,
            Type: remoteMessage.data.type,
            Description: remoteMessage.notification.body,
            More_Description: remoteMessage.data.item_description,
            Image: remoteMessage.data.fcm_options.image,
            ItemCode: remoteMessage.data.item_code,
            isVisible: true,
            isMenuButtonVisible: remoteMessage.data.is_visible_Menu_Button,
          }));

          AsyncStorage.setItem('NID', remoteMessage.data.notification_id);
        } else {
          setstate(prevState => ({ ...prevState, isVisible: false }));
        }
      }
    }
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        if (remoteMessage.data.OrderID !== undefined) {
          const OrderID = remoteMessage.data.OrderID;
          navigate('Orders', {
            screen: 'OrderDetailsScreen',
            params: { OrderID: OrderID },
          });
        } else if (Platform.OS === 'android') {
          if (remoteMessage.notification.android.imageUrl !== '') {
            setstate(prevState => ({
              ...prevState,
              Type: remoteMessage.data.type,
              Description: remoteMessage.notification.body,
              More_Description: remoteMessage.data.item_description,
              Image: remoteMessage.notification.android.imageUrl,
              ItemCode: remoteMessage.data.item_code,
              isVisible: true,
              isMenuButtonVisible: remoteMessage.data.is_visible_Menu_Button,
            }));

            AsyncStorage.setItem('NID', remoteMessage.data.notification_id);
          } else {
            setstate(prevState => ({ ...prevState, isVisible: false }));
          }
        } else {
          if (remoteMessage.data.fcm_options.image !== '') {
            setTimeout(() => {
              setstate(prevState => ({
                ...prevState,
                Type: remoteMessage.data.type,
                Description: remoteMessage.notification.body,
                More_Description: remoteMessage.data.item_description,
                Image: remoteMessage.data.fcm_options.image,
                ItemCode: remoteMessage.data.item_code,
                isVisible: true,
                isMenuButtonVisible: remoteMessage.data.is_visible_Menu_Button,
              }));

              AsyncStorage.setItem('NID', remoteMessage.data.notification_id);
            }, 1000);
          } else {
            setTimeout(() => {
              setstate(prevState => ({ ...prevState, isVisible: false }));
            }, 1000);
          }
        }
      }
    });

  React.useEffect(() => {
    requestPermission();
    const branchUnsubscribe = branch.subscribe(handleBranchLink);
    registerAppWithFCM();
    CreatSqlitTable();
    CheckAppVersion();

    LocalNotificationService.configure(onNotificationPop);

    function onNotificationPop(notification) {
      console.log('START  onNotificationPop');

      if (notification.data.Status !== undefined) {
        const OrderID = notification.data.OrderID;
        navigate('Orders', {
          screen: 'OrderDetailsScreen',
          params: { OrderID: OrderID },
        });
      } else if (
        notification.bigPictureUrl !== '' ||
        notification.data.fcm_options.image !== ''
      ) {
        setstate(prevState => ({
          ...prevState,
          Type: notification.data.type,
          Description: notification.message,
          More_Description: notification.data.item_description,
          Image:
            Platform.OS === 'android'
              ? notification.bigPictureUrl
              : notification.data.fcm_options.image,
          ItemCode: notification.data.item_code,
          isVisible: true,
          isMenuButtonVisible: notification.data.is_visible_Menu_Button,
        }));
      } else {
        setstate(prevState => ({ ...prevState, isVisible: false }));
      }
    }

    const unsubscribeNotification = messaging().onMessage(
      async remoteMessage => {
        const data = remoteMessage.data;
        if (data.OTP !== undefined) {
          Alert.alert('OTP Verification', data.OTP);
        } else {
          if (Platform.OS === 'ios') {
            LocalNotificationService.localNotification(
              remoteMessage.notification.title,
              remoteMessage.notification.body,
              remoteMessage.data.fcm_options.image,
              remoteMessage.data,
            );
          } else {
            LocalNotificationService.localNotification(
              remoteMessage.notification.title,
              remoteMessage.notification.body,
              remoteMessage.notification.android.imageUrl,
              remoteMessage.data,
            );
          }
        }
      },
    );

    branch.getFirstReferringParams().then(params => {
      if (params && params['+clicked_branch_link']) {
        if (
          params.$canonical_url ===
            'https://cafe007.lk/embilipitiya-cafe007/' ||
          params.$desktop_url === 'https://cafe007.lk/embilipitiya-cafe007/' ||
          params.custom_url === 'https://cafe007.lk/embilipitiya-cafe007/'
        ) {
          UpdateEmailVerify();
        }
      }
    });

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        CheckAppVersion();
      }

      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      branchUnsubscribe();
      unsubscribeNotification();
      LocalNotificationService.unregister();
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onClosePopUp() {
    setstate(prevState => ({ ...prevState, isVisible: false }));
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <SafeAreaView
        edges={['top']}
        style={{ flex: 0, backgroundColor: '#F0F0F0' }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <AuthContext.Provider value={authContext}>
          <StatusBar
            animated={true}
            translucent={false}
            hidden={false}
            barStyle="default"
          />

          <NavigationContainer ref={navigationRef}>
            <Provider store={store}>
              <RootStack.Navigator>
                {loginstate.userToken == null ? (
                  <RootStack.Screen
                    key="auth-screen"
                    name="Auth"
                    options={{ headerShown: false }}
                  >
                    {() => (
                      <AuthStackNavigation
                        isClick={isClick}
                        isVisible={isOTPVisible}
                        OTPNotification={OtpNotification}
                        isLoading={isRegister}
                        isUpdated={isUpdated}
                      />
                    )}
                  </RootStack.Screen>
                ) : (
                  <RootStack.Screen
                    key="app-screen"
                    name="App"
                    options={{ headerShown: false }}
                    component={BottomTabNavigation}
                  />
                )}
              </RootStack.Navigator>
            </Provider>
            {loginstate.userToken && (
              <PromoCard
                visible={showPromo}
                onDismiss={handleDismissPromo}
                onMoreOptions={handleMoreOptions}
              />
            )}
          </NavigationContainer>
        </AuthContext.Provider>
        <NotificationModal
          type={state.Type}
          description={state.Description}
          more_description={state.More_Description}
          isMenuButtonVisible={state.isMenuButtonVisible}
          itemCode={state.ItemCode}
          image={state.Image}
          visible={state.isVisible}
          onItemPress={data => onNotification_Model_Press(data)}
          onClosePress={() => onClosePopUp()}
          onMenuPress={data => onNotification_Model_Press(data)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;
