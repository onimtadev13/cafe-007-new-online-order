import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
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
import Icon from 'react-native-vector-icons/Ionicons';
import {isTablet} from 'react-native-device-info';
import RBSheet from 'react-native-raw-bottom-sheet';
import {CountryCodes} from '../Data/CountryCodes';
import AppContext from '../Components/Context';
import {keyboardType} from 'react-native/Libraries/DeprecatedPropTypes/DeprecatedTextInputPropTypes';


const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;


export default class LoginScreen extends React.PureComponent {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.state = {
      mobile: '',
      otpcode: '',
      isVisible: false,
      code: '+94',
      flag: '🇱🇰',
      position: 202,
      isEnable: true,
      second: 30,
      fadeanimate: new Animated.Value(0),
      animated: new Animated.Value(225),
      animatedheight: new Animated.Value(110),
      animatedtextheight: new Animated.Value(0),
      animatedtextopacity: new Animated.Value(0),
      loganim: new Animated.Value(0),
    };
  }

  componentDidMount() {
    Animated.parallel([
      Animated.spring(this.state.loganim, {
        toValue: 1,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(this.state.fadeanimate, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(this.state.animated, {
        toValue: 0,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Keyboard.dismiss();
  }

  textinputChange = mobilenumber => {
    this.setState({mobile: mobilenumber.replace(/^0+/, '')});
  };

  otpinputChange = OTP => {
    this.setState({otpcode: OTP});
  };

  onClosePress = () => {
    clearInterval(this.interval);
    this.setState({
      second: 30,
      isEnable: false,
      isvisible: false,
      isLoading: false,
      otpcode: '',
    });

    this.context.CloseOtpBox();
  };

  loginbuttonPress = mobilenumber => {
    if (this.state.isVisible) {
      this.context.login(mobilenumber);
      this.enableResendOTP();
    } else {
      Animated.parallel([
        Animated.spring(this.state.animatedtextheight, {
          toValue: 65,
          useNativeDriver: false,
        }),
        Animated.spring(this.state.animatedheight, {
          toValue: 175,
          useNativeDriver: false,
        }),
        Animated.timing(this.state.animatedtextopacity, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        this.setState({isVisible: true});
      }, 500);
    }
  };

  resendbuttonPress = mobilenumber => {
    let s = this.state.second;
    this.setState({isEnable: true, otpcode: ''});

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

    Keyboard.dismiss();
    this.context.ResendOTP(mobilenumber);
  };

  enableResendOTP = () => {
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

  continuebuttonPress = (OTP, mobilenumber) => {
    clearInterval(this.interval);
    this.setState({isEnable: false, second: 30, otpcode: ''});
    this.context.OTPVerification(OTP, mobilenumber, this.props.navigation);
  };


  onPressFlag = () => {
    const index = CountryCodes.findIndex((_, i) => i === this.state.position);
    Promise.all([this.myCountryPicker.open()]).then(() => {
      // Beacause I set Timeout wait for BottomSheet Open and scroll to index
      setTimeout(() => {
        this.flatlistref.scrollToIndex({
          animated: false,
          index: index,
          viewOffset: 120,
        });
      }, 10);
    });
  };

  renderCountry = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          this.setState({
            code: item.dial_code,
            flag: item.flag,
            position: index,
          });
          this.myCountryPicker.close();
          console.log(index);
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 64,
            backgroundColor:
              this.state.position === index ? '#dbdbdb' : 'white',
          }}>
          <Text style={{flex: 0.5, fontSize: 28, marginLeft: 10}}>
            {item.flag}
          </Text>
          <Text
            style={{
              flex: 3,
              margin: 10,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 18,
              color: 'black',
              alignSelf: 'center',
            }}>
            {item.name}
          </Text>
          <Text
            style={{
              flex: 0.6,
              textAlign: 'right',
              margin: 10,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 18,
              color: 'black',
              alignSelf: 'center',
            }}>
            {item.dial_code}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  getItemLayout(data, index) {
    return {length: 64, offset: 64 * index, index};
  }

  render() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{flex: 1}}>
        <View style={[{flex: 1, backgroundColor: '#F3F3F3'}]}>
          <Animated.View style={[{opacity: this.state.loganim}]}>
            <Image
              source={
                isTablet()
                  ? require('../assets/login_tablet_background.png')
                  : require('../assets/login_background.png')
              }
              style={[styles.loginlogo, StyleSheet.absoluteFillObject]}
              resizeMode={'contain'}
              resizeMethod={'resize'}
            />
            <View style={{flexDirection: 'row', marginTop: 29}}>
              <View style={{marginLeft: 26}}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 37,
                  }}>
                  LOGIN
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 12,
                    marginTop: -5,
                  }}>
                  Everything tastes good when{'\n'}you're hungry
                </Text>
              </View>
              <TouchableOpacity
                disabled={!this.props.isUpdated}
                style={{
                  flex: 1,
                  alignItems: 'flex-end',
                  marginRight: 30,
                  marginTop: 16,
                }}
                onPress={() => this.context.SkipButton()}>
                <Animated.View
                  style={[
                    {
                      width: 80,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'white',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    {opacity: this.state.fadeanimate},
                  ]}>
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                      fontSize: 17,
                    }}>
                    Skip
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{flex: 1, justifyContent: 'flex-end'}}>
            <Animated.View
              style={[
                {backgroundColor: 'white'},
                {transform: [{translateY: this.state.animated}]},
              ]}>
              <Animated.View
                style={[
                  {backgroundColor: 'white'},
                  {height: this.state.animatedheight},
                ]}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    marginLeft: 40,
                    marginTop: 10,
                    color: 'black',
                    fontSize: 19,
                  }}>
                  Food should be fun
                </Text>
                <Animated.View
                  style={[{height: this.state.animatedtextheight}]}>
                  <Animated.View
                    style={[
                      {flexDirection: 'row'},
                      {opacity: this.state.animatedtextopacity},
                      styles.textView,
                    ]}>
                    <TouchableOpacity
                      style={{flexDirection: 'row', alignItems: 'center'}}
                      onPress={() => this.onPressFlag()}>
                      <Text
                        style={{
                          fontSize: 28,
                          marginLeft: 10,
                        }}>
                        {this.state.flag}
                      </Text>
                      <Icon
                        name="caret-down-outline"
                        size={18}
                        style={{marginTop: 5, marginLeft: 5}}
                      />
                    </TouchableOpacity>
                    <Text
                      style={{
                        fontSize: 19,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_Medium'
                            : 'AsapMedium',
                        marginLeft: 5,
                      }}>
                      {this.state.code}
                    </Text>
                    <View
                      style={{
                        borderLeftWidth: 1,
                        height: 20,
                        backgroundColor: '#ededed',
                        marginLeft: 10,
                      }}
                    />
                    <TextInput
                      style={styles.textinput}
                      placeholder={'Mobile Number'}
                      placeholderTextColor={'#7a7a7a'}
                      keyboardType={'numeric'}
                      maxLength={10}
                      onChangeText={mobilenumber =>
                        this.textinputChange(mobilenumber)
                      }
                    />
                  </Animated.View>
                </Animated.View>
                <TouchableOpacity
                  disabled={!this.props.isUpdated}
                  style={{
                    marginLeft: 20,
                    marginRight: 20,
                    marginBottom: 20,
                    marginTop: 10,
                  }}
                  onPress={() => this.loginbuttonPress(this.state.mobile)}>
                  <View style={styles.buttonview}>
                    <Text
                      style={{
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_Medium'
                            : 'AsapMedium',
                        textAlign: 'center',
                        marginLeft: 40,
                        color: 'white',
                        fontSize: 19,
                      }}>
                      Get Start
                    </Text>
                    <ActivityIndicator
                      style={{marginRight: 20}}
                      size={20}
                      animating={this.props.isClick}
                      color={'white'}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>

          <RBSheet
            animationType={'fade'}
            ref={ref => {
              this.myCountryPicker = ref;
            }}
            height={400}
            openDuration={600}
            closeDuration={600}
            closeOnDragDown={true}
            closeOnPressMask={true}
            customStyles={{
              // wrapper: {
              //     backgroundColor: "transparent"
              // },
              draggableIcon: {
                backgroundColor: '#000',
              },
              container: {
                borderTopLeftRadius: 15,
                borderTopRightRadius: 15,
              },
            }}>
            <View
              style={{
                flex: 1,
                borderTopLeftRadius: 50,
                borderTopRightRadius: 50,
              }}>
              <Text
                style={{
                  margin: 20,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 18,
                  color: 'black',
                  alignSelf: 'center',
                }}>
                Select your country
              </Text>
              <FlatList
                style={{margin: 10}}
                scrollEventThrottle={16}
                ref={ref => {
                  this.flatlistref = ref;
                }}
                data={CountryCodes}
                renderItem={this.renderCountry}
                keyExtractor={(item, index) => index.toString()}
                getItemLayout={this.getItemLayout.bind(this)}
              />
            </View>
          </RBSheet>

          <Modal
            visible={this.props.isVisible}
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
                style={{backgroundColor: 'white', width: 310, height: 480}}
                cardElevation={2}
                cardMaxElevation={2}
                cornerRadius={10}>
                <View style={{alignItems: 'flex-end', marginRight: 10}}>
                  <TouchableOpacity
                    style={{position: 'relative', marginTop: 10}}
                    onPress={() => this.onClosePress()}>
                    <Icon name="close-circle" size={40} />
                  </TouchableOpacity>
                </View>

                <View style={{flex: 1, alignItems: 'center'}}>
                  <View
                    style={{
                      margin: 5,
                      width: 55,
                      height: 55,
                      borderRadius: 100 / 2,
                      backgroundColor: '#F4F4F4',
                      marginBottom: 30,
                      marginLeft: 30,
                      marginRight: 30,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Icon
                      name="lock-closed-outline"
                      size={25}
                      color={'black'}></Icon>
                  </View>

                  <Text style={{fontSize: 20, fontWeight: 'bold'}}>
                    Enter your code
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{textAlign: 'center', marginTop: 10}}>
                    To continue please enter{'\n'} the verification code we've
                    {'\n'} just send for you
                  </Text>

                  <OTPInputView
  style={{ width: '80%', height: 100 }}
  pinCount={4} 
  code={this.state.otpcode}
  autoFocusOnLoad={true}
  keyboardType="number-pad"
  codeInputFieldStyle={styles.underlineStyleBase}
  codeInputHighlightStyle={styles.underlineStyleHighLighted}
  onCodeChanged={(code) => this.setState({ otpcode: code })} 
  onCodeFilled={(code) => {
    console.log('OTP filled:', code); 
    clearInterval(this.interval);
    this.setState({ isEnable: false, second: 30 }, () => {
      this.context.OTPVerification(code, this.state.mobile, this.props.navigation);
      // reset otpcode here AFTER verification if needed
    });
  }}


                    // onCodeFilled={code => {
                    //   this.setState({otpcode: code});
                    //   console.log('Login Code:', code);
                    //   console.log(this.state.otpcode);                      
                    //   if (code === this.state.otpcode) {                       
                    //     clearInterval(this.interval);
                    //     this.setState({
                    //       isEnable: false,
                    //       second: 30,
                    //       otpcode: '',
                    //     });
                    //     this.props.navigation.replace('Dashboard');
                    //   } else {
                    //     Alert.alert(
                    //       'Warning',
                    //       'The OTP you entered could not be authenticated. Please try again.',
                    //     );
                    //   }
                    // }}
                  />

                  <TouchableOpacity
                    disabled={this.state.isEnable} 
                    style={{flex: 1}}
                    onPress={() => {
                      this.resendbuttonPress(this.state.mobile);
                    }}>
                    <View>
                      <Text
                        allowFontScaling={false}
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
                      marginBottom: 15,
                    }}
                    onPress={() =>
                      this.continuebuttonPress(
                        this.state.otpcode,
                        this.state.mobile,
                      )
                    }
                    >
                    <View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                      }}>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 14,
                          color: 'white',
                          fontWeight: 'bold',
                        }}>
                        Continue
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    marginLeft: '29%',
                    marginBottom: 20,
                  }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      textAlign: 'center',
                    }}>
                    Hotline :
                  </Text>
                  <Text
                    onPress={() => Linking.openURL(`tel:${`0707070007`}`)}
                    allowFontScaling={false}
                    style={{
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                      marginLeft: 5,
                      textAlign: 'center',
                      marginRight: 20,
                    }}>
                    0707070007
                  </Text>
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
  loginlogo: {
    width: screenWidth,
    height: screenHeight,
  },
  mobiletitle: {
    marginTop: 20,
    paddingLeft: 80,
    color: '#BFBFBF',
    fontSize: 16,
  },
  textView: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 5,
    borderColor: 'black',
    borderWidth: 0.5,
  },
  textinput: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 10,
    paddingTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
    fontSize: 19,
    color: 'black',
  },
  buttonview: {
    height: 50,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
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
