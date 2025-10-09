import React from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {APIURL} from '../Data/CloneData';
// import IonicIcon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import {NumericFormat} from 'react-number-format';
import {firebase} from '@react-native-firebase/messaging';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
// import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const height = Dimensions.get('window').height;
const Tab = createMaterialTopTabNavigator();

export default class OrderScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(1),
      sliderUp: new Animated.Value(height),
      ongoing_orderlist: [],
      complete_orderlist: [],
      cancel_orderlist: [],
      refresh: false,
      isLoading: true,
    };
  }

  componentDidMount() {
    this._unsubscribe = this.props.navigation.addListener('focus', async () => {
      this.fadeIn();
      this.setState({isLoading: true});
      this.onGetOrderHeader();
    });
    this._unsubscribe = this.props.navigation.addListener('blur', async () => {
      this.fadeOut();
    });
    this.onGetOrderHeader();
    this.localNotification();
  }

  componentWillUnmount() {
    this._unsubscribe();
    this.messageListner();
  }

  localNotification = () => {
    this.messageListner = firebase
      .messaging()
      .onMessage(async remoteMessage => {
        if (remoteMessage.data.Status === 'Finish') {
          this.setState({isLoading: true});
          this.onGetOrderHeader();
        }
      });
  };

  fadeIn = () => {
    // Will change fadeAnim value to 1 in 5 seconds
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 500,
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

  sliderUp = () => {
    // Will change sliderUp value to 0 in 3 seconds
    Animated.spring(this.state.sliderUp, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  onGetOrderHeader = async () => {
    const mobile = await AsyncStorage.getItem('phonenumber');
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
            Para_Data: '99',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: mobile,
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
        const ongoing_orderlist = [];
        const complete_orderlist = [];

        json.CommonResult.Table.forEach(element => {
          if (element.OrderStatus === '5' || element.OrderStatus === '4') {
            complete_orderlist.push({
              OrderID: element.OrderID,
              NetTotal: element.NetTotal,
              DineType: element.DineType,
              DeliveryAddress: element.DeliveryAddress,
              PaymentType: element.PaymentType,
              InsertDate: element.InsertDate,
              Tax: element.Tax,
              Discount: element.Discount,
              DeliveryCharge: element.DeliveryCharge,
              ServiceCharge: element.ServiceCharge,
              SubTotal: element.SubTotal,
              OrderStatus: element.OrderStatus,
            });
          } else {
            ongoing_orderlist.push({
              OrderID: element.OrderID,
              NetTotal: element.NetTotal,
              DineType: element.DineType,
              DeliveryAddress: element.DeliveryAddress,
              PaymentType: element.PaymentType,
              InsertDate: element.InsertDate,
              Tax: element.Tax,
              Discount: element.Discount,
              DeliveryCharge: element.DeliveryCharge,
              ServiceCharge: element.ServiceCharge,
              SubTotal: element.SubTotal,
              OrderStatus: element.OrderStatus,
            });
          }
        });
        this.setState({
          ongoing_orderlist: ongoing_orderlist,
          complete_orderlist: complete_orderlist,
          refresh: false,
          isLoading: false,
        });
      })
      .catch(er => {
        console.log('onGetOrderHeader', er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.onGetOrderHeader(),
            },
          ],
          {cancelable: false},
        );
      })
      .finally(() => {
        this.setState({refresh: true});
        this.sliderUp();
      });
  };

  onrenderOrder = ({item, index}) => {
    let Icon = '';

    switch (item.DineType) {
      case 'EatIn':
        Icon = 'utensils';
        break;

      case 'PickUp':
        Icon = 'basket-shopping';
        break;

      case 'Delivery':
        Icon = 'car';
        break;

      default:
        break;
    }

    let Status = '';

    switch (item.OrderStatus) {
      case '1':
        Status = 'Processing';
        break;

      case '2':
        Status = 'Prepairing';
        break;

      case '3':
        switch (item.DineType) {
          case 'EatIn':
            Status = 'DineIn';
            break;

          case 'PickUp':
            Status = 'Pick Up';
            break;

          case 'Delivery':
            Status = 'Delevery';
            break;

          default:
            break;
        }

        break;

      case '4':
        Status = 'Cancel';
        break;

      case '5':
        Status = 'Complete';
        break;

      default:
        break;
    }

    return (
      <Animated.View
        style={[
          {
            backgroundColor: 'white',
            borderRadius: 10,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 15,
          },
          {transform: [{translateY: this.state.sliderUp}]},
        ]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 20,
            marginTop: 20,
            marginRight: 20,
            marginBottom: 5,
          }}>
          <Text
            style={{
              flex: 1,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 20,
              marginLeft: 20,
              color: 'black',
            }}>
            Order ID
          </Text>
          <Text
            style={{
              flex: 0.5,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 20,
              textAlign: 'right',
              color: '#9c9c9c',
              marginRight: 20,
            }}>
            {item.OrderID}
          </Text>
        </View>

        <View
          style={{flexDirection: 'row', alignItems: 'center', marginRight: 20}}>
          <Text
            style={{
              flex: 1,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 14,
              marginLeft: 40,
              marginBottom: 10,
              color: '#9c9c9c',
            }}>
            {moment(item.InsertDate).format('YYYY-MM-DD hh:mm:ss A ')}
          </Text>
          <Text
            style={{
              flex: 0.5,
              fontFamily:
                Platform.OS === 'ios'
                  ? 'Asap-Regular_SemiBold'
                  : 'AsapSemiBold',
              fontSize: 15,
              marginRight: 20,
              marginBottom: 10,
              color: Status === 'Cancel' ? 'red' : 'black',
              textAlign: 'right',
            }}>
            {Status}
          </Text>
        </View>

        <View
          style={{
            height: 0.5,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            backgroundColor: 'black',
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 40,
            marginBottom: 10,
          }}>
          <View
            style={{
              width: 55,
              height: 55,
              backgroundColor: '#f2f2f2',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
            }}>
            <FontAwesome6
              name={item.PaymentType === 'Cash' ? 'money-bill' : 'credit-card'}
              size={30}
              color={'#FF6900'}
            />
          </View>
          <View style={{marginLeft: 20}}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 18,
              }}>
              Payment Type
            </Text>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 16,
                color: '#828282',
              }}>
              {item.PaymentType}
            </Text>
          </View>
        </View>

        <View
          style={{flexDirection: 'row', alignItems: 'center', marginLeft: 40}}>
          <View
            style={{
              width: 55,
              height: 55,
              backgroundColor: '#f2f2f2',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
            }}>
            <FontAwesome6 name={Icon} size={30} color={'#FF6900'} />
          </View>
          <View style={{marginLeft: 20}}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 18,
              }}>
              Dine Type
            </Text>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 16,
                color: '#828282',
              }}>
              {item.DineType}
            </Text>
          </View>
        </View>

        <View style={{height: 0.8, margin: 20, backgroundColor: 'black'}} />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 30,
            marginLeft: 40,
            marginBottom: 20,
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: '#9c9c9c',
              }}>
              NetTotal
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
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_SemiBold'
                        : 'AsapSemiBold',
                    fontSize: 20,
                  }}>
                  {formattedValue}
                </Text>
              )} // <--- Don't forget this!
            />
          </View>

          <TouchableOpacity
            onPress={() =>
              this.props.navigation.navigate('OrderDetailsScreen', {
                OrderID: item.OrderID,
                Screen: 'OrderScreen',
              })
            }>
            <View
              style={{
                backgroundColor: 'black',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 50,
                borderColor: 'black',
                borderWidth: 1.5,
              }}>
              <Text
                style={{
                  color: 'white',
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 16,
                  marginLeft: 15,
                  marginRight: 15,
                  marginBottom: 5,
                  marginTop: 5,
                }}>
                View Order
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
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

    const EmptyList = () => {
      return (
        <View style={{justifyContent: 'center', flex: 1, marginTop: 130}}>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 24,
              textAlign: 'center',
            }}>
            No order yet
          </Text>
          <Text
            style={{
              margin: 20,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 17,
              textAlign: 'center',
              marginLeft: 40,
              marginRight: 40,
            }}>
            When you place your first order, it will appear here
          </Text>
          <TouchableOpacity
            style={{
              alignItems: 'center',
              marginTop: 10,
              marginLeft: 40,
              marginRight: 40,
              marginBottom: 30,
            }}
            onPress={() => this.props.navigation.navigate('Home')}>
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
                Find Food
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    };

    const OngoingOrder = () => {
      return (
        <View style={{flex: 1, marginTop: 20}}>
          <FlatList
            extraData={this.state}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isLoading}
                colors={['red', 'green', 'blue']}
                title={'Refreshing'}
                titleColor={'black'}
              />
            }
            data={this.state.ongoing_orderlist}
            renderItem={this.onrenderOrder}
            keyExtractor={(item, index) => index.toString()}
            refreshing={this.state.refresh}
            onRefresh={() => this.onGetOrderHeader()}
            ListEmptyComponent={EmptyList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    };

    const CompleteOrder = () => {
      return (
        <View style={{flex: 1, marginTop: 20}}>
          <FlatList
            extraData={this.state}
            refreshControl={
              <RefreshControl
                refreshing={this.state.isLoading}
                colors={['red', 'green', 'blue']}
                title={'Refreshing'}
                titleColor={'black'}
              />
            }
            data={this.state.complete_orderlist}
            renderItem={this.onrenderOrder}
            keyExtractor={(item, index) => index.toString()}
            refreshing={this.state.refresh}
            onRefresh={() => this.onGetOrderHeader()}
            ListEmptyComponent={EmptyList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    };

    return (
      <Animated.View style={[{flex: 1}, {opacity: this.state.fadeAnim}]}>
        {/* <View style={{ backgroundColor: 'white', alignItems: 'center' }}> */}
        <Text
          style={{
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
            fontSize: 26,
            marginLeft: 30,
            marginTop: 25,
            marginBottom: 10,
          }}>
          My Orders
        </Text>
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 15,
            marginLeft: 30,
            marginRight: 40,
            marginBottom: 20,
          }}>
          When you place your first order, it will appear here
        </Text>
        {/* </View> */}

        <Tab.Navigator
          keyboardDismissMode="auto"
          screenOptions={{
            keyboardHidesTabBar: true,
            tabBarLabelStyle: {
              fontSize: 16,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
            },
            tabBarIndicatorStyle: {backgroundColor: 'black'},
            tabBarStyle: {backgroundColor: 'transparent'},
            tabBarShowIcon: true,
          }}>
          <Tab.Screen name="Ongoing" children={OngoingOrder} />
          <Tab.Screen name="Completed" children={CompleteOrder} />
        </Tab.Navigator>
      </Animated.View>
    );
  }
}
