// import { element } from 'prop-types'
import React from 'react';
import {
  AppState,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {NumericFormat} from 'react-number-format';
import {APIURL, CancelReason, ORDERVIEW} from '../Data/CloneData';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderProcess from '../Components/OrderProcess';
import {firebase} from '@react-native-firebase/messaging';
import RBSheet from 'react-native-raw-bottom-sheet';
import {CommonActions} from '@react-navigation/native';
import OrderImageSlider from '../Components/OrderImageSlider';

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = Platform.OS === 'android' ? 64 : 74;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const width = Dimensions.get('screen').width;
let height = Dimensions.get('window').height;
export default class OrderDetailsScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      scrollY: new Animated.Value(0),
      OrderID: this.props.route.params.OrderID,
      PreScreen: this.props.route.params.Screen,
      InsertDate: '',
      NetTotal: '',
      DineType: '',
      PaymentType: '',
      DeliveryAddress: '',
      Tax: '',
      Discount: '',
      DeliveryCharge: '',
      ServiceCharge: '',
      SubTotal: '',
      OrderStatus: '',
      OrderItemList: [],
      ImageList: [],
      isLoading: true,
      StatusList: [],
      ScheduleTime: '',
      BranchLocation: '',
      CancelRemark: '',
      backStatus: '',
      CancelReason: CancelReason,
      flatID: 0,
      isClickAddReason: false,
      isShowLess: true,
    };
    this.touchableInactive = false;
    this.CanceltouchableInactive = true;

    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  componentDidMount() {
    if (this.state.PreScreen === 'OrderScreen') {
      this.setState({backStatus: '1'});
      console.log('1');
    } else {
      this.setState({backStatus: '0'});
    }

    this.LoadOrderDetail();
    this.localNotification();
  }

  componentWillUnmount() {
    this.messageListner();
  }

  localNotification = () => {
    this.messageListner = firebase
      .messaging()
      .onMessage(async remoteMessage => {
        // console.log(remoteMessage.data);
        switch (remoteMessage.data.Status) {
          case 'Processing':
            this.setState({OrderStatus: '1'});
            break;
          case 'Preparing':
            this.setState({OrderStatus: '2'});
            break;
          case 'Delivery':
            this.setState({OrderStatus: '3'});
            break;
          case 'Cancel':
            this.setState({OrderStatus: '4'});
            break;
          case 'Finish':
            this.setState({OrderStatus: '5'});
            break;

          default:
            break;
        }
      });
  };

  onOrderCancelPress = Reason => {
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
            Para_Data: '103',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: this.state.OrderID,
            Para_Direction: 'Input',
            Para_Lenth: 50000,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: Reason,
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
          this.RBSheet.close();
          this.props.navigation.goBack();
        } else {
          this.RBSheet.close();
          Alert.alert('Warning', 'Your order not completely canceled');
        }
      })
      .catch(er => {
        console.log('onOrderCancelPress', er);
        this.RBSheet.close();
        Alert.alert('Error', 'Your order canceled operation failure');
      });
  };

  onCancelReason = () => {
    const ReasonList = [];
    CancelReason.forEach(element => {
      ReasonList.push({
        id: element.id,
        message: element.message,
        isSelected: false,
      });
    });

    this.setState({CancelReason: ReasonList, isClickAddReason: false});
  };

  renderCartItems = Item => {
    return Item.map((item, index) => {
      return (
        <View
          key={index}
          style={{
            flex: 1,
            margin: 5,
            marginLeft: 10,
            backgroundColor: '#F0F0F0',
          }}>
          <View style={{flexDirection: 'row'}}>
            <View
              style={{
                width: 30,
                height: 30,
                backgroundColor: '#e0e0e0',
                alignItems: 'center',
                margin: 10,
                justifyContent: 'center',
                borderRadius: 6,
              }}>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                {item.Qty}
              </Text>
            </View>
            <Text
              style={{
                marginTop: 6,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 18,
                marginLeft: 10,
                flex: 0.85,
                fontWeight: '800',
              }}>
              {item.ProductName}{' '}
            </Text>
            <NumericFormat
              value={item.NetTotal}
              displayType={'text'}
              thousandSeparator={true}
              fixedDecimalScale={true}
              decimalScale={2}
              prefix={'LKR '}
              renderText={formattedValue => (
                <Text
                  style={{
                    marginTop: 6,
                    textAlignVertical: 'top',
                    marginLeft: 15,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 20,
                  }}>
                  {formattedValue}
                </Text>
              )} // <--- Don't forget this!
            />
          </View>
          <View style={{marginBottom: 10}}>
            {this.renderAddons(item.Addons)}
            {this.renderExtra(item.Extra)}
            {/* <View style={{ height: 0.5, margin: 5, marginRight: 20, marginLeft: 20, marginTop: 20, backgroundColor: 'black' }} /> */}
          </View>
        </View>
      );
    });
  };

  renderAddons(Addons) {
    return Addons.map((item, key) => {
      return (
        <View
          key={key}
          style={{alignItems: 'center', marginLeft: 60, flexDirection: 'row'}}>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 16,
              color: '#969696',
              marginRight: 5,
            }}>
            {item.name}
          </Text>
          <NumericFormat
            value={item.price}
            displayType={'text'}
            thousandSeparator={true}
            fixedDecimalScale={true}
            decimalScale={2}
            prefix={'LKR '}
            renderText={formattedValue => (
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  fontSize: 16,
                  color: '#969696',
                }}>
                ({formattedValue})
              </Text>
            )} // <--- Don't forget this!
          />
        </View>
      );
    });
  }

  renderExtra(Extra) {
    return Extra.map((item, key) => {
      return (
        <View
          key={key}
          style={{alignItems: 'center', marginLeft: 60, flexDirection: 'row'}}>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 16,
              color: '#969696',
              marginRight: 5,
            }}>
            {item.name}
          </Text>
          <NumericFormat
            value={item.amount}
            displayType={'text'}
            thousandSeparator={true}
            fixedDecimalScale={true}
            decimalScale={2}
            prefix={'LKR '}
            renderText={formattedValue => (
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  fontSize: 16,
                  color: '#969696',
                }}>
                ({formattedValue})
              </Text>
            )} // <--- Don't forget this!
          />
        </View>
      );
    });
  }

  renderImages = ({item, key}) => {
    return (
      <View
        key={key}
        style={{
          width: width,
          height: 200,
          marginRight: 3,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <FastImage
          source={
            item.ProductIMG === ''
              ? require('../assets/image-placeholder.png')
              : {uri: item.ProductIMG}
          }
          style={{width: width, height: 200}}
        />
      </View>
    );
  };

  renderReason = ({item}) => {
    return (
      <TouchableOpacity
        style={{flex: 1, margin: 5, justifyContent: 'space-between'}}
        onPress={() => this.onReasonClick(item.id)}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: item.isSelected ? 'black' : '#bfbfbf',
            borderWidth: 1,
            backgroundColor: item.isSelected ? 'black' : null,
            borderRadius: 5,
          }}>
          <Text
            style={{
              paddingLeft: 10,
              paddingRight: 10,
              paddingBottom: 5,
              paddingTop: 5,
              textAlign: 'center',
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16,
              color: item.isSelected ? 'white' : '#7d7d7d',
            }}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  onReasonClick = ReasonID => {
    const list = this.state.CancelReason;
    const index = list.findIndex(i => i.id === ReasonID);
    list[index].isSelected = !list[index].isSelected;

    if (list[5].isSelected) {
      this.setState({isClickAddReason: true});
    } else {
      this.setState({isClickAddReason: false});
    }

    this.setState({CancelReason: list, flatID: this.state.flatID + 1});
  };

  onBackPress = () => {
    if (this.state.backStatus === '0') {
      this.props.navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{name: 'Orders'}],
        }),
      );
    } else {
      this.props.navigation.goBack();
    }
  };

  onCancelSubmitPress = () => {
    if (!this.CanceltouchableInactive) {
      var Reason = '';
      var Selected = this.state.CancelReason.filter(i => i.isSelected === true);

      switch (Selected.length) {
        case 1:
          Reason = Selected[0].message;
          break;
        case 2:
          Reason = Selected[0].message + ' | ' + Selected[1].message;
          break;
        case 3:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message;
          break;
        case 4:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message +
            ' | ' +
            Selected[3].message;
          break;
        case 5:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message +
            ' | ' +
            Selected[3].message +
            ' | ' +
            Selected[4].message;
          break;
        case 6:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message +
            ' | ' +
            Selected[3].message +
            ' | ' +
            Selected[4].message +
            ' | ' +
            Selected[5].message;
          break;
        case 7:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message +
            ' | ' +
            Selected[3].message +
            ' | ' +
            Selected[4].message +
            ' | ' +
            Selected[5].message +
            ' | ' +
            Selected[6].message;
          break;

        default:
          break;
      }

      if (this.state.isClickAddReason) {
        if (this.state.CancelRemark !== '') {
          Reason = Reason + ' | ' + this.state.CancelRemark;
          this.onOrderCancelPress(Reason);
        } else {
          Alert.alert('Warning', 'Type your reason');
        }
      } else {
        this.onOrderCancelPress(Reason);
      }
    }
  };

  onShowlessPress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    this.setState({isShowLess: !this.state.isShowLess});
  };

  render() {
    const ItemSeperator = () => {
      return (
        <View
          style={{
            height: 0.5,
            margin: 5,
            marginRight: 20,
            marginLeft: 20,
            backgroundColor: 'black',
          }}
        />
      );
    };

    const headerTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [0, -HEADER_SCROLL_DISTANCE],
      extrapolate: 'clamp',
    });

    const imageOpacity = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 1, 0],
      extrapolate: 'clamp',
    });

    const imageTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    const buttonScale = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 1, 0.9],
      extrapolate: 'clamp',
    });

    const buttonTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 0, Platform.OS === 'android' ? -8 : -5],
      extrapolate: 'clamp',
    });

    const titleTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 0, Platform.OS === 'android' ? -8 : 5],
      extrapolate: 'clamp',
    });

    const titleOpacity = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 0, 1],
      extrapolate: 'clamp',
    });

    var ORDERSTATUS = '';
    switch (this.state.OrderStatus) {
      case '1':
        ORDERSTATUS = 'Processing';
        break;
      case '2':
        ORDERSTATUS = 'Preparing';
        break;
      case '3':
        ORDERSTATUS = 'Delivering';
        break;
      case '4':
        ORDERSTATUS = 'Cancel';
        break;
      case '5':
        ORDERSTATUS = 'Finish';
        break;
      default:
        break;
    }

    return (
      <View style={{flex: 1}}>
        <Animated.ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.isLoading}
              colors={['red', 'green', 'blue']}
              title={'Refreshing'}
              titleColor={'black'}
            />
          }
          contentContainerStyle={{paddingTop: HEADER_MAX_HEIGHT}}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: this.state.scrollY}}}],
            {useNativeDriver: true},
          )}>
          <View
            style={{
              height: 0.9,
              marginTop: 10,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              marginTop: 10,
              marginLeft: 20,
              alignItems: 'center',
              marginBottom: this.state.OrderStatus === '1' ? 10 : 0,
            }}>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 20,
              }}>
              Order No : {this.state.OrderID}
            </Text>
            {this.state.OrderStatus === '1' ? (
              <TouchableOpacity
                style={{
                  backgroundColor: 'black',
                  borderRadius: 30 / 2,
                  height: 30,
                  alignItems: 'center',
                  marginRight: 20,
                }}
                onPress={() => {
                  this.props.navigation.navigate('OrderCancelScreen', {
                    OrderID: this.state.OrderID,
                    Screen: 'OrderDetailsScreen',
                  });
                  // this.RBSheet.open();
                  // this.onCancelReason();
                }}>
                <View style={{flex: 1, justifyContent: 'center'}}>
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 14,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      paddingRight: 15,
                      paddingLeft: 15,
                    }}>
                    Cancel Order
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text
            style={{
              flex: 1,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16,
              marginLeft: 20,
              marginTop: 2,
              color: '#9c9c9c',
            }}>
            Order date : {this.state.InsertDate}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 2,
              marginLeft: 20,
              marginRight: 35,
            }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: '#9c9c9c',
              }}>
              Quantity :
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 16,
                marginLeft: 10,
              }}>
              {this.state.OrderItemList.length}
            </Text>
            {/* <Text style={{ fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 18, color: '#53c266' }}>{ORDERSTATUS}</Text> */}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 2,
              marginLeft: 20,
              marginRight: 35,
            }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: '#9c9c9c',
              }}>
              Schedule Time :
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 16,
                marginLeft: 10,
              }}>
              {this.state.ScheduleTime}
            </Text>
            {/* <Text style={{ fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 18, color: '#53c266' }}>{ORDERSTATUS}</Text> */}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 2,
              marginLeft: 20,
              marginRight: 35,
            }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: '#9c9c9c',
              }}>
              Branch :
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 16,
                marginLeft: 10,
              }}>
              {this.state.BranchLocation}
            </Text>
            {/* <Text style={{ fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 18, color: '#53c266' }}>{ORDERSTATUS}</Text> */}
          </View>

          <View
            style={{
              height: 0.9,
              marginTop: 10,
              marginBottom: 15,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 18,
                marginLeft: 20,
              }}>
              Order Process
            </Text>
            <TouchableOpacity onPress={() => this.onShowlessPress()}>
              <Text
                style={{
                  color: '#7a7a7a',
                  marginRight: 30,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                }}>
                {this.state.isShowLess ? 'Show less' : 'Show more'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 14,
              marginLeft: 20,
              marginRight: 20,
              color: '#9c9c9c',
              marginTop: 5,
            }}>
            If you would like to know more about any purchase order you have
            made, then allow order tracking forms to help you.
          </Text>

          <View
            style={{
              height: 0.9,
              marginTop: 15,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />

          <View
            style={{
              overflow: 'hidden',
              height: this.state.isShowLess ? null : 0,
            }}>
            {!this.state.isLoading ? (
              <View style={{marginLeft: 30}}>
                <OrderProcess
                  ScheduleTime={this.state.ScheduleTime}
                  OrderID={this.state.OrderID}
                  OrderStatus={ORDERSTATUS}
                  StatusList={this.state.StatusList}
                  DineType={this.state.DineType}
                />
              </View>
            ) : null}

            <View
              style={{
                height: 0.9,
                marginTop: 20,
                marginBottom: 20,
                marginLeft: 20,
                marginRight: 20,
                backgroundColor: 'black',
              }}
            />
          </View>

          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 18,
              marginLeft: 20,
            }}>
            Order Items
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 14,
              marginLeft: 20,
              marginRight: 20,
              color: '#9c9c9c',
              marginTop: 5,
            }}>
            The following information is included for each unit on you order
            summary
          </Text>

          <View
            style={{
              height: 0.5,
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />

          {this.state.isLoading ? (
            <ActivityIndicator animating={true} color={'black'} />
          ) : (
            <SafeAreaView style={{flex: 1}}>
              {/* <FlatList
                                    scrollEnabled={false}
                                    data={this.state.OrderItemList}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={this.renderCartItems}
                                    ItemSeparatorComponent={ItemSeperator}
                                    showsVerticalScrollIndicator={false}
                                /> */}
              {this.renderCartItems(this.state.OrderItemList)}
            </SafeAreaView>
          )}

          <View
            style={{
              height: 0.5,
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />

          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 18,
              marginLeft: 20,
            }}>
            BILLING INFORMATION
          </Text>

          <View
            style={{
              height: 0.5,
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />

          <View style={{flexDirection: 'row', marginLeft: 30, marginRight: 30}}>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: 'black',
              }}>
              Sub Total
            </Text>
            <NumericFormat
              value={this.state.SubTotal}
              displayType={'text'}
              thousandSeparator={true}
              fixedDecimalScale={true}
              decimalScale={2}
              prefix={'LKR '}
              renderText={formattedValue => (
                <Text
                  style={{
                    flex: 1,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 16,
                    textAlign: 'right',
                    color: 'black',
                  }}>
                  {formattedValue}
                </Text>
              )} // <--- Don't forget this!
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop: 5,
              marginLeft: 30,
              marginRight: 30,
            }}>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: 'black',
              }}>
              Tax
            </Text>
            <NumericFormat
              value={this.state.Tax}
              displayType={'text'}
              thousandSeparator={true}
              fixedDecimalScale={true}
              decimalScale={2}
              prefix={'LKR '}
              renderText={formattedValue => (
                <Text
                  style={{
                    flex: 1,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 16,
                    textAlign: 'right',
                    color: 'black',
                  }}>
                  {formattedValue}
                </Text>
              )} // <--- Don't forget this!
            />
          </View>
          {this.state.Discount !== 0 ? (
            <View
              style={{
                flexDirection: 'row',
                marginTop: 5,
                marginLeft: 30,
                marginRight: 30,
              }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 16,
                  color: 'black',
                }}>
                Discount
              </Text>
              <NumericFormat
                value={this.state.Discount}
                displayType={'text'}
                thousandSeparator={true}
                fixedDecimalScale={true}
                decimalScale={2}
                prefix={'LKR '}
                renderText={formattedValue => (
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      textAlign: 'right',
                      color: 'black',
                    }}>
                    {formattedValue}
                  </Text>
                )} // <--- Don't forget this!
              />
            </View>
          ) : null}
          {this.state.DineType === 'Delivery' ? (
            <View
              style={{
                flexDirection: 'row',
                marginTop: 5,
                marginLeft: 30,
                marginRight: 30,
              }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 16,
                  color: 'black',
                }}>
                Delivery Charge
              </Text>
              <NumericFormat
                value={this.state.DeliveryCharge}
                displayType={'text'}
                thousandSeparator={true}
                fixedDecimalScale={true}
                decimalScale={2}
                prefix={'LKR '}
                renderText={formattedValue => (
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      textAlign: 'right',
                      color: 'black',
                    }}>
                    {formattedValue}
                  </Text>
                )} // <--- Don't forget this!
              />
            </View>
          ) : null}
          {this.state.DineType === 'PickUp' ||
          this.state.DineType === 'EatIn' ? (
            <View
              style={{
                flexDirection: 'row',
                marginTop: 5,
                marginLeft: 30,
                marginRight: 30,
              }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 16,
                  color: 'black',
                }}>
                Service Charge
              </Text>
              <NumericFormat
                value={this.state.ServiceCharge}
                displayType={'text'}
                thousandSeparator={true}
                fixedDecimalScale={true}
                decimalScale={2}
                prefix={'LKR '}
                renderText={formattedValue => (
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      textAlign: 'right',
                      color: 'black',
                    }}>
                    {formattedValue}
                  </Text>
                )} // <--- Don't forget this!
              />
            </View>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              marginTop: 5,
              marginLeft: 30,
              marginRight: 30,
            }}>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: 'black',
              }}>
              Net Total
            </Text>
            <NumericFormat
              value={this.state.NetTotal}
              displayType={'text'}
              thousandSeparator={true}
              fixedDecimalScale={true}
              decimalScale={2}
              prefix={'LKR '}
              renderText={formattedValue => (
                <Text
                  style={{
                    flex: 1,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 16,
                    textAlign: 'right',
                    color: 'black',
                  }}>
                  {formattedValue}
                </Text>
              )} // <--- Don't forget this!
            />
          </View>

          <View
            style={{
              height: 0.9,
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />

          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 18,
              marginLeft: 20,
            }}>
            ORDER INFORMATION
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 14,
              marginLeft: 20,
              marginRight: 20,
              color: '#9c9c9c',
              marginTop: 5,
            }}>
            The information presented here is included on your order like
            payment type , dine type , delivery address
          </Text>

          <View
            style={{
              height: 0.9,
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 20,
              marginRight: 20,
            }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 17,
                color: '#9c9c9c',
              }}>
              Payment Type :
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 17,
                textAlign: 'right',
              }}>
              {this.state.PaymentType}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 3,
              marginLeft: 20,
              marginRight: 20,
            }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 17,
                color: '#9c9c9c',
              }}>
              Dine Type :
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 17,
                textAlign: 'right',
              }}>
              {this.state.DineType}
            </Text>
          </View>
          {this.state.DineType === 'Delivery' ? (
            <View
              style={{
                flexDirection: 'row',
                marginTop: 3,
                marginLeft: 20,
                marginRight: 20,
              }}>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 17,
                  color: '#9c9c9c',
                }}>
                Delivery Address :
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 17,
                  textAlign: 'right',
                }}>
                {this.state.DeliveryAddress}
              </Text>
            </View>
          ) : null}

          <View
            style={{
              height: 0.9,
              marginTop: 20,
              marginBottom: 20,
              marginLeft: 20,
              marginRight: 20,
              backgroundColor: 'black',
            }}
          />
        </Animated.ScrollView>

        <Animated.View
          style={[
            {
              height: HEADER_MAX_HEIGHT,
              width: '100%',
              position: 'absolute',
              backgroundColor: '#F0F0F0',
              overflow: 'hidden',
            },
            {transform: [{translateY: headerTranslateY}]},
          ]}>
          {this.state.isLoading ? (
            <SkeletonPlaceholder
              backgroundColor={'#e0e0e0'}
              highlightColor={'#fafafa'}>
              <View style={{height: 200}} />
            </SkeletonPlaceholder>
          ) : (
            <Animated.View
              style={[
                {
                  opacity: imageOpacity,
                  transform: [{translateY: imageTranslateY}],
                },
              ]}>
              <OrderImageSlider ImageList={this.state.ImageList} />
            </Animated.View>
            // <Animated.FlatList
            //     style={[
            //         {
            //             opacity: imageOpacity,
            //             transform: [{ translateY: imageTranslateY }],
            //         },
            //     ]}
            //     horizontal={true}
            //     showsHorizontalScrollIndicator={false}
            //     data={this.state.ImageList}
            //     renderItem={this.renderImages}
            //     keyExtractor={(item, index) => index.toString()}
            // />
            // <Animated.ScrollView
            //     horizontal={true}
            //     style={[
            //         {
            //             opacity: imageOpacity,
            //             transform: [{ translateY: imageTranslateY }],
            //         },
            //     ]}>
            //     {this.renderImages(this.state.ImageList)}
            // </Animated.ScrollView>
          )}
        </Animated.View>

        <TouchableOpacity
          style={{
            top: Platform.OS === 'ios' ? 30 : 20,
            left: 20,
            position: 'absolute',
          }}
          onPress={() => this.onBackPress()}>
          <Animated.View
            style={[
              {
                width: 40,
                height: 40,
                borderRadius: 40 / 2,
                backgroundColor: '#F0F0F0',
                alignItems: 'center',
                justifyContent: 'center',
              },
              {
                transform: [
                  {scale: buttonScale},
                  {translateY: buttonTranslateY},
                ],
              },
            ]}>
            <Image
              source={require('../assets/left-arrow.png')}
              style={{width: 20, height: 20}}
            />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 28,
              left: 100,
              width: '60%',
            },
            {opacity: titleOpacity},
            {transform: [{translateY: titleTranslateY}]},
          ]}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 20,
              textTransform: 'uppercase',
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            }}>
            Order No : {this.state.OrderID}
          </Text>
        </Animated.View>

        <RBSheet
          ref={ref => {
            this.RBSheet = ref;
          }}
          // height={height / 2 + height / 4}
          height={height}
          openDuration={850}
          onClose={() => this.onSheetClose()}
          closeOnDragDown={false}
          closeOnPressMask={true}
          keyboardAvoidingViewEnabled={false}
          customStyles={{
            wrapper: {
              backgroundColor: 'rgba(0,0,0,0.6)',
            },
            draggableIcon: {
              backgroundColor: '#000',
            },
            container: {
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
            },
          }}>
          <View style={{flex: 1}}>
            <View
              style={{
                flexDirection: 'row',
                marginLeft: 30,
                marginTop: 30,
                marginBottom: 20,
              }}>
              <TouchableOpacity onPress={() => this.RBSheet.close()}>
                <Ionicons name={'close-outline'} size={30} color={'black'} />
              </TouchableOpacity>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 18,
                  color: 'black',
                  alignSelf: 'center',
                  marginLeft: 30,
                }}>
                Add order cancel remark
              </Text>
            </View>

            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: 'black',
                alignSelf: 'center',
                marginLeft: 30,
                marginRight: 30,
                textAlign: 'center',
                marginBottom: 10,
              }}>
              Cancelling the seleted orders will ber disable them from being
              processed. If the sales channel is not notified, these orders
              can't be restored.{' '}
            </Text>

            <View style={{marginLeft: 30, marginRight: 30, marginBottom: 10}}>
              <FlatList
                key={this.state.flatID}
                extraData={this.state}
                data={this.state.CancelReason}
                keyExtractor={(item, index) => index.toString()}
                renderItem={this.renderReason}
                numColumns={2}
              />
            </View>

            {/*<KeyboardAvoidingView key={this.state.flatID}*/}
            {/*                      behavior={this.state.isClickAddReason ? "position" : "padding"}*/}
            {/*                      keyboardVerticalOffset={25} contentContainerStyle={{*/}
            {/*    flex: 1,*/}
            {/*    backgroundColor: 'white'*/}
            {/*}} style={{flex: 1}}>*/}
            {/*    {this.state.isClickAddReason ? (*/}

            <TextInput
              style={{
                backgroundColor: '#f0f0f0',
                height: 100,
                paddingLeft: 20,
                borderRadius: 5,
                borderColor: '#dbdbdb',
                borderWidth: 1,
                fontSize: 16,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                justifyContent: 'center',
                color: 'black',
                textAlignVertical: 'top',
                marginLeft: 30,
                marginRight: 30,
              }}
              multiline={true}
              blurOnSubmit={true}
              keyboardType={'default'}
              placeholderTextColor={'#7a7a7a'}
              returnKeyType="done"
              onChangeText={remark => this.setState({CancelRemark: remark})}
            />

            {/*    )*/}
            {/*    :*/}
            {/*    null*/}
            {/*}*/}

            {/*</KeyboardAvoidingView>*/}
            {/* onPress={() => this.onOrderCancelPress()} */}
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginBottom: 10,
                marginRight: 5,
                marginLeft: 5,
                marginTop: 10,
              }}
              onPress={() => this.onCancelSubmitPress()}>
              <View
                style={{
                  width: '92%',
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
                  Submit
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </RBSheet>
      </View>
    );
  }

  LoadOrderDetail = async () => {
    const Mobile = await AsyncStorage.getItem('phonenumber');
    fetch(ORDERVIEW, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        MobileNo: Mobile,
        OrderId: this.state.OrderID,
      }),
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        const SList = [];
        const Images = [];
        var ImgPath = '';
        const NetTotal = json.NetTotal;
        const DineType = json.DineType;
        const PaymentType = json.PaymentType;
        const DeliveryAddress = json.DeliveryAddress;
        const InsertDate = json.InsertDate;
        const Tax = json.Tax;
        const Discount = json.Discount;
        const DeliveryCharge = json.DeliveryCharge;
        const ServiceCharge = json.ServiceCharge;
        const SubTotal = json.SubTotal;
        const OrderStatus = json.OrderStatus;
        const ScheduleTime = json.ScheduleTime;
        const BranchLocation = json.BranchLocation;
        const Items = json.Items;

        json.Items.forEach(element => {
          if (element.ProductIMG === null) {
            ImgPath = '';
          } else {
            ImgPath = element.ProductIMG.trim();
          }
          Images.push({ProductIMG: ImgPath});
        });

        // if (DineType === "Delivery") {
        //     if (OrderStatus == "1") {
        //         SList.push("Processing")
        //     } else if (OrderStatus == "2") {
        //         SList.push("Processing", "Accept", "Preparing")
        //     } else if (OrderStatus == "3") {
        //         SList.push("Processing", "Accept", "Preparing", "Delivering")
        //     } else if (OrderStatus == "5") {
        //         SList.push("Processing", "Accept", "Preparing", "Delivering", "Complete")
        //     }
        // } else {
        //     if (OrderStatus == "1") {
        //         SList.push("Processing")
        //     } else if (OrderStatus == "2") {
        //         SList.push("Processing", "Accept", "Preparing")
        //     } else if (OrderStatus == "5") {
        //         SList.push("Processing", "Accept", "Preparing", "Complete")
        //     }
        // }

        if (OrderStatus == '1') {
          SList.push('Processing');
        } else if (OrderStatus == '2') {
          SList.push('Processing', 'Accept', 'Preparing');
        } else if (OrderStatus == '3') {
          SList.push('Processing', 'Accept', 'Preparing', 'Delivering');
        } else if (OrderStatus == '4') {
          SList.push('Processing', 'Cancel');
        } else if (OrderStatus == '5') {
          SList.push(
            'Processing',
            'Accept',
            'Preparing',
            'Delivering',
            'Finish',
          );
        }

        this.setState({
          InsertDate: InsertDate,
          NetTotal: NetTotal,
          DineType: DineType,
          PaymentType: PaymentType,
          DeliveryAddress: DeliveryAddress,
          Tax: Tax,
          Discount: Discount,
          DeliveryCharge: DeliveryCharge,
          ServiceCharge: ServiceCharge,
          SubTotal: SubTotal,
          OrderStatus: OrderStatus,
          OrderItemList: Items,
          ImageList: Images,
          isLoading: false,
          StatusList: SList,
          ScheduleTime: ScheduleTime,
          BranchLocation: BranchLocation,
          isShowLess:
            OrderStatus === '5' ? false : OrderStatus === '4' ? false : true,
        });

        // console.log(OrderStatus);
      })
      .catch(er => {
        console.log('LoadOrderDetail', er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.LoadOrderDetail(),
            },
            {
              text: 'Close',
            },
          ],
          {cancelable: false},
        );
      });
  };

  onSheetClose() {
    console.log('close');
    this.CanceltouchableInactive = true;
  }
}
