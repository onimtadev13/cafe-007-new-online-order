import React from 'react';
import {
  Modal,
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import BannerImage from './BannerImage';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {APIURL, Offers} from '../Data/CloneData';
import {Value} from 'react-native-reanimated';

const width = Dimensions.get('window').width;

export default class NotificationModal extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      zoomIn: new Animated.Value(1),
    };
  }

  componentDidMount() {
    this.NotificationVisit();
    this.ButtonTimout = setInterval(() => {
      Animated.timing(this.state.zoomIn, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(this.state.zoomIn, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      });
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.ButtonTimout);
  }

  NotificationVisit = async () => {
    console.log('NotificationVisit');

    var mobilenumber = await AsyncStorage.getItem('phonenumber');
    var NotificationId = await AsyncStorage.getItem('NID');

    console.log(mobilenumber);
    console.log(NotificationId);

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
            Para_Data: '118',
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
            Para_Data: NotificationId,
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
        console.log('NotificationVisit then');
      })
      .catch(er => {
        console.log(er);
      });
  };

  render() {
    const {
      type,
      description,
      more_description,
      isMenuButtonVisible,
      image,
      visible,
      onClosePress,
      onItemPress,
      itemCode,
      onMenuPress,
    } = this.props;

    return (
      <>
        {image !== '' ? (
          <Modal animationType="fade" visible={visible} transparent={true}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0, 0.7)',
              }}>
              <View style={{position: 'absolute', top: 80, right: 20}}>
                <TouchableOpacity
                  style={{marginTop: -60}}
                  onPress={() => onClosePress()}>
                  <Icon name="close-circle" size={40} color={'white'} />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  height: '50%',
                  backgroundColor: 'white',
                  justifyContent: 'center',
                  marginTop: 50,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}>
                {image === undefined ? (
                  <ActivityIndicator
                    animating={true}
                    color="black"
                    size={'large'}
                  />
                ) : (
                  <BannerImage
                    uri={image}
                    width={width}
                    header_Description={description}
                  />
                )}
              </View>
              <View
                style={{
                  backgroundColor: 'white',
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                }}>
                <Text
                  numberOfLines={6}
                  style={{
                    paddingLeft: 10,
                    paddingBottom: 10,
                    margin: more_description === '' ? 0 : 10,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  }}>
                  {more_description}
                </Text>
              </View>
              {type === 'item' ? (
                <View style={{alignItems: 'center', marginTop: 20}}>
                  <TouchableOpacity onPress={() => onItemPress(itemCode)}>
                    <Animated.View
                      style={[
                        {
                          height: 45,
                          width: 180,
                          backgroundColor: 'black',
                          justifyContent: 'center',
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: 'white',
                        },
                        {transform: [{scale: this.state.zoomIn}]},
                      ]}>
                      <Text
                        style={{
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_Medium'
                              : 'AsapMedium',
                          textAlign: 'center',
                          color: 'white',
                          fontSize: 16,
                        }}>
                        Have a taste
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              ) : null}
              {isMenuButtonVisible === 'true' ? (
                <View style={{alignItems: 'center', marginTop: 20}}>
                  <TouchableOpacity onPress={() => onMenuPress('Menu')}>
                    <Animated.View
                      style={[
                        {
                          height: 45,
                          width: 180,
                          backgroundColor: 'black',
                          justifyContent: 'center',
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: 'white',
                        },
                        {transform: [{scale: this.state.zoomIn}]},
                      ]}>
                      <Text
                        style={{
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_Medium'
                              : 'AsapMedium',
                          textAlign: 'center',
                          color: 'white',
                          fontSize: 16,
                        }}>
                        See Menu
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </Modal>
        ) : null}
      </>
    );
  }
}
