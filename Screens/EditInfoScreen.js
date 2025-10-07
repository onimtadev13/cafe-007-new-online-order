import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {Card} from 'react-native-shadow-cards';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import {openDatabase} from 'react-native-sqlite-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import {APIURL, OTPAPIURL} from '../Data/CloneData';

var db = openDatabase({name: 'UserDatabase.db'});

export default class EditInfoScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      Errors: '',
      Title: this.props.route.params.Title,
      Value: this.props.route.params.Value,
      otp: '',
      code: '',
      isLoading: false,
      isvisible: false,
      isEnable: true,
      second: 30,
    };
    this.touchableInactive = false;
  }

  SaveData = async () => {
    var mobile = await AsyncStorage.getItem('phonenumber');
    var firstname = await AsyncStorage.getItem('firstname');

    if (this.state.Value === '') {
      this.setState({isLoading: false, Errors: 'Filed Empty'});
      this.touchableInactive = false;
    } else {
      if (!this.touchableInactive) {
        this.setState({isLoading: true});
        this.touchableInactive = true;
        switch (this.state.Title) {
          case 'First name':
            this.onUpdateDetails('FirstName', this.state.Value, mobile);
            break;

          case 'Last name':
            this.onUpdateDetails('LastName', this.state.Value, mobile);
            break;

          case 'Phone Number':
            this.isNumberExist(this.state.Value.replace(/^0+/, ''));
            break;

          case 'Email':
            this.isEmailExist(this.state.Value, firstname);
            break;

          case 'Address':
            this.onUpdateDetails('Address', this.state.Value, mobile);
            break;

          case 'City':
            this.onUpdateDetails('City', this.state.Value, mobile);
            break;

          default:
            break;
        }
      }
    }
  };

  onUpdateDetails = (Column, Value, Mobile, firstname) => {
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
            Para_Data: '96',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: Column,
            Para_Direction: 'Input',
            Para_Lenth: 50000,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: Value,
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text2',
            Para_Type: 'varchar',
          },
          {
            Para_Data: Mobile,
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
        if (json.strRturnRes) {
          if (Column === 'FirstName') {
            AsyncStorage.setItem('firstname', this.state.Value);
          } else if (Column === 'LastName') {
            AsyncStorage.setItem('lastname', this.state.Value);
          } else if (Column === 'Address') {
            AsyncStorage.setItem('address', this.state.Value);
          } else if (Column === 'City') {
            AsyncStorage.setItem('city', this.state.Value);
          } else if (Column === 'Mobile') {
            AsyncStorage.setItem(
              'phonenumber',
              this.state.Value.replace(/^0+/, ''),
            );
          } else if (Column === 'Email') {
            AsyncStorage.setItem('email', this.state.Value);
            this.sendEmail(this.state.Value, firstname);
          }
          AsyncStorage.setItem('EditStatus', 'true');
          this.props.navigation.goBack();
        }
      });
  };

  sendEmail(email, firstname) {
    console.log(email, firstname);
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
  }

  onClosePres = () => {
    clearInterval(this.interval);
    this.touchableInactive = false;
    this.setState({
      second: 30,
      isEnable: false,
      isvisible: false,
      isLoading: false,
    });
  };

  onenableResendOTP = () => {
    let s = this.state.second;
    this.setState({isEnable: true});
    this.interval = setInterval(() => {
      s = s - 1;

      if (s < 10) {
        this.setState({second: '0' + s});
      } else {
        this.setState({second: s});
      }

      if (s === 0) {
        this.setState({isEnable: false, second: 30});
        clearInterval(this.interval);
      }
    }, 1000);
  };

  resendOTP = () => {
    let s = this.state.second;
    this.setState({isEnable: true, code: ''});
    this.interval = setInterval(() => {
      s = s - 1;

      if (s < 10) {
        this.setState({second: '0' + s});
      } else {
        this.setState({second: s});
      }

      if (s === 0) {
        this.setState({isEnable: false, second: 30});
        clearInterval(this.interval);
      }
    }, 1000);

    var code = this.generateOTP(4);
    this.setState({otp: code});
    console.log(code);

    fetch(OTPAPIURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        dst: this.state.Value,
        msg: code,
      }),
    });
    this.SaveOTP(this.state.Value, code);
  };

  generateOTP = length => {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  };

  sendSMS(mobilenumber) {
    var code = this.generateOTP(4);
    this.setState({otp: code});
    var message = 'Your one time password is ' + code;

    fetch(
      'http://sms.airtel.lk:5000/sms/send_sms.php?username=cafe_007&password=K9cT4s&src=CAFE%20007&dst=94' +
        mobilenumber +
        '&msg=' +
        message +
        '&dr=1',
      {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-cache',
        },
      },
    );
    this.SaveOTP(mobilenumber, code);
  }

  SaveOTP = (mobilenumber, OTP) => {
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

  continuebuttonPress = async () => {
    const Mobile = await AsyncStorage.getItem('phonenumber');

    if (this.state.otp === this.state.code) {
      this.setState({isvisible: false}, () => {
        clearInterval(this.interval);
        this.onUpdateDetails(
          'Mobile',
          this.state.Value.replace(/^0+/, ''),
          Mobile,
        );
      });
    } else {
      Alert.alert(
        'Warning',
        'The OTP you entered could not be authenticated. Please try again.',
      );
    }
  };

  isNumberExist = mobilenumber => {
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
            Para_Data: '97',
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
        if (json.CommonResult.Table[0].Status === 'true') {
          Alert.alert(
            'Alert',
            'This mobile number all ready exist. Please check your number',
          );
          this.setState({isLoading: false});
        } else {
          this.setState({isvisible: true});
          this.onenableResendOTP();
          this.sendSMS(mobilenumber);
        }
      });
  };

  isEmailExist = async (email, firstname) => {
    const Mobile = await AsyncStorage.getItem('phonenumber');

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
            Para_Data: '98',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: email,
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
        if (json.CommonResult.Table[0].Status === 'true') {
          Alert.alert(
            'Alert',
            'This email address all ready exist. Please try again with new email address',
          );
          this.setState({isLoading: false});
          this.touchableInactive = false;
        } else {
          this.onUpdateDetails('Email', email, Mobile, firstname);
        }
      });
  };

  render() {
    const screenWidth = Dimensions.get('window').width;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS == 'ios' ? 'padding' : null}
        style={{flex: 1}}>
        <View style={{flex: 1}}>
          <TouchableOpacity
            style={{marginTop: 35, marginLeft: 25, marginBottom: 50}}
            onPress={() => this.props.navigation.goBack()}>
            <View
              style={[
                {
                  width: 50,
                  height: 50,
                  borderRadius: 50 / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e6e6e6',
                },
              ]}>
              <Icon name="chevron-back" size={35} />
            </View>
          </TouchableOpacity>

          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 18,
              margin: 10,
              marginLeft: 35,
            }}>
            {this.state.Title}
          </Text>

          {this.state.Title === 'Phone Number' ? (
            <View style={{flex: 1}}>
              <View
                style={{
                  flexDirection: 'row',
                  borderRadius: 5,
                  backgroundColor: '#f0f0f0',
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  alignItems: 'center',
                  marginLeft: 30,
                  marginRight: 30,
                }}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 18,
                    marginLeft: 15,
                  }}>
                  +94
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    padding: 7,
                    color: 'black',
                  }}
                  placeholder={this.state.Title}
                  placeholderTextColor={'#7a7a7a'}
                  value={this.state.Value}
                  autoFocus={true}
                  onChangeText={text => this.setState({Value: text})}
                  keyboardType={'numeric'}
                />
              </View>
              <Text
                style={{
                  alignSelf: 'center',
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  margin: 10,
                  fontSize: 16,
                  color: '#7a7a7a',
                }}>
                A verification code will be sent to this number
              </Text>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  margin: 10,
                  marginRight: 30,
                  textAlign: 'right',
                  color: '#ff0000',
                }}>
                {this.state.Errors}
              </Text>
            </View>
          ) : (
            <View style={{marginLeft: 30, marginRight: 30, flex: 1}}>
              <TextInput
                style={{
                  color: 'black',
                  backgroundColor: '#f0f0f0',
                  height: this.state.Title === 'Address' ? 100 : 40,
                  paddingLeft: 20,
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  textAlignVertical: 'top',
                }}
                multiline={this.state.Title === 'Address'}
                blurOnSubmit={true}
                placeholder={this.state.Title}
                placeholderTextColor={'#7a7a7a'}
                value={this.state.Value}
                autoFocus={true}
                onChangeText={text => this.setState({Value: text})}
              />

              {this.state.Title === 'Email' ? (
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    margin: 10,
                    fontSize: 16,
                    color: '#7a7a7a',
                  }}>
                  Check your email to confirm verification
                </Text>
              ) : null}

              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  margin: 10,
                  textAlign: 'right',
                  color: '#ff0000',
                }}>
                {this.state.Errors}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 30,
              marginLeft: 30,
              marginRight: 30,
              marginBottom: 30,
              backgroundColor: 'black',
            }}
            onPress={() => this.SaveData()}>
            <View
              style={{
                flex: 1,
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 40,
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
                Update {this.state.Title}
              </Text>
            </View>
            <ActivityIndicator
              size={'small'}
              color={'white'}
              animating={this.state.isLoading}
              style={{marginRight: 20}}
            />
          </TouchableOpacity>

          <Modal
            visible={this.state.isvisible}
            transparent={true}
            animated={true}
            animationType={'fade'}>
            <View
              style={{
                flex: 1,
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0, 0.7)',
              }}>
              <Card
                style={{backgroundColor: 'white', width: 310, height: 460}}
                cardElevation={2}
                cardMaxElevation={2}
                cornerRadius={10}>
                <View style={{alignItems: 'flex-end', marginRight: 10}}>
                  <TouchableOpacity
                    style={{position: 'relative', marginTop: 10}}
                    onPress={() => this.onClosePres()}>
                    <Icon name="close-circle" size={40} />
                  </TouchableOpacity>
                </View>

                <View style={{flex: 1, alignItems: 'center'}}>
                  <View
                    style={{
                      width: 55,
                      height: 55,
                      borderRadius: 100 / 2,
                      backgroundColor: '#F4F4F4',
                      margin: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon
                      name="lock-closed-outline"
                      size={25}
                      color={'black'}></Icon>
                  </View>

                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                    }}>
                    Enter your code
                  </Text>
                  <Text
                    style={{
                      textAlign: 'center',
                      marginTop: 10,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    }}>
                    To continue please enter{'\n'} the verification code we've
                    {'\n'} just send for you
                  </Text>

                  <OTPInputView
                    style={{width: '80%', height: 100}}
                    pinCount={4}
                    keyboardType={'phone-pad'}
                    code={this.state.code} //You can supply this prop or not. The component will be used as a controlled / uncontrolled component respectively.
                    onCodeChanged={code => this.setState({code: code})}
                    autoFocusOnLoad={false}
                    codeInputFieldStyle={styles.underlineStyleBase}
                    codeInputHighlightStyle={styles.underlineStyleHighLighted}
                    onCodeFilled={code => this.setState({code: code})}
                  />

                  <TouchableOpacity
                    disabled={this.state.isEnable}
                    style={{flex: 1}}
                    onPress={() => {
                      this.resendOTP();
                    }}>
                    <View>
                      <Text
                        style={{
                          color: this.state.isEnable ? '#d1d1d1' : 'black',
                        }}>
                        Resend Code{' '}
                        {this.state.isEnable ? '00:' + this.state.second : null}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      width: 150,
                      height: 50,
                      backgroundColor: 'black',
                      borderRadius: 10,
                      marginTop: -30,
                      marginBottom: 30,
                    }}
                    onPress={() => this.continuebuttonPress()}>
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                      }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: 'white',
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_Bold'
                              : 'AsapBold',
                        }}>
                        Continue
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  underlineStyleBase: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
    fontSize: 20,
    textAlign: 'center',
    color: 'black',
  },
  underlineStyleHighLighted: {
    borderColor: 'black',
  },
});
