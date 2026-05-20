import React from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIURL } from '../Data/CloneData';
import moment from 'moment';
import { NumericFormat } from 'react-number-format';
import messaging from '@react-native-firebase/messaging';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { withTheme } from '../Context/ThemeContext';
import ThemeToggle from '../Components/ThemeToggle';
import { showNetworkError } from '../Utils/networkError';

const height = Dimensions.get('window').height;
const Tab = createMaterialTopTabNavigator();

class OrderScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(0),
      sliderUp: new Animated.Value(height),
      ongoing_orderlist: [],
      complete_orderlist: [],
      cancel_orderlist: [],
      refresh: false,
      isLoading: true,
    };
  }

  componentDidMount() {
    this.fadeIn();

    this._unsubscribe = this.props.navigation.addListener('focus', async () => {
      this.fadeIn();
      this.setState({ isLoading: true });
      this.onGetOrderHeader();
    });

    this._unsubscribeBlur = this.props.navigation.addListener(
      'blur',
      async () => {
        this.fadeOut();
      },
    );

    this.onGetOrderHeader();
    this.localNotification();
  }

  componentWillUnmount() {
    if (this._unsubscribe) this._unsubscribe();
    if (this._unsubscribeBlur) this._unsubscribeBlur();
    if (this.messageListner) this.messageListner();
  }

  localNotification = () => {
    this.messageListner = messaging().onMessage(async remoteMessage => {
      if (remoteMessage.data?.Status === 'Finish') {
        this.setState({ isLoading: true });
        this.onGetOrderHeader();
      }
    });
  };

  fadeIn = () => {
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 500,
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

  sliderUp = () => {
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
      .then(res => res.json())
      .then(json => {
        const ongoing_orderlist = [];
        const complete_orderlist = [];

        json.CommonResult.Table.forEach(element => {
          const order = {
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
          };

          if (element.OrderStatus === '5' || element.OrderStatus === '4') {
            complete_orderlist.push(order);
          } else {
            ongoing_orderlist.push(order);
          }
        });

        this.setState({
          ongoing_orderlist,
          complete_orderlist,
          refresh: false,
          isLoading: false,
        });
      })
      .catch(er => {
        console.log('onGetOrderHeader', er);
        showNetworkError(er, () => this.onGetOrderHeader(), null);
      })
      .finally(() => {
        this.setState({ refresh: true });
        this.sliderUp();
      });
  };

  onrenderOrder = ({ item, index }) => {
    const { theme } = this.props;

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
            backgroundColor: theme.card,
            borderRadius: 10,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 15,
          },
          { transform: [{ translateY: this.state.sliderUp }] },
        ]}
      >
        {/* Order ID row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 20,
            marginTop: 20,
            marginRight: 20,
            marginBottom: 5,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 20,
              marginLeft: 20,
              color: theme.text,
            }}
          >
            Order ID
          </Text>
          <Text
            style={{
              flex: 0.5,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 20,
              textAlign: 'right',
              color: theme.textMuted,
              marginRight: 20,
            }}
          >
            {item.OrderID}
          </Text>
        </View>

        {/* Date + Status row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 20,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 14,
              marginLeft: 40,
              marginBottom: 10,
              color: theme.textMuted,
            }}
          >
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
              color: Status === 'Cancel' ? '#D9534F' : theme.text,
              textAlign: 'right',
            }}
          >
            {Status}
          </Text>
        </View>

        <View
          style={{
            height: 0.5,
            marginLeft: 20,
            marginRight: 20,
            marginBottom: 20,
            backgroundColor: theme.separator,
          }}
        />

        {/* Payment Type */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 40,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              width: 55,
              height: 55,
              backgroundColor: theme.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
            }}
          >
            <FontAwesome6
              name={item.PaymentType === 'Cash' ? 'money-bill' : 'credit-card'}
              size={30}
              color={theme.accent}
            />
          </View>
          <View style={{ marginLeft: 20 }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 18,
                color: theme.text,
              }}
            >
              Payment Type
            </Text>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 16,
                color: theme.textSub,
              }}
            >
              {item.PaymentType}
            </Text>
          </View>
        </View>

        {/* Dine Type */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 40,
          }}
        >
          <View
            style={{
              width: 55,
              height: 55,
              backgroundColor: theme.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
            }}
          >
            <FontAwesome6 name={Icon} size={30} color={theme.accent} />
          </View>
          <View style={{ marginLeft: 20 }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 18,
                color: theme.text,
              }}
            >
              Dine Type
            </Text>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 16,
                color: theme.textSub,
              }}
            >
              {item.DineType}
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 0.8,
            margin: 20,
            backgroundColor: theme.separator,
          }}
        />

        {/* Total + View Order */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 30,
            marginLeft: 40,
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                color: theme.textMuted,
              }}
            >
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
                    color: theme.text,
                  }}
                >
                  {formattedValue}
                </Text>
              )}
            />
          </View>

          <TouchableOpacity
            onPress={() =>
              this.props.navigation.navigate('OrderDetailsScreen', {
                OrderID: item.OrderID,
                Screen: 'OrderScreen',
              })
            }
          >
            <View
              style={{
                backgroundColor: theme.pill,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 50,
                borderColor: theme.pill,
                borderWidth: 1.5,
              }}
            >
              <Text
                style={{
                  color: theme.pillText,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 16,
                  marginLeft: 15,
                  marginRight: 15,
                  marginBottom: 5,
                  marginTop: 5,
                }}
              >
                View Order
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  render() {
    const { theme } = this.props;

    const EmptyList = () => (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          minHeight: height * 0.6,
        }}
      >
        <View style={{ alignItems: 'center', marginTop: 130 }}>
          {/* No image in your current code but space kept for consistency */}
        </View>
        <Text
          style={{
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
            fontSize: 24,
            textAlign: 'center',
            color: theme.text,
          }}
        >
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
            color: theme.textSub,
          }}
        >
          When you place your first order, it will appear here
        </Text>
        <TouchableOpacity
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 30,
            marginLeft: 10,
            marginRight: 40,
            marginBottom: 30,
          }}
          onPress={() => this.props.navigation.navigate('Home')}
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
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 18,
              }}
            >
              Find Food
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );

    const TopSpacer = () => (
      <View style={{ height: 20, backgroundColor: theme.bg }} />
    );

    const OngoingOrder = () => (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <FlatList
          extraData={this.state}
          style={{ flex: 1, backgroundColor: theme.bg }}
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: theme.bg,
          }}
          ListHeaderComponent={
            this.state.ongoing_orderlist.length > 0 ? TopSpacer : null
          }
          refreshControl={
            <RefreshControl
              refreshing={this.state.isLoading}
              colors={[theme.accent]}
              tintColor={theme.accent}
              title={'Refreshing'}
              titleColor={theme.textSub}
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

    const CompleteOrder = () => (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <FlatList
          extraData={this.state}
          style={{ flex: 1, backgroundColor: theme.bg }}
          contentContainerStyle={{
            flexGrow: 1,
            backgroundColor: theme.bg,
          }}
          ListHeaderComponent={
            this.state.complete_orderlist.length > 0 ? TopSpacer : null
          }
          refreshControl={
            <RefreshControl
              refreshing={this.state.isLoading}
              colors={[theme.accent]}
              tintColor={theme.accent}
              title={'Refreshing'}
              titleColor={theme.textSub}
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

    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <Animated.View
          style={[
            { flex: 1, backgroundColor: theme.bg },
            { opacity: this.state.fadeAnim },
          ]}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginLeft: 30,
              marginTop: 25,
              marginRight: 16,
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 26,
                  color: theme.text,
                }}
              >
                My Orders
              </Text>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 15,
                  marginRight: 40,
                  marginTop: 6,
                  marginBottom: 10,
                  color: theme.textSub,
                }}
              >
                When you place your first order, it will appear here
              </Text>
            </View>
            <ThemeToggle />
          </View>

          {/* Tab Navigator */}
          <Tab.Navigator
            keyboardDismissMode="auto"
            style={{ backgroundColor: theme.bg }}
            sceneContainerStyle={{ backgroundColor: theme.bg }}
            screenOptions={{
              keyboardHidesTabBar: true,
              tabBarLabelStyle: {
                fontSize: 16,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              },
              tabBarActiveTintColor: theme.text,
              tabBarInactiveTintColor: theme.textMuted,
              tabBarIndicatorStyle: { backgroundColor: theme.accent },
              tabBarStyle: { backgroundColor: theme.bg },
              tabBarShowIcon: true,
            }}
          >
            <Tab.Screen name="Ongoing" children={OngoingOrder} />
            <Tab.Screen name="Completed" children={CompleteOrder} />
          </Tab.Navigator>
        </Animated.View>
      </View>
    );
  }
}

export default withTheme(OrderScreen);
