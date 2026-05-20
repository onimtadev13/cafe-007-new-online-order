import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Button,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import * as ImagePicker from 'react-native-image-picker';
import { openDatabase } from 'react-native-sqlite-storage';
import RBSheet from 'react-native-raw-bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppContext from '../Components/Context';
import { connect } from 'react-redux';
import { CommonActions } from '@react-navigation/routers';
import { APIURL } from '../Data/CloneData';
import branch from 'react-native-branch';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { withTheme } from '../Context/ThemeContext';
import ThemeToggle from '../Components/ThemeToggle';

const Tab = createMaterialTopTabNavigator();
var db = openDatabase({ name: 'UserDatabase.db' });

class AccountScreen extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(0),
      fileData: null,
      editable: false,
      Firstname: '',
      Lastname: '',
      phonenumber: '',
      email: '',
      address: '',
      city: '',
      cardlist: [],
      email_verified: false,
      number_verified: false,
      userlog: null,
      logstatus: false,
      isLoading: true,
    };
  }

  componentDidMount() {
    this._unsubscribe = this.props.navigation.addListener('focus', async () => {
      this.fadeIn();
      this.GetRegisterdCreditCard();
      var status = await AsyncStorage.getItem('EditStatus');
      if (status === 'true') {
        AsyncStorage.setItem('EditStatus', 'false');
        this.CheckUserLog();
      }
    });
    this._unsubscribe = this.props.navigation.addListener('blur', async () => {
      this.fadeOut();
    });
    AsyncStorage.setItem('EditStatus', 'false');
    this.CheckUserLog();
    this.branchUnsubscribe = branch.subscribe(this.handleBranchLink);
    if (Platform.OS === 'ios') {
      console.log('iOS Platform detected');
    }
  }

  componentWillUnmount() {
    if (this.branchUnsubscribe) {
      this.branchUnsubscribe();
    }
  }

  fadeIn = () => {
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  fadeOut = () => {
    Animated.timing(this.state.fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  handleBranchLink = params => {
    console.log('Branch link params:', params);
    if (params && params['+clicked_branch_link']) {
      if (
        params.$canonical_url === 'https://cafe007.lk/embilipitiya-cafe007/' ||
        params.$desktop_url === 'https://cafe007.lk/embilipitiya-cafe007/' ||
        params.custom_url === 'https://cafe007.lk/embilipitiya-cafe007/'
      ) {
        this.CheckUserLog();
      }
      if (params.action === 'profile_update') {
        this.CheckUserLog();
      }
    }
  };

  takePhoto = () => {
    this.RBSheet.close();
    setTimeout(() => {
      const options = {
        cameraType: 'front',
        mediaType: 'photo',
        includeBase64: true,
        maxHeight: 200,
        maxWidth: 200,
        quality: 0.8,
        saveToPhotos: false,
        presentationStyle: 'fullScreen',
      };
      ImagePicker.launchCamera(options, response => {
        console.log('Camera Response:', response);
        if (response.didCancel) {
          console.log('User cancelled camera');
          this.setState({ isLoading: false });
          return;
        }
        if (response.errorCode) {
          console.log('Camera Error:', response.errorCode);
          this.setState({ isLoading: false });
          let errorMessage = 'Failed to take photo';
          if (response.errorCode === 'permission') {
            errorMessage = 'Please grant camera access in Settings';
            Alert.alert(
              'Camera Permission Required',
              'Go to Settings > Cafe_007 > Camera and enable access',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          } else if (response.errorCode === 'camera_unavailable') {
            errorMessage = 'Camera is not available';
            Alert.alert('Error', errorMessage);
          } else {
            Alert.alert('Error', response.errorMessage || errorMessage);
          }
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (asset.base64) {
            this.setState({ isLoading: false });
            this.onUploadImage(asset.base64);
          } else {
            this.setState({ isLoading: false });
            Alert.alert('Error', 'Failed to process photo');
          }
        }
      });
    }, 500);
  };

  chooseImage = () => {
    this.RBSheet.close();
    setTimeout(() => {
      const options = {
        mediaType: 'photo',
        includeBase64: true,
        maxHeight: 200,
        maxWidth: 200,
        quality: 0.8,
        selectionLimit: 1,
        presentationStyle: 'fullScreen',
      };
      ImagePicker.launchImageLibrary(options, response => {
        console.log('Gallery Response:', response);
        if (response.didCancel) {
          console.log('User cancelled image picker');
          this.setState({ isLoading: false });
          return;
        }
        if (response.errorCode) {
          console.log('Gallery Error:', response.errorCode);
          this.setState({ isLoading: false });
          if (response.errorCode === 'permission') {
            Alert.alert(
              'Photo Library Permission Required',
              'Go to Settings > Cafe_007 > Photos and enable access',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => Linking.openSettings(),
                },
              ],
            );
          } else {
            Alert.alert(
              'Error',
              response.errorMessage || 'Failed to pick image',
            );
          }
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          if (asset.base64) {
            this.setState({ isLoading: false });
            this.onUploadImage(asset.base64);
          } else {
            this.setState({ isLoading: false });
            Alert.alert('Error', 'Failed to process image');
          }
        }
      });
    }, 500);
  };

  onUploadImage = Image => {
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
            Para_Data: '95',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: Image,
            Para_Direction: 'Input',
            Para_Lenth: 50000,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: this.state.phonenumber,
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
      .then(res => res.json())
      .then(json => {
        if (json.strRturnRes) {
          this.setState({ fileData: Image });
        }
      });
  };

  onEditablePress = () => {
    let { Firstname, Lastname, phonenumber, email } = this.state;
    if (this.state.editable) {
      this.setState({ editable: false });
      console.log(Firstname, Lastname, phonenumber, email);
    } else {
      this.setState({ editable: true });
    }
  };

  GetRegisterdCreditCard = async () => {
    var userID = await AsyncStorage.getItem('phonenumber');
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM credit_card where userID = ?',
        [userID],
        (tx, results) => {
          var temp = [];
          for (let i = 0; i < results.rows.length; ++i) {
            temp.push(results.rows.item(i));
          }
          this.setState({ cardlist: temp });
        },
      );
    });
  };

  onDeleteCardPress = CardNumber => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM  credit_card where card_number=?',
        [CardNumber],
        (tx, results) => {
          console.log('Results', results.rowsAffected);
          if (results.rowsAffected > 0) {
            Alert.alert('Success', 'User deleted successfully');
            this.GetRegisterdCreditCard();
          } else {
            alert('Please insert a valid User Id');
          }
        },
      );
    });
  };

  onTextInputPress = (Name, title) => {
    this.props.navigation.navigate('EditInfoScreen', {
      Value: Name,
      Title: title,
    });
  };

  CheckUserLog = async () => {
    let number = null;
    number = await AsyncStorage.getItem('phonenumber');
    if (number === null) {
      this.setState({ userlog: number, isLoading: false });
    } else {
      this.setState({ userlog: number }, () => {
        this.GetPersonalInfo();
      });
    }
  };

  GetPersonalInfo = async () => {
    var mobilenumber = await AsyncStorage.getItem('phonenumber');
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
            Para_Data: '93',
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
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    })
      .then(res => res.json())
      .then(json => {
        this.setState({
          Firstname: json.CommonResult.Table[0].FirstName,
          Lastname: json.CommonResult.Table[0].LastName,
          phonenumber: json.CommonResult.Table[0].Mobile,
          email: json.CommonResult.Table[0].Email,
          number_verified: json.CommonResult.Table[0].MobileVerified,
          email_verified: json.CommonResult.Table[0].EmailVerified,
          address: json.CommonResult.Table[0].Address,
          city: json.CommonResult.Table[0].City,
          fileData: json.CommonResult.Table[0].Img,
          isLoading: false,
        });
      });
  };

  renderCard() {
    const { theme } = this.props;
    return this.state.cardlist.map((item, index) => {
      let imageuri = '';
      let cardtype = '';
      switch (item.card_type) {
        case 'visa':
          imageuri = require('../assets/cardicon/stp_card_visa.png');
          cardtype = 'Visa';
          break;
        case 'master-card':
          imageuri = require('../assets/cardicon/stp_card_mastercard.png');
          cardtype = 'Master card';
          break;
        case 'american-express':
          imageuri = require('../assets/cardicon/stp_card_amex.png');
          cardtype = 'American Express';
          break;
        case 'diners-club':
          imageuri = require('../assets/cardicon/stp_card_diners.png');
          cardtype = 'Diners Club';
          break;
        case 'discover':
          imageuri = require('../assets/cardicon/stp_card_discover.png');
          cardtype = 'Discover';
          break;
        case 'jcb':
          imageuri = require('../assets/cardicon/stp_card_jcb.png');
          cardtype = 'JCB';
          break;
        default:
          break;
      }
      return (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 20,
            marginRight: 20,
          }}
        >
          <Image
            source={imageuri}
            style={{ height: 35 }}
            resizeMode={'contain'}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              marginLeft: 15,
              fontFamily:
                Platform.OS === 'ios'
                  ? 'Asap-Regular_SemiBold'
                  : 'AsapSemiBold',
              color: theme.text, // ← NEW
            }}
          >
            {cardtype}
          </Text>
          <TouchableOpacity
            onPress={() => this.onDeleteCardPress(item.card_number)}
          >
            <FontAwesome6 name="trash" size={25} solid color={theme.text} />{' '}
            {/* ← NEW */}
          </TouchableOpacity>
        </View>
      );
    });
  }

  CheckSign = async () => {
    this.context.CheckSign();
  };

  logout = () => {
    this.props.resetCart();
    setTimeout(() => {
      this.context.logout();
    }, 180);
  };

  render() {
    const { theme } = this.props; // single destructure at top of render

    // ── Input field style — reused across all form fields ──────────────────
    const inputContainer = {
      flex: 1,
      backgroundColor: theme.inputBg,
      borderRadius: 5,
      borderColor: theme.inputBorder,
      borderWidth: 1,
      justifyContent: 'center',
    };
    const inputText = {
      fontSize: 18,
      fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
      color: theme.text,
      margin: 10,
    };
    const labelText = {
      fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
      fontSize: 19,
      margin: 10,
      color: theme.text,
    };

    // ── Tab screens defined inside render so they close over `theme` ───────
    const HomeScreen = () => {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.bg }}>
          {' '}
          {/* ← NEW bg */}
          {/* First name */}
          <View style={{ marginLeft: 30, marginRight: 30, marginTop: 10 }}>
            <Text style={labelText}>First name</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                this.onTextInputPress(this.state.Firstname, 'First name')
              }
            >
              <View style={inputContainer}>
                <Text style={[inputText, { paddingLeft: 5 }]}>
                  {this.state.Firstname}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* Last name */}
          <View style={{ marginLeft: 30, marginRight: 30 }}>
            <Text style={labelText}>Last name</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                this.onTextInputPress(this.state.Lastname, 'Last name')
              }
            >
              <View style={inputContainer}>
                <Text style={inputText}>{this.state.Lastname}</Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* Phone number */}
          <View style={{ marginLeft: 30, marginTop: 15, marginRight: 30 }}>
            <Text style={labelText}>Phone Number</Text>
            <View
              style={{
                flexDirection: 'row',
                borderRadius: 5,
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                borderWidth: 1,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 19,
                  marginLeft: 15,
                  color: theme.text,
                }}
              >
                +94
              </Text>
              <View
                style={{
                  borderLeftWidth: 1,
                  height: 20,
                  backgroundColor: theme.separator,
                  marginLeft: 10,
                }}
              />
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                onPress={() =>
                  this.onTextInputPress(this.state.phonenumber, 'Phone Number')
                }
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 18,
                    margin: 10,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: theme.text,
                  }}
                >
                  {this.state.phonenumber}
                </Text>
                <Text
                  style={{
                    marginRight: 10,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: this.state.number_verified ? '#4dd91e' : '#FF6900', // keep status colours
                  }}
                >
                  {this.state.number_verified ? 'Verified' : 'Unverified'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Email */}
          <View style={{ marginLeft: 30, marginTop: 15, marginRight: 30 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[labelText, { flex: 1 }]}>Email</Text>
              {this.state.email_verified !== '' ? (
                <Text
                  style={{
                    marginRight: 10,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: this.state.email_verified ? '#4dd91e' : '#FF6900', // keep status colours
                  }}
                >
                  {this.state.email_verified ? 'Verified' : 'Unverified'}
                </Text>
              ) : null}
            </View>
            <View
              style={{
                flexDirection: 'row',
                borderRadius: 5,
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
                borderWidth: 1,
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => this.onTextInputPress(this.state.email, 'Email')}
              >
                <Text
                  style={{
                    flex: 1,
                    margin: 10,
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: theme.text,
                  }}
                >
                  {this.state.email}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {/* Address */}
          <View style={{ marginLeft: 30, marginTop: 15, marginRight: 30 }}>
            <Text style={[labelText, { paddingLeft: 5 }]}>Address</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                this.onTextInputPress(this.state.address, 'Address')
              }
            >
              <View style={inputContainer}>
                <Text style={inputText}>{this.state.address}</Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* City */}
          <View style={{ marginLeft: 30, marginRight: 30, marginTop: 15 }}>
            <Text style={labelText}>City</Text>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => this.onTextInputPress(this.state.city, 'City')}
            >
              <View style={inputContainer}>
                <Text style={[inputText, { paddingLeft: 5 }]}>
                  {this.state.city}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* Sign Out + Delete row */}
          <View
            style={{
              marginLeft: 30,
              marginRight: 30,
              marginTop: 15,
              marginBottom: 30,
              flexDirection: 'row',
            }}
          >
            <TouchableOpacity
              style={{ flex: 1, marginRight: 10 }}
              onPress={() => this.logout()}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: theme.pill,
                  borderRadius: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    margin: 10,
                    paddingLeft: 5,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: theme.pillText,
                  }}
                >
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, marginLeft: 10 }}
              onPress={() => {
                Alert.alert(
                  'Alert',
                  'Do You Want To Delete Your Account ?',
                  [
                    { text: 'YES', onPress: () => this.deactivate_account() },
                    { text: 'NO' },
                  ],
                  { cancelable: false },
                );
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'red',
                  borderRadius: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    margin: 10,
                    paddingLeft: 5,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'white',
                  }}
                >
                  Delete
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    };

    const SettingsScreen = () => {
      return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 16,
                color: theme.textMuted,
              }}
            >
              Coming soon
            </Text>
          </View>
          <Animated.View>{this.renderCard()}</Animated.View>
          <View style={{ margin: 10, marginTop: 20 }}>
            <TouchableOpacity
              disabled={true}
              onPress={() => this.props.navigation.navigate('CreditCardScreen')}
            >
              <View
                style={{
                  flexDirection: 'row',
                  margin: 10,
                  alignItems: 'center',
                }}
              >
                <FontAwesome6
                  name="circle-plus"
                  size={30}
                  color="#d1d1d1"
                  solid
                />
                <Text
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: '#d1d1d1',
                  }}
                >
                  Add Credit or Debit card
                </Text>
                <FontAwesome6
                  name="chevron-right"
                  size={30}
                  color="#d1d1d1"
                  solid
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    // ── Loading state ────────────────────────────────────────────────────────
    if (this.state.isLoading) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.bg,
          }}
        >
          <ActivityIndicator
            animating={this.state.isLoading}
            size="large"
            color={theme.accent}
          />
        </View>
      );
    }

    // ── Main render ──────────────────────────────────────────────────────────
    return (
      <Animated.View
        style={[
          { flex: 1, backgroundColor: theme.bg },
          { opacity: this.state.fadeAnim },
        ]}
      >
        <View style={{ flex: 1 }}>
          {/* ── Not logged in ── */}
          {this.state.userlog === null ? (
            <View style={{ flex: 1 }}>
              {/* Header row with ThemeToggle — matches Dashboard pattern */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 30,
                  marginTop: 20,
                  marginRight: 16,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_SemiBold'
                        : 'AsapSemiBold',
                    fontSize: 20,
                    color: theme.text,
                  }}
                >
                  Profile
                </Text>
                <ThemeToggle />
              </View>

              <View style={{ justifyContent: 'center', flex: 1 }}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 24,
                    textAlign: 'center',
                    color: theme.text,
                  }}
                >
                  Don't have sign in
                </Text>
                <Text
                  style={{
                    margin: 20,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 17,
                    textAlign: 'center',
                    marginLeft: 40,
                    marginRight: 40,
                    color: theme.textSub,
                  }}
                >
                  Register to access all the features of our service. Eat, drink
                  and live free.
                </Text>
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    marginTop: 10,
                    marginLeft: 40,
                    marginRight: 40,
                    marginBottom: 30,
                  }}
                  onPress={() => this.CheckSign()}
                >
                  <View
                    style={{
                      width: '40%',
                      height: 50,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: theme.pill,
                      borderRadius: 50,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.pillText,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_Medium'
                            : 'AsapMedium',
                        fontSize: 18,
                      }}
                    >
                      Sign in
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // ── Logged in ──
            <>
              {/* Profile banner */}
              <View
                style={{
                  flex: 0.5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.surface,
                }}
              >
                {this.state.fileData !== null ? (
                  <>
                    <Image
                      source={{
                        uri: 'data:image/jpeg;base64,' + this.state.fileData,
                      }}
                      style={[StyleSheet.absoluteFillObject]}
                      resizeMethod={'resize'}
                    />
                    <View
                      style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: 'rgba(0,0,0,0.4)' },
                      ]}
                    />
                  </>
                ) : null}

                {/* ThemeToggle — top-right corner of the banner */}
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      alignItems: 'flex-end',
                      margin: 10,
                      marginTop: 14,
                    },
                  ]}
                >
                  <ThemeToggle />
                </View>

                {/* Avatar */}
                <View
                  style={{
                    height: this.state.fileData === null ? 80 : 85,
                    width: this.state.fileData === null ? 80 : 85,
                    borderRadius: this.state.fileData === null ? 40 : 42.5,
                    borderColor:
                      this.state.fileData === null ? theme.text : 'white',
                    borderWidth: 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    source={
                      this.state.fileData === null
                        ? require('../assets/user.png')
                        : {
                            uri:
                              'data:image/jpeg;base64,' + this.state.fileData,
                          }
                    }
                    style={{
                      height: this.state.fileData === null ? 60 : 80,
                      width: this.state.fileData === null ? 60 : 80,
                      borderRadius: this.state.fileData === null ? null : 40,
                    }}
                  />
                </View>

                {/* Name + edit button */}
                <View style={{ marginLeft: 20 }}>
                  <Text
                    style={{
                      color:
                        this.state.fileData === null ? theme.text : 'white',
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      fontSize: 20,
                    }}
                  >
                    {this.state.Firstname} {this.state.Lastname}
                  </Text>
                  <Text
                    style={{
                      color:
                        this.state.fileData === null ? theme.textSub : 'white',
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                      fontSize: 16,
                      textTransform: 'lowercase',
                    }}
                  >
                    @{this.state.Firstname}
                    {this.state.Lastname}
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 5 }}
                    onPress={() => this.RBSheet.open()}
                  >
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.pill,
                        borderRadius: 5,
                        borderColor:
                          this.state.fileData === null ? theme.pill : 'white',
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        style={{
                          paddingLeft: 15,
                          paddingRight: 15,
                          paddingBottom: 5,
                          paddingTop: 5,
                          color: theme.pillText,
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular'
                              : 'AsapRegular',
                          fontSize: 16,
                        }}
                      >
                        Edit profile image
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tabs */}
              <Tab.Navigator
                screenOptions={{
                  tabBarLabelStyle: {
                    fontSize: 16,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                  },
                  tabBarActiveTintColor: theme.text,
                  tabBarInactiveTintColor: theme.textMuted,
                  tabBarIndicatorStyle: { backgroundColor: theme.accent },
                  tabBarStyle: { backgroundColor: theme.bg },
                }}
              >
                <Tab.Screen name="Personal info" children={HomeScreen} />
                <Tab.Screen name="Wallet" children={SettingsScreen} />
              </Tab.Navigator>
            </>
          )}
        </View>

        {/* ── Photo picker RBSheet ── */}
        <RBSheet
          animationType={'fade'}
          ref={ref => {
            this.RBSheet = ref;
          }}
          height={200}
          openDuration={500}
          closeOnDragDown={true}
          closeOnPressMask={true}
          customStyles={{
            draggableIcon: { backgroundColor: theme.textMuted },
            container: { backgroundColor: theme.card },
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                margin: 10,
                alignSelf: 'center',
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 18,
                color: theme.text,
              }}
            >
              Select a photo
            </Text>

            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                margin: 5,
              }}
              onPress={() => this.takePhoto()}
            >
              <View
                style={{
                  width: '90%',
                  height: 45,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.pill,
                  borderRadius: 5,
                }}
              >
                <Text
                  style={{
                    color: theme.pillText,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 18,
                  }}
                >
                  Take photo
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                margin: 5,
              }}
              onPress={() => this.chooseImage()}
            >
              <View
                style={{
                  width: '90%',
                  height: 45,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.pill,
                  borderRadius: 5,
                }}
              >
                <Text
                  style={{
                    color: theme.pillText,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 18,
                  }}
                >
                  Choose from library
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </RBSheet>
      </Animated.View>
    );
  }

  deactivate_account = async () => {
    console.log('deacc');
    var mobilenumber = await AsyncStorage.getItem('phonenumber');
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
            Para_Data: '117',
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
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    })
      .then(res => res.json())
      .then(json => {
        console.log(json.CommonResult.Table[0].Val + '   val');
        if (json.CommonResult.Table[0].Val === 'T') {
          this.logout();
        }
      });
  };
}

const mapDispatchToProps = dispatch => ({
  resetCart: () => dispatch({ type: 'RESET_CART' }),
});

export default connect(null, mapDispatchToProps)(withTheme(AccountScreen));
