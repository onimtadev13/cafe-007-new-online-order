import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {openDatabase} from 'react-native-sqlite-storage';
// import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import AppContext from '../Components/Context';

var db = openDatabase({name: 'UserDatabase.db'});

export default class AddInfoScreen extends React.PureComponent {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.state = {
      mobilenumber: this.props.route.params.mobilenumber,
      firstname: '',
      lastname: '',
      email: '',
      address: '',
      city: '',
    };
  }

  SaveData = () => {
    if (
      this.state.firstname == '' ||
      this.state.lastname == '' ||
      this.state.mobilenumber == '' ||
      this.state.address == '' ||
      this.state.city == ''
    ) {
      Alert.alert('Warning', 'Fill all Textfeilds');
    } else {
      this.context.SignUp(
        this.state.firstname,
        this.state.lastname,
        this.state.mobilenumber,
        this.state.email,
        this.state.address,
        this.state.city,
      );
    }
  };

  render() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS == 'ios' ? 'padding' : null}
        style={{flex: 1}}>
        <View style={{flex: 1}}>
          <ScrollView contentContainerStyle={{flexGrow: 1}}>
            <TouchableOpacity
              style={{marginTop: 35, marginLeft: 25, marginBottom: 20}}
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
                {/* <Icon name="chevron-back" size={35} /> */}
                   <FontAwesome6 name="chevron-left" size={35} solid />
              </View>
            </TouchableOpacity>
            <View style={{alignItems: 'flex-end', marginRight: 25}}>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 24,
                  textAlign: 'right',
                }}>
                Sign up to start order{'\n'}food in where you are today
              </Text>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  marginTop: 5,
                  fontSize: 15,
                }}>
                Can't cook don't bother order food online
              </Text>
            </View>
            <View style={{marginLeft: 30, marginRight: 30, marginTop: 20}}>
              <View
                style={{
                  flexDirection: 'row',
                  margin: 10,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 19,
                  }}>
                  First name
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 16,
                    marginLeft: 10,
                    color: '#7a7a7a',
                  }}>
                  (require)
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#e8e8e8',
                  height: 50,
                  paddingLeft: 20,
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  fontSize: 19,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  color: 'black',
                }}
                placeholderTextColor={'#7a7a7a'}
                onChangeText={firstname =>
                  this.setState({firstname: firstname})
                }
              />
            </View>

            <View style={{marginLeft: 30, marginRight: 30, marginTop: 10}}>
              <View
                style={{
                  flexDirection: 'row',
                  margin: 10,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 19,
                  }}>
                  Last name
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 16,
                    marginLeft: 10,
                    color: '#7a7a7a',
                  }}>
                  (require)
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#e8e8e8',
                  height: 50,
                  paddingLeft: 20,
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  fontSize: 19,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  justifyContent: 'center',
                  color: 'black',
                }}
                placeholderTextColor={'#7a7a7a'}
                onChangeText={lastname => this.setState({lastname: lastname})}
              />
            </View>

            <View style={{marginLeft: 30, marginTop: 10, marginRight: 30}}>
              <View
                style={{
                  flexDirection: 'row',
                  margin: 10,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 19,
                  }}>
                  Email
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 16,
                    marginLeft: 10,
                    color: '#7a7a7a',
                  }}>
                  (optional)
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#e8e8e8',
                  height: 50,
                  paddingLeft: 20,
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  fontSize: 19,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  justifyContent: 'center',
                  color: 'black',
                }}
                keyboardType={'email-address'}
                placeholderTextColor={'#7a7a7a'}
                onChangeText={email => this.setState({email: email})}
              />
            </View>

            <View style={{marginLeft: 30, marginTop: 10, marginRight: 30}}>
              <View
                style={{
                  flexDirection: 'row',
                  margin: 10,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 19,
                  }}>
                  Address
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 16,
                    marginLeft: 10,
                    color: '#7a7a7a',
                  }}>
                  (require)
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#e8e8e8',
                  height: 100,
                  paddingLeft: 20,
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  fontSize: 19,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  justifyContent: 'center',
                  color: 'black',
                  textAlignVertical: 'top',
                }}
                multiline={true}
                blurOnSubmit={true}
                keyboardType={'default'}
                placeholderTextColor={'#7a7a7a'}
                onChangeText={address => this.setState({address: address})}
              />
            </View>

            <View
              style={{
                marginLeft: 30,
                marginTop: 10,
                marginRight: 30,
                marginBottom: 30,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  margin: 10,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 19,
                  }}>
                  City
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 16,
                    marginLeft: 10,
                    color: '#7a7a7a',
                  }}>
                  (require)
                </Text>
              </View>
              <TextInput
                style={{
                  backgroundColor: '#e8e8e8',
                  height: 50,
                  paddingLeft: 20,
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: 1,
                  fontSize: 19,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  justifyContent: 'center',
                  color: 'black',
                }}
                keyboardType={'default'}
                placeholderTextColor={'#7a7a7a'}
                onChangeText={city => this.setState({city: city})}
              />
            </View>
            <View
              style={{
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                marginRight: 30,
                marginBottom: 30,
              }}>
              <TouchableOpacity onPress={() => this.SaveData()}>
                <View
                  style={{
                    width: 150,
                    height: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'black',
                    borderRadius: 150 / 2,
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                      fontSize: 20,
                    }}>
                    Done
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {this.props.isLoading ? (
            <View
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
              }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: 'white',
                  borderRadius: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <ActivityIndicator size={30} color="#c7c7c7" animating={true} />
                <Text
                  style={{
                    color: 'black',
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 15,
                    marginTop: 10,
                  }}>
                  Adding
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    );
  }
}
