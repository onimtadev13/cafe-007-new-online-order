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
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import * as ImagePicker from 'react-native-image-picker';
// import IonicIcon from 'react-native-vector-icons/Ionicons';
import {openDatabase} from 'react-native-sqlite-storage';
import RBSheet from 'react-native-raw-bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppContext from '../Components/Context';
import {connect} from 'react-redux';
import {CommonActions} from '@react-navigation/routers';
import {APIURL} from '../Data/CloneData';
// import dynamicLinks from '@react-native-firebase/dynamic-links';
import branch from 'react-native-branch';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';


const Tab = createMaterialTopTabNavigator();
var db = openDatabase({name: 'UserDatabase.db'});

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
      isLoading: true, // Changed "true"
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
    // this.unsubscribe = dynamicLinks().onLink(this.handleDynamicLink);
    this.branchUnsubscribe = branch.subscribe(this.handleBranchLink);
  }

  componentWillUnmount() {
    // this.unsubscribe();
    if (this.branchUnsubscribe) {
    this.branchUnsubscribe();
  }
  }

  fadeIn = () => {
    // Will change fadeAnim value to 1 in 5 seconds
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  fadeOut = () => {
    // Will change fadeAnim value to 0 in 3 seconds
    Animated.timing(this.state.fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // handleDynamicLink = link => {
  //   // Handle dynamic link inside your own application
  //   if (link.url === 'https://cafe007.lk/embilipitiya-cafe007/') {
  //     // ...navigate to your offers screen
  //     this.CheckUserLog();
  //   }
  // };

  handleBranchLink = (params) => {
  console.log('Branch link params:', params);
  
  // Check if this is a clicked branch link
  if (params && params['+clicked_branch_link']) {
    // Handle your specific email verification link
    if (params.$canonical_url === 'https://cafe007.lk/embilipitiya-cafe007/' || 
        params.$desktop_url === 'https://cafe007.lk/embilipitiya-cafe007/' ||
        params.custom_url === 'https://cafe007.lk/embilipitiya-cafe007/') {
      this.CheckUserLog();
    }
    
    // You can add more link handling logic here
    // For example: navigate to specific screens based on link parameters
    if (params.action === 'profile_update') {
      this.CheckUserLog();
    }
  }
};

  chooseImage = () => {
    this.RBSheet.close();
    ImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        maxHeight: 200,
        maxWidth: 200,
      },
      response => {
        if (response.didCancel) {
          if (this.state.fileData === null) {
            this.setState({fileData: null});
          }
        } else {
          this.onUploadImage(response.base64);
        }
      },
    );
  };

  takePhoto = () => {
    this.RBSheet.close();
    ImagePicker.launchCamera(
      {
        cameraType: 'front',
        mediaType: 'photo',
        includeBase64: true,
        maxHeight: 200,
        maxWidth: 200,
      },
      response => {
        if (response.didCancel) {
          if (this.state.fileData === null) {
            this.setState({fileData: null});
          }
        } else {
          this.onUploadImage(response.base64);
        }
      },
    );
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
      .then(res => {
        return res.json();
      })
      .then(json => {
        if (json.strRturnRes) {
          this.setState({fileData: Image});
        }
      });
  };

  onEditablePress = () => {
    let {Firstname, Lastname, phonenumber, email} = this.state;
    if (this.state.editable) {
      this.setState({editable: false});
      console.log(Firstname, Lastname, phonenumber, email);
    } else {
      this.setState({editable: true});
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
          this.setState({cardlist: temp});
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
      this.setState({userlog: number, isLoading: false});
    } else {
      this.setState({userlog: number}, () => {
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
      .then(res => {
        return res.json();
      })
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
          }}>
          <Image
            source={imageuri}
            style={{height: 35}}
            resizeMode={'contain'}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontFamily:
                Platform.OS === 'ios'
                  ? 'Asap-Regular_SemiBold'
                  : 'AsapSemiBold',
              marginLeft: 15,
            }}>
            {cardtype}
          </Text>
          <TouchableOpacity
            onPress={() => this.onDeleteCardPress(item.card_number)}>
            {/* <IonicIcon name="trash-outline" size={25} /> */}
            <FontAwesome6 name="trash" size={25} solid />

          </TouchableOpacity>
        </View>
      );
    });
  }

  CheckSign = async () => {
    this.context.CheckSign();
    // Promise.all([
    //     this.props.navigation.dispatch(
    //         CommonActions.reset({
    //             index: 0,
    //             routes: [{ name: "Home" }],
    //         })
    //     )
    // ]).then(() => { this.context.CheckSign() })
  };

  logout = () => {
    // Promise.all([
    //     this.props.navigation.dispatch(
    //         CommonActions.reset({
    //             index: 0,
    //             routes: [{ name: "auth" }],
    //         })
    //     )
    // ]).then(() => {
    //     this.props.resetCart();
    // }).then(() => {

    // this.RBSettingsSheet.close();
    this.props.resetCart();
    setTimeout(() => {
      this.context.logout();
    }, 180);
    // })
  };

  render() {
    const HomeScreen = () => {
      return (
        <ScrollView style={{flex: 1}}>
          <View style={{marginLeft: 30, marginRight: 30, marginTop: 10}}>
            {/* <Button title="Sign out" onPress={() => this.logout()} /> */}
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 19,
                margin: 10,
              }}>
              First name
            </Text>
            <TouchableOpacity
              style={{flex: 1}}
              onPress={() =>
                this.onTextInputPress(this.state.Firstname, 'First name')
              }>
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#e8e8e8',
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'black',
                    margin: 10,
                    paddingLeft: 5,
                  }}>
                  {this.state.Firstname}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{marginLeft: 30, marginRight: 30}}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 19,
                margin: 10,
              }}>
              Last name
            </Text>
            <TouchableOpacity
              style={{flex: 1}}
              onPress={() =>
                this.onTextInputPress(this.state.Lastname, 'Last name')
              }>
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#e8e8e8',
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'black',
                    margin: 10,
                    paddingLeft: 5,
                  }}>
                  {this.state.Lastname}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{marginLeft: 30, marginTop: 15, marginRight: 30}}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 19,
                margin: 10,
              }}>
              Phone Number
            </Text>
            <View
              style={{
                flexDirection: 'row',
                borderRadius: 5,
                backgroundColor: '#e8e8e8',
                borderColor: '#dbdbdb',
                borderWidth: 1,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 19,
                  marginLeft: 15,
                }}>
                +94
              </Text>
              <View
                style={{
                  borderLeftWidth: 1,
                  height: 20,
                  backgroundColor: '#ededed',
                  marginLeft: 10,
                }}
              />
              <TouchableOpacity
                style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}
                onPress={() =>
                  this.onTextInputPress(this.state.phonenumber, 'Phone Number')
                }>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    margin: 10,
                    color: 'black',
                  }}>
                  {this.state.phonenumber}
                </Text>

                <Text
                  style={{
                    marginRight: 10,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: this.state.number_verified ? '#4dd91e' : '#FF6900',
                  }}>
                  {this.state.number_verified ? 'Verified' : 'Unverified'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{marginLeft: 30, marginTop: 15, marginRight: 30}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  fontSize: 19,
                  margin: 10,
                  paddingLeft: 5,
                }}>
                Email
              </Text>
              {this.state.email_verified !== '' ? (
                <Text
                  style={{
                    marginRight: 10,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: this.state.email_verified ? '#4dd91e' : '#FF6900',
                  }}>
                  {this.state.email_verified ? 'Verified' : 'Unverified'}
                </Text>
              ) : null}
            </View>

            <View
              style={{
                flexDirection: 'row',
                borderRadius: 5,
                backgroundColor: '#e8e8e8',
                borderColor: '#dbdbdb',
                borderWidth: 1,
                alignItems: 'center',
              }}>
              <TouchableOpacity
                style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}
                onPress={() =>
                  this.onTextInputPress(this.state.email, 'Email')
                }>
                <Text
                  style={{
                    flex: 1,
                    margin: 10,
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'black',
                  }}>
                  {this.state.email}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{marginLeft: 30, marginTop: 15, marginRight: 30}}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 19,
                margin: 10,
                paddingLeft: 5,
              }}>
              Address
            </Text>
            <TouchableOpacity
              style={{flex: 1}}
              onPress={() =>
                this.onTextInputPress(this.state.address, 'Address')
              }>
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#e8e8e8',
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'black',
                    margin: 10,
                  }}>
                  {this.state.address}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{marginLeft: 30, marginRight: 30, marginTop: 15}}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 19,
                margin: 10,
              }}>
              City
            </Text>
            <TouchableOpacity
              style={{flex: 1}}
              onPress={() => this.onTextInputPress(this.state.city, 'City')}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#e8e8e8',
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'black',
                    margin: 10,
                    paddingLeft: 5,
                  }}>
                  {this.state.city}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginLeft: 30,
              marginRight: 30,
              marginTop: 15,
              marginBottom: 30,
              flexDirection: 'row',
            }}>
            <TouchableOpacity
              style={{flex: 1, marginRight: 10}}
              onPress={() => this.logout()}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'black',
                  borderRadius: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'white',
                    margin: 10,
                    paddingLeft: 5,
                  }}>
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{flex: 1, marginLeft: 10}}
              onPress={() => {
                Alert.alert(
                  'Alert',
                  'Do You Want To Delete Your Account ?',
                  [
                    {
                      text: 'YES',
                      onPress: () => this.deactivate_account(),
                    },
                    {text: 'NO'},
                  ],
                  {cancelable: false},
                );
              }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'red',
                  borderRadius: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'white',
                    margin: 10,
                    paddingLeft: 5,
                  }}>
                  Delete
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/*<View*/}
          {/*    style={{marginLeft: 30, marginRight: 30, marginTop: 15, marginBottom: 30}}>*/}
          {/*    <TouchableOpacity style={{flex: 1}}*/}
          {/*                      onPress={() => {*/}

          {/*                          Alert.alert(*/}
          {/*                              'Alert',*/}
          {/*                              'Do You Want To Deactivate Your Account ?',*/}
          {/*                              [*/}
          {/*                                  {*/}
          {/*                                      text: 'YES',*/}
          {/*                                      onPress: () => this.deactivate_account(),*/}
          {/*                                  }, {text: 'NO'},*/}
          {/*                              ],*/}
          {/*                              {cancelable: false}*/}
          {/*                          );*/}

          {/*                      }}>*/}
          {/*        <View style={{*/}
          {/*            flex: 1,*/}
          {/*            backgroundColor: 'red',*/}
          {/*            borderRadius: 5,*/}
          {/*            justifyContent: 'center',*/}
          {/*            alignItems: 'center'*/}
          {/*        }}>*/}
          {/*            <Text style={{*/}
          {/*                fontSize: 18,*/}
          {/*                fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Medium' : 'AsapMedium',*/}
          {/*                color: 'white',*/}
          {/*                margin: 10,*/}
          {/*                paddingLeft: 5*/}
          {/*            }}>DEACTIVATE</Text>*/}
          {/*        </View>*/}

          {/*    </TouchableOpacity>*/}
          {/*</View>*/}
        </ScrollView>
      );
    };

    const SettingsScreen = () => {
      return (
        <View style={{flex: 1}}>
          <View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                color: 'black',
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 16,
              }}>
              Coming soon
            </Text>
          </View>
          <Animated.View>{this.renderCard()}</Animated.View>
          <View style={{margin: 10, marginTop: 20}}>
            <TouchableOpacity
              disabled={true}
              onPress={() =>
                this.props.navigation.navigate('CreditCardScreen')
              }>
              <View
                style={{
                  flexDirection: 'row',
                  margin: 10,
                  alignItems: 'center',
                }}>
                {/* <IonicIcon name="add-circle" size={30} color={'#d1d1d1'} /> */}
                <FontAwesome6 name="circle-plus" size={30} color="#d1d1d1" solid />
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
                  }}>
                  Add Credit or Debit card
                </Text>
                {/* <IonicIcon name="chevron-forward" size={30} color={'#d1d1d1'} /> */}
                <FontAwesome6 name="chevron-right" size={30} color="#d1d1d1" solid />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    if (this.state.isLoading) {
      return (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator
            animating={this.state.isLoading}
            size="large"
            color="black"
          />
        </View>
      );
    } else {
      return (
        <Animated.View style={[{flex: 1}, {opacity: this.state.fadeAnim}]}>
          <View style={{flex: 1}}>
            {this.state.userlog === null ? (
              <View style={{flex: 1}}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_SemiBold'
                        : 'AsapSemiBold',
                    fontSize: 20,
                    margin: 30,
                    marginTop: 20,
                    alignSelf: 'center',
                  }}>
                  Profile
                </Text>
                <View style={{justifyContent: 'center', flex: 1}}>
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      fontSize: 24,
                      textAlign: 'center',
                    }}>
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
                    }}>
                    Register to access all the features of our service. Eat,
                    drink and live free.{' '}
                  </Text>
                  <TouchableOpacity
                    style={{
                      alignItems: 'center',
                      marginTop: 10,
                      marginLeft: 40,
                      marginRight: 40,
                      marginBottom: 30,
                    }}
                    onPress={() => this.CheckSign()}>
                    <View
                      style={{
                        width: '40%',
                        height: 50,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'black',
                        borderRadius: 50,
                      }}>
                      <Text
                        style={{
                          color: 'white',
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_Medium'
                              : 'AsapMedium',
                          fontSize: 18,
                        }}>
                        Sign in
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View
                  style={{
                    flex: 0.5,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e3e3e3',
                  }}>
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
                          {backgroundColor: 'rgba(0,0,0,0.4)'},
                        ]}
                      />
                    </>
                  ) : null}
                  {/* <View style={[StyleSheet.absoluteFillObject, { alignItems: 'flex-end', margin: 10, marginTop: 20 }]}>
                                            <TouchableOpacity onPress={() => this.RBSettingsSheet.open()} >
                                                <IonicIcon name="ellipsis-vertical-outline" size={25} color={this.state.fileData === null ? 'black' : 'white'} />
                                            </TouchableOpacity>
                                        </View> */}
                  <View
                    style={{
                      height: this.state.fileData === null ? 80 : 85,
                      width: this.state.fileData === null ? 80 : 85,
                      borderRadius:
                        this.state.fileData === null ? 80 / 2 : 85 / 2,
                      borderColor:
                        this.state.fileData === null ? 'black' : 'white',
                      borderWidth: 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
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
                        borderRadius:
                          this.state.fileData === null ? null : 80 / 2,
                      }}
                    />
                  </View>
                  <View style={{marginLeft: 20}}>
                    <Text
                      style={{
                        color: this.state.fileData === null ? 'black' : 'white',
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_Bold'
                            : 'AsapBold',
                        fontSize: 20,
                      }}>
                      {this.state.Firstname} {this.state.Lastname}
                    </Text>
                    <Text
                      style={{
                        color: this.state.fileData === null ? 'black' : 'white',
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_Medium'
                            : 'AsapMedium',
                        fontSize: 16,
                        textTransform: 'lowercase',
                      }}>
                      @{this.state.Firstname}
                      {this.state.Lastname}
                    </Text>
                    <TouchableOpacity
                      style={{marginTop: 5}}
                      onPress={() => this.RBSheet.open()}>
                      <View
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'black',
                          borderRadius: 5,
                          borderColor:
                            this.state.fileData === null ? 'black' : 'white',
                          borderWidth: 1,
                        }}>
                        <Text
                          style={{
                            paddingLeft: 15,
                            paddingRight: 15,
                            paddingBottom: 5,
                            paddingTop: 5,
                            color: 'white',
                            fontFamily:
                              Platform.OS === 'ios'
                                ? 'Asap-Regular'
                                : 'AsapRegular',
                            fontSize: 16,
                          }}>
                          Edit profile image
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
                <Tab.Navigator
                  tabBarOptions={{
                    labelStyle: {
                      fontSize: 16,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                    },
                    indicatorStyle: {backgroundColor: 'black'},
                    style: {backgroundColor: 'transparent'},
                  }}>
                  <Tab.Screen name="Personal info" children={HomeScreen} />
                  <Tab.Screen name="Wallet" children={SettingsScreen} />
                </Tab.Navigator>
              </>
            )}
          </View>

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
              // wrapper: {
              //     backgroundColor: "transparent"
              // },
              draggableIcon: {
                backgroundColor: '#000',
              },
            }}>
            <View style={{flex: 1}}>
              <Text
                style={{
                  margin: 10,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 18,
                  color: 'black',
                  alignSelf: 'center',
                }}>
                Select a photo
              </Text>
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 5,
                }}
                onPress={() => this.takePhoto()}>
                <View
                  style={{
                    width: '90%',
                    height: 45,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'black',
                    borderRadius: 5,
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                      fontSize: 18,
                    }}>
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
                onPress={() => this.chooseImage()}>
                <View
                  style={{
                    width: '90%',
                    height: 45,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'black',
                    borderRadius: 5,
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                      fontSize: 18,
                    }}>
                    Choose from library
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </RBSheet>

          {/* <RBSheet
                        animationType={'fade'}
                        ref={ref => {
                            this.RBSettingsSheet = ref;
                        }}
                        height={140}
                        openDuration={500}
                        closeOnDragDown={true}
                        closeOnPressMask={true}
                        customStyles={{
                            // wrapper: {
                            //     backgroundColor: "transparent"
                            // },
                            draggableIcon: {
                                backgroundColor: "#000"
                            }
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={{ margin: 10, fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 18, color: 'black', alignSelf: 'center' }}>Settings</Text>
                            <TouchableOpacity style={{ alignItems: 'center', justifyContent: 'center', margin: 5 }} onPress={() => this.logout()}>
                                <View style={{ width: "90%", height: 45, alignItems: 'center', justifyContent: 'center', backgroundColor: 'black', borderRadius: 5 }}>
                                    <Text style={{ color: 'white', fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Medium' : 'AsapMedium', fontSize: 18 }}>Sign out</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </RBSheet> */}
        </Animated.View>
      );
    }
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
      .then(res => {
        return res.json();
      })
      .then(json => {
        console.log(json.CommonResult.Table[0].Val + '   val');

        if (json.CommonResult.Table[0].Val === 'T') {
          this.logout();
        }
      });
  };
}

const mapDispatchToProps = dispatch => {
  return {
    resetCart: () => dispatch({type: 'RESET_CART'}),
  };
};

export default connect(null, mapDispatchToProps)(AccountScreen);
