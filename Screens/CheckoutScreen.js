import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  Easing,
} from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import {Card} from 'react-native-shadow-cards';
import { Card } from 'react-native-paper';
// import CardView from 'react-native-cardview';
import CheckBox from '@react-native-community/checkbox';
import { NumericFormat } from 'react-number-format';
import { connect } from 'react-redux';
import { openDatabase } from 'react-native-sqlite-storage';
import RadioButton from 'react-native-radio-button';
// import IonicIcon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RBSheet from 'react-native-raw-bottom-sheet';
import { APIURL, PLACEORDERURL } from '../Data/CloneData';
import moment from 'moment';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getVersion } from 'react-native-device-info';
import PayHere from '@payhere/payhere-mobilesdk-reactnative';
import AlertDialog from '../Components/AlertDialog';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
// import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';


var db = openDatabase({ name: 'UserDatabase.db' });

const HEADER_MAX_HEIGHT = 130;
const HEADER_MIN_HEIGHT = 64;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const screenWidth = Dimensions.get('screen').width;

class CheckoutScreen extends React.Component {
  _list = [];

  constructor(props) {
    super(props);
    this.state = {
      scrollY: new Animated.Value(0),
      subTotal: this.props.route.params.Total,
      tax: 0,
      netTotal: 0,
      deliveryCharge: 0,
      discount: 0,
      serviceCharge: 0,
      dineType: 'null',
      paymentType: '',
      isChecked: false,
      prevItem: 0,
      isClickList: [],
      cardlist: [],
      selectedIndex: 0,
      slide: new Animated.Value(0),
      height: 0,
      address: '',
      city: '',
      typeaddress: '',
      isOrderPlaced: false,
      scheduleStatus: 'Now',
      isEnableTime: false,
      scheduleTime: moment(new Date()).format(' hh:mm:ss A '),
      locationList: [],
      locationPressed: '',
      OrderID: '',
      isEmailVerified: false,
      DefaultEmail: null,
      canDeliver: 'F',
      dialogVisible: false,
      status_message: '',
      promoModalVisible: false,
      promoCode: '',
      isCustomPromo: false,
      appliedCoupon: null,
      savedAmount: 0,
      isDelivery: 'false',
      zoomIn: new Animated.Value(1),
      glowAnim: new Animated.Value(0),
    };

    this.touchableInactive = false;
    this.RBSheetTouchableInactive = false;

    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  componentDidMount() {
    this.startGlow();
    const list = [];
    this.props.cartItems.forEach(element => {
      list.push({
        ProductName: element.ProductName,
        Qty: element.Qty,
        NetTotal: element.NetTotal,
        isDiscounted: element.isDiscounted,
        Addons: element.Addons,
        Extra: element.Extra,
        Checked: false,
      });
    });

    this.setState({ isClickList: list });

    this._unsubscribe = this.props.navigation.addListener('focus', async () => {
      this.GetRegisterdCreditCard();
    }); 
    this.GetTaxNetTotal('null');
    this.GetAddress();
    this._retrieveData();
    this.checkDeliveryAvailability();
  }

  startGlow() {
    Animated.loop(
      Animated.timing(this.state.glowAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }

  _retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('LOCA');

      console.log(value + '  checkout');

      if (value !== null) {
        // We have data!!
        this.setState({ locationPressed: value });
      }
    } catch (error) {
      console.log(error);
    }
  };

 
  togglePromoModal = (visible, code = '', isCustom = false) => {
    this.setState({
      promoModalVisible: visible,
      promoCode: code,
      isCustomPromo: isCustom,
    });
  };

  // handleApplyPromo = () => {
  //   const {promoCode} = this.state;
  //   this.togglePromoModal(false);
  // };

  handleApplyPromo = () => {
    const { promoCode } = this.state;
    console.log('Applying coupon:', promoCode);

    if (promoCode.trim() !== '') {
      const promoDiscounts = {
        SAVE1000: 1000,
        SAVE101: 750,
        SAVE102: 1200,
        SAVE103: 300,
      };

      const discount = promoDiscounts[promoCode] || 149;

      this.setState({
        appliedCoupon: promoCode,
        savedAmount: discount,
        isCustomPromo: false,
      });
    }

    this.togglePromoModal(false);
  };

  handleRemoveCoupon = () => {
    this.setState({
      appliedCoupon: null,
      savedAmount: 0,
      promoCode: '',
    });
  };

  onCardPress = () => {
    this.setState({ paymentType: 'Card' });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  onCashPress = () => {
    this.setState({ paymentType: 'Cash' });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  GetRegisterdCreditCard = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM credit_card', [], (tx, results) => {
        var temp = [];
        for (let i = 0; i < results.rows.length; ++i) {
          temp.push(results.rows.item(i));
        }
        this.setState({ cardlist: temp });
      });
    });
  };

  GetTaxNetTotal = async DineType => {
    // console.log(DineType);
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
            Para_Data: '94',
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
            Para_Data: this.state.subTotal,
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text2',
            Para_Type: 'varchar',
          },
          {
            Para_Data: DineType,
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
        this.setState({
          tax: json.CommonResult.Table[0].Tax,
          deliveryCharge: json.CommonResult.Table[0].DeliveryCharge,
          discount: json.CommonResult.Table[0].Discount,
          serviceCharge: json.CommonResult.Table[0].ServiceCharge,
          netTotal: json.CommonResult.Table[0].NetTotal,
          // netTotal: this.state.subTotal + json.CommonResult.Table[0].Tax
        });
      })
      .catch(er => {
        console.log('GetTaxNetTotal', er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.GetTaxNetTotal(),
            },
          ],
          { cancelable: false },
        );
      })
      .finally(() => {
        this.GetLocation();
      });
  };

  GetLocation = () => {
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
            Para_Data: '101',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
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
        const Locations = [];

        json.CommonResult.Table.forEach(element => {
          Locations.push({ name: element.location });
        });

        this.setState({ locationList: Locations });
      })
      .catch(er => {
        console.log('GetLocation', er);
      })
      .finally(() => {
        this.IsVerifiedEmail();
      });
  };

  IsVerifiedEmail = async () => {
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
            Para_Data: '109',
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
        this.setState({
          DefaultEmail: json.CommonResult.Table[0].Email,
          isEmailVerified: json.CommonResult.Table[0].EmailVerified,
        });
      });
  };

  ApplyCoupon = async () => {
    const { promoCode, subTotal } = this.state;
    this.togglePromoModal(false);

    console.log('Applying coupon via API:', promoCode);

    try {
      const res = await fetch(APIURL, {
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
              Para_Data: '125',
              Para_Direction: 'Input',
              Para_Lenth: 10,
              Para_Name: '@Iid',
              Para_Type: 'int',
            },
            {
              Para_Data: promoCode,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text1',
              Para_Type: 'varchar',
            },
            {
              Para_Data: subTotal,
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text2',
              Para_Type: 'varchar',
            },
          ],
          SpName: 'sp_Android_Common_API',
          con: '1',
        }),
      });

      const json = await res.json();
      console.log('Coupon API Response:', json);

      if (json.strRturnRes) {
        const result = json.CommonResult.Table[0];
        console.log('Coupon API Parsed Result:', result);

        if (result.SUCESS === 'SUCESS') {
          this.setState({
            appliedCoupon: promoCode,
            savedAmount: 1000 || 0,
          });
        } else {
          this.setState({
            appliedCoupon: null,
            savedAmount: 0,
          });

          alert(result.MSG || 'Invalid coupon');
        }
      }
    } catch (error) {
      console.log('Coupon API Error:', error);
    }
  };

  GetDeliveryStatus = async () => {
    const location = await AsyncStorage.getItem('LOCA_NAME');
    console.log(location, this.state.subTotal);
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
            Para_Data: '119',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: '',
            Para_Direction: 'Input',
            Para_Lenth: 50000,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: location,
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text2',
            Para_Type: 'varchar',
          },
          {
            Para_Data: this.state.subTotal,
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
          if (json.CommonResult.Table[0].STATUS === 'T') {
            this.setState({ dineType: 'Delivery' });
            this.GetTaxNetTotal('Delivery');
          }
          this.setState({
            dialogVisible: true,
            canDeliver: json.CommonResult.Table[0].STATUS,
            status_message: json.CommonResult.Table[0].MSG,
          });
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  checkDeliveryAvailability = async () => {
    try {
      const response = await fetch(APIURL, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify({
          HasReturnData: 'T',
          Parameters: [
            {
              Para_Data: '124',
              Para_Direction: 'Input',
              Para_Lenth: 4,
              Para_Name: '@Iid',
              Para_Type: 'int',
            },
            {
              Para_Data: '',
              Para_Direction: 'Input',
              Para_Lenth: 50000,
              Para_Name: '@Text1',
              Para_Type: 'varchar',
            },
            {
              Para_Data: '',
              Para_Direction: 'Input',
              Para_Lenth: 100,
              Para_Name: '@Text2',
              Para_Type: 'varchar',
            },
          ],
          SpName: 'sp_Android_Common_API',
          con: '1',
        }),
      });

      const json = await response.json();

      if (json.strRturnRes && json.CommonResult.Table.length > 0) {
        console.log('API isDelivery:', json.CommonResult.Table[0].isDelivery);

        this.setState({ isDelivery: json.CommonResult.Table[0].isDelivery });
      }
    } catch (error) {
      console.log('Delivery API Error:', error);
    }
  };

  GetAddress = () => {
    AsyncStorage.multiGet(['address', 'city']).then(response => {
      this.setState({
        address: response[0][1],
        city: response[1][1],
      });
    });
  };

  onChageAddress = () => {
    if (this.state.typeaddress != '') {
      this.setState({ address: this.state.typeaddress });
      this.RBSheet.close();
    } else {
      this.RBSheet.close();
    }
  };

  onCardPayment = DefaultEmail => {
    let OrderID = '';
    let Mobile = '';
    let Address = '';
    let FirstName = '';
    let LastName = '';
    let Email = '';
    let City = '';

    AsyncStorage.multiGet([
      'OrderID',
      'phonenumber',
      'address',
      'firstname',
      'lastname',
      'email',
      'city',
    ]).then(response => {
      OrderID = response[0][1];
      Mobile = response[1][1];
      Address = response[2][1];
      FirstName = response[3][1];
      LastName = response[4][1];
      Email = response[5][1];
      City = response[6][1];
      this.setState({ OrderID: OrderID });

      const paymentObject = {
        sandbox: false, // true if using Sandbox Merchant ID
        merchant_id: '218556', // Replace your Merchant ID
        merchant_secret: '4aBBo875VQb4JH6rXEXACi4a8bdnXYAPB8LV4XlLMDGV', // See step 4e
        notify_url: 'http://sample.com/notify',
        order_id: OrderID,
        items: OrderID,
        amount: parseFloat(this.state.netTotal).toFixed(2),
        currency: 'LKR',
        first_name: FirstName,
        last_name: LastName,
        email: DefaultEmail === null ? Email : DefaultEmail,
        phone: Mobile,
        address: Address,
        city: City,
        country: 'Sri Lanka',
        delivery_address: this.state.address,
        delivery_city: this.state.city,
        delivery_country: 'Sri Lanka',
        custom_1: '',
        custom_2: '',
      };

      PayHere.startPayment(
        paymentObject,
        paymentId => {
          console.log('Payment Completed', paymentId);

          this.OnlineOrderDataSave();

          // let DeliveryCharge = 0;
          // let ServiceCharge = 0;
          //
          // Address = "";
          // const ItemList = this.props.cartItems;
          // this.setState({OrderID: OrderID});
          //
          // switch (this.state.dineType) {
          //     case "EatIn":
          //         DeliveryCharge = 0;
          //         ServiceCharge = this.state.serviceCharge;
          //         break;
          //     case "PickUp":
          //         DeliveryCharge = 0;
          //         ServiceCharge = this.state.serviceCharge;
          //         break;
          //     case "Delivery":
          //         Address = this.state.address;
          //         DeliveryCharge = this.state.deliveryCharge;
          //         ServiceCharge = 0;
          //         break;
          //
          //     default:
          //         break;
          // }
          //
          // let Order = {
          //     OrderID: OrderID,
          //     Mobile: Mobile,
          //     Tax: this.state.tax,
          //     Version: getVersion(),
          //     Discount: this.state.discount,
          //     DeliveryCharge: DeliveryCharge,
          //     ServiceCharge: ServiceCharge,
          //     SubTotal: this.state.subTotal,
          //     NetTotal: this.state.netTotal,
          //     DineType: this.state.dineType,
          //     DeliveryAddress: Address,
          //     PaymentType: this.state.paymentType,
          //     ScheduleTime: this.state.scheduleTime,
          //     BranchLocation: this.state.locationPressed,
          //     Items: ItemList
          // }
          //
          //
          // fetch(PLACEORDERURL, {
          //     method: 'POST',
          //     cache: 'no-cache',
          //     headers: {
          //         'content-type': 'application/json',
          //         'cache-control': 'no-cache'
          //     },
          //     body: JSON.stringify(Order)
          // }).then(res => {
          //     return res.json();
          // }).then(json => {
          //
          //     if (json.strRturnRes === true) {
          //         this.RRBSheet.open();
          //         this.onClearAsync();
          //     }
          //
          // }).catch(er => {
          //     console.log("onPlaceorderPress", er);
          //     this.touchableInactive = false;
          //     Alert.alert("Warning", "The operation couldn't be completed.", [
          //             {
          //                 text: "Try Again"
          //             }
          //         ],
          //         {cancelable: false}
          //     );
          // })
        },
        errorData => {
          Alert.alert('PayHere Error', errorData);
          this.touchableInactive = false;
        },
        () => {
          console.log('Payment Dismissed');
          this.touchableInactive = false;
        },
      );
    });
  };

  onPlaceorderPress = async () => {
    if (
      this.state.dineType == 'null' ||
      this.state.paymentType == '' ||
      this.state.scheduleTime === 'Choose Time' ||
      this.state.locationPressed === ''
    ) {
      Alert.alert('Warning', 'Please select all required items');
    } else {
      if (this.state.paymentType === 'Card') {
        if (!this.touchableInactive) {
          this.touchableInactive = true;
          if (this.state.DefaultEmail === null) {
            if (this.state.isEmailVerified) {
              this.OnlineOrderDataSaveBeforPay(true);
            } else {
              Alert.alert('Warning', 'Please verified your email first');
            }
          } else {
            this.props.dispatch(clearCart());
            this.OnlineOrderDataSaveBeforPay(true);
          }
        }
      } else {
        if (!this.touchableInactive) {
          this.touchableInactive = true;
          this.OnlineOrderDataSaveBeforPay(false);
        }
      }
    }
  };

  generateOrderID = length => {
    const digits = '0123456789';
    let OrderID = '';
    for (let i = 0; i < length; i++) {
      OrderID += digits[Math.floor(Math.random() * 10)];
    }
    return OrderID;
  };

  // onClearAsync = async () => {
  //   const keys = await AsyncStorage.getAllKeys();
  //   [
  //     'address',
  //     'firstname',
  //     'lastname',
  //     'email',
  //     'phonenumber',
  //     'city',
  //     'OrderID',
  //     'EditStatus',
  //     'fcmToken',
  //     'LOCA',
  //     'PUSH',
  //     'NID',
  //   ].forEach(p => keys.splice(keys.indexOf(p), 1));

  //   await AsyncStorage.multiRemove(keys).then(() => {
  //     this.props.resetCart();
  //   });
  // };

  onClearAsync = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keepKeys = [
        'address',
        'firstname',
        'lastname',
        'email',
        'phonenumber',
        'city',
        'OrderID',
        'EditStatus',
        'fcmToken',
        'LOCA',
        'LOCA_NAME',
        'PUSH',
        'NID',
      ];

      const removeKeys = keys.filter(k => !keepKeys.includes(k));
      if (removeKeys.length > 0) {
        await AsyncStorage.multiRemove(removeKeys);
      }

      this.props.resetCart();
      console.log('Cart cleared successfully');
    } catch (error) {
      console.log('Failed to clear cart:', error);
    }
  };

  onContinuShoppingPress = async () => {
    if (!this.RBSheetTouchableInactive) {
      this.RBSheetTouchableInactive = true;
      this.RRBSheet.close();
      const keys = await AsyncStorage.getAllKeys();
      [
        'address',
        'firstname',
        'lastname',
        'email',
        'phonenumber',
        'city',
        'OrderID',
        'EditStatus',
        'fcmToken',
        'LOCA',
        'PUSH',
        'NID',
      ].forEach(p => keys.splice(keys.indexOf(p), 1));

      await AsyncStorage.multiRemove(keys).then(() => {
        this.props.resetCart();
        AsyncStorage.setItem('OrderID', this.generateOrderID(7));
        Promise.all([this.props.navigation.goBack()]).then(() =>
          this.props.navigation.navigate('OrderDetailsScreen', {
            OrderID: this.state.OrderID,
          }),
        );
      });
    }
  };

  onDineinTypePress = Type => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    switch (Type) {
      case 'EatIn':
        var netTotal =
          this.state.serviceCharge +
          this.state.tax +
          this.state.subTotal +
          this.state.discount;
        this.setState({ dineType: 'EatIn' });
        // this.setState({ netTotal: netTotal, dineType: "EatIn" });
        this.GetTaxNetTotal('EatIn');
        break;
      case 'PickUp':
        var netTotal =
          this.state.serviceCharge +
          this.state.tax +
          this.state.subTotal +
          this.state.discount;
        this.setState({ dineType: 'PickUp' });
        // this.setState({ netTotal: netTotal, dineType: "PickUp" });
        this.GetTaxNetTotal('PickUp');
        break;
      case 'Delivery':
        var netTotal =
          this.state.deliveryCharge +
          this.state.tax +
          this.state.subTotal +
          this.state.discount;

        // this.setState({ netTotal: netTotal, dineType: "Delivery" });
        this.GetDeliveryStatus();
        break;

      default:
        break;
    }
  };

  onSchedulePress = Status => {
    switch (Status) {
      case 'Now':
        this.setState({
          scheduleStatus: 'Now',
          scheduleTime: moment(new Date()).format(' hh:mm:ss A '),
        });
        break;
      case 'Later':
        this.setState({ scheduleStatus: 'Later', scheduleTime: 'Choose Time' });
        break;

      default:
        break;
    }
  };

  hideDatePicker = () => {
    this.setState({ isEnableTime: false });
  };

  handleConfirm = date => {
    this.setState({
      scheduleTime: moment(date).format(' hh:mm:ss A '),
      isEnableTime: false,
    });
  };

  onSeeMenu = () => {
    Promise.all([this.props.navigation.goBack()]).then(() =>
      this.props.navigation.navigate('HomeScreen'),
    );
  };

  onAddItems = () => {
    Promise.all([this.props.navigation.goBack()]).then(() =>
      this.props.navigation.navigate('Home'),
    );
  };

  onViewItemsPress = ItemID => {
    const list = this.state.isClickList;
    list[ItemID].Checked = !list[ItemID].Checked;
    this.setState({ isClickList: list });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  onAgreePress = () => {
    if (this.state.dineType === 'null') {
      Alert.alert('Alert', 'Dine Type Not Selected');
      // this.setState({ isChecked: false });
      this.SRBSheet.close();
    } else if (this.state.locationPressed === '') {
      Alert.alert('Alert', 'Location Not Selected');
      // this.setState({ isChecked: false });
      this.SRBSheet.close();
    } else if (this.state.paymentType === '') {
      Alert.alert('Alert', 'Payment Type Not Selected');
      // this.setState({ isChecked: false });
      this.SRBSheet.close();
    } else if (
      this.state.paymentType !== '' &&
      this.state.dineType !== 'null' &&
      this.state.locationPressed !== ''
    ) {
      // this.setState({ isChecked: true });
      this.SRBSheet.close();
      this.onPlaceorderPress();
    }
  };

  renderCartItems = Item => {
    return Item.map((item, index) => {
      return (
        <View key={index} style={{ flex: 1, margin: 5, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row' }}>
            <View
              style={{
                width: 25,
                height: 25,
                backgroundColor: '#e0e0e0',
                alignItems: 'center',
                marginLeft: 10,
                marginRight: 10,
                marginTop: 5,
                justifyContent: 'center',
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                {item.Qty}
              </Text>
            </View>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 19,
                marginLeft: 10,
                flex: 0.85,
                fontWeight: '800',
              }}
            >
              {item.ProductName}{' '}
            </Text>
            <View style={{ flexDirection: 'column' }}>
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
                      textAlignVertical: 'top',
                      marginLeft: 15,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                      fontSize: 18,
                    }}
                  >
                    {formattedValue}
                  </Text>
                )} // <--- Don't forget this!
              />
              {/* <Text
                style={{
                  color: '#FF5722',
                  fontSize: 16,
                  marginTop: 4,
                  textAlign: 'right',
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                }}>
                ( 10% OFF )
              </Text> */}
              {item.isDiscounted && (
                <Text
                  style={{
                    backgroundColor: '#194dadd3',
                    color: 'white',
                    fontSize: 14,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 6,
                    alignSelf: 'flex-end',
                    marginTop: 4,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                  }}
                >
                  10% off
                </Text>
              )}
            </View>
          </View>
          <View style={{ marginBottom: 5 }}>
            {item.Addons.length + item.Extra.length > 0 && !item.Checked ? (
              <TouchableOpacity onPress={() => this.onViewItemsPress(index)}>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 15,
                    color: '#969696',
                    marginLeft: 60,
                  }}
                >
                  Show {item.Addons.length + item.Extra.length} more items
                </Text>
              </TouchableOpacity>
            ) : null}

            <View
              style={{ height: item.Checked ? null : 0, overflow: 'hidden' }}
            >
              {this.renderAddons(item.Addons)}
              {this.renderExtra(item.Extra)}
              <TouchableOpacity
                style={{ marginTop: 5 }}
                onPress={() => this.onViewItemsPress(index)}
              >
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 15,
                    color: 'black',
                    marginLeft: 60,
                  }}
                >
                  Show less items
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    });
  };

  renderAddons(Addons) {
    return Addons.map((item, key) => {
      return (
        <Animated.View
          key={key}
          style={[
            {
              alignItems: 'center',
              marginLeft: 60,
              flexDirection: 'row',
            },
          ]}
        >
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 17,
              color: '#969696',
              marginRight: 5,
            }}
          >
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
                  fontSize: 17,
                  color: '#969696',
                }}
              >
                ({formattedValue})
              </Text>
            )} // <--- Don't forget this!
          />
        </Animated.View>
      );
    });
  }

  renderExtra(Extra) {
    return Extra.map((item, key) => {
      return (
        <View
          key={key}
          style={{ alignItems: 'center', marginLeft: 60, flexDirection: 'row' }}
        >
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 17,
              color: '#969696',
              marginRight: 5,
            }}
          >
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
                  fontSize: 17,
                  color: '#969696',
                }}
              >
                ({formattedValue})
              </Text>
            )} // <--- Don't forget this!
          />
        </View>
      );
    });
  }

  renderLoactions = Location => {
    return Location.map((item, key) => {
      return (
        <Card
          key={key}
          cardElevation={this.state.locationPressed === item.name ? 12 : 0}
          cardMaxElevation={12}
          cornerRadius={15}
          style={{ marginTop: 25, marginRight: 10, marginLeft: 10 }}
        >
          <TouchableOpacity
            onPress={() => {
              this.setState({ locationPressed: item.name });
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                width: 150,
                height: 60,
                backgroundColor:
                  this.state.locationPressed === item.name
                    ? 'black'
                    : '#F0F0F0',
                borderColor:
                  this.state.locationPressed === item.name
                    ? 'black'
                    : '#dbdbdb',
                borderWidth: 1.5,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* <Ionicons name="card" size={22} color={this.state.paymentType === "Card" ? "#FF6900" : "#ffa363"} /> */}
              <Text
                style={{
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  color:
                    this.state.locationPressed === item.name
                      ? 'white'
                      : '#7a7a7a',
                }}
              >
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        </Card>
      );
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

  onPress = index => {
    this.setState({ selectedIndex: index });
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
              fontFamily:
                Platform.OS === 'ios'
                  ? 'Asap-Regular_SemiBold'
                  : 'AsapSemiBold',
              marginLeft: 15,
            }}
          >
            {cardtype}
          </Text>
          <RadioButton
            size={14}
            innerColor={'black'}
            outerColor={'black'}
            animation={'bounceIn'}
            isSelected={this.state.selectedIndex === index}
            onPress={() => {
              this.onPress(index);
            }}
          />
        </View>
      );
    });
  }

  render() {
    const headerTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [0, -HEADER_SCROLL_DISTANCE],
      extrapolate: 'clamp',
    });

    const buttonScale = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 1, 0.9],
      extrapolate: 'clamp',
    });

    const buttonTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, -15, -15],
      extrapolate: 'clamp',
    });

    const titleTranslateX = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 10, 10],
      extrapolate: 'clamp',
    });

    const titleTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 6, 6],
      extrapolate: 'clamp',
    });

    const titleScale = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 0.9, 0.8],
      extrapolate: 'clamp',
    });

    const {
      promoModalVisible,
      promoCode,
      isCustomPromo,
      appliedCoupon,
      savedAmount,
    } = this.state;

    const width = 120;
    const height = 45;
    const borderRadius = 25;

    const translateX = this.state.glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, width],
    });

    return (
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: '#F0F0F0' }}
          contentContainerStyle={{ paddingTop: 140 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
            { useNativeDriver: true },
          )}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 22,
                textAlign: 'right',
                marginRight: 30,
                marginLeft: 30,
                marginBottom: 10,
              }}
            >
              Order verification
            </Text>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 18,
                textAlign: 'left',
                marginRight: 30,
                marginLeft: 30,
              }}
            >
              Terms and Conditions
            </Text>
            <View
              style={{
                height: 0.5,
                marginTop: 15,
                marginBottom: 10,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: 'black',
              }}
            />
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                marginTop: 10,
                marginLeft: 30,
                margin: 10,
                textAlign: 'left',
                marginRight: 30,
              }}
            >
              1. The order price might changed.{'\n'}2. Some of the items in the
              order will be out of stock and those items will be not delivered.
              There for total order value will be changed.{' '}
            </Text>

            <View
              style={{
                height: 0.5,
                marginTop: 15,
                marginBottom: 10,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: 'black',
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 30,
                marginTop: 10,
                marginBottom: 10,
                marginRight: 40,
              }}
            >
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 22,
                  flex: 1,
                }}
              >
                Your Items
              </Text>
            

              <TouchableOpacity
                style={{ flex: 0.5, alignItems: 'flex-end', marginRight: 10 }}
                onPress={() => this.props.navigation.navigate('HomeScreen')}
                
              >
                <Animated.View
                  style={[
                    {
                      width: 125,
                      height: 50,
                      backgroundColor: 'black',
                      borderRadius: 125 / 2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    { transform: [{ scale: this.state.zoomIn }] },
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      textAlign: 'right',
                      color: 'white',
                    }}
                  >
                    See menu
                  </Text>
                  {/* White border + glow */}
                  <MaskedView
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                      }
                    }
                    maskElement={
                      <View
                        style={{
                          flex: 1,
                          borderRadius,
                          borderWidth: 2,
                          borderColor: 'black',
                        }}
                      />
                    }
                  >
                    {/* Solid white border */}
                    <View
                      style={{
                        flex: 1,
                        borderRadius,
                        borderWidth: 2,
                        borderColor: '#fff',
                      }}
                    />

                    {/* Moving gold highlight */}
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        transform: [{ translateX }],
                      }}
                    >
                      <LinearGradient
                        colors={['transparent', 'gold', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    </Animated.View>
                  </MaskedView>
                </Animated.View>
              </TouchableOpacity>
            </View>
            <View
              style={{
                height: 0.5,
                marginTop: 10,
                marginBottom: 10,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: 'black',
              }}
            />
            <View>{this.renderCartItems(this.state.isClickList)}</View>
            <TouchableOpacity
              style={{ marginLeft: 30, marginTop: 10, marginBottom: 10 }}
              onPress={() => this.onAddItems()}
            >
              <View
                style={{
                  flexDirection: 'row',
                  width: 130,
                  height: 35,
                  backgroundColor: '#e3e3e3',
                  borderRadius: 100 / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* <IonicIcon name="add-outline" size={20} /> */}
               <FontAwesome6 name="plus" size={20} solid />

                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    color: 'black',
                    fontSize: 16,
                    marginLeft: 5,
                  }}
                >
                  Add items
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={{
                height: 0.8,
                marginTop: 10,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: 'black',
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                marginTop: 30,
                marginLeft: 30,
                marginRight: 30,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: 'black',
                }}
              >
                Sub Total
              </Text>
              <NumericFormat
                value={this.state.subTotal}
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
                      fontSize: 18,
                      textAlign: 'right',
                      color: 'black',
                    }}
                  >
                    {formattedValue}
                  </Text>
                )} // <--- Don't forget this!
              />
            </View>

            {this.state.tax !== 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 5,
                  marginLeft: 30,
                  marginRight: 30,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 18,
                    color: 'black',
                  }}
                >
                  Tax
                </Text>
                <NumericFormat
                  value={this.state.tax}
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
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 20,
                        textAlign: 'right',
                        color: 'black',
                      }}
                    >
                      {formattedValue}
                    </Text>
                  )} // <--- Don't forget this!
                />
              </View>
            ) : null}

            {this.state.discount !== 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 5,
                  marginLeft: 30,
                  marginRight: 30,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 18,
                    color: 'black',
                  }}
                >
                  Discount
                </Text>
                <NumericFormat
                  value={this.state.discount}
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
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 20,
                        textAlign: 'right',
                        color: 'black',
                      }}
                    >
                      {formattedValue}
                    </Text>
                  )} // <--- Don't forget this!
                />
              </View>
            ) : null}
            {this.state.dineType === 'Delivery' ? (
              this.state.deliveryCharge !== 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 5,
                    marginLeft: 30,
                    marginRight: 30,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 18,
                      color: 'black',
                    }}
                  >
                    Delivery Charge
                  </Text>
                  <NumericFormat
                    value={this.state.deliveryCharge}
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
                            Platform.OS === 'ios'
                              ? 'Asap-Regular'
                              : 'AsapRegular',
                          fontSize: 20,
                          textAlign: 'right',
                          color: 'black',
                        }}
                      >
                        {formattedValue}
                      </Text>
                    )} // <--- Don't forget this!
                  />
                </View>
              ) : null
            ) : null}
            {this.state.dineType === 'PickUp' ||
            this.state.dineType === 'EatIn' ? (
              this.state.serviceCharge !== 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 5,
                    marginLeft: 30,
                    marginRight: 30,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 18,
                      color: 'black',
                    }}
                  >
                    Service Charge
                  </Text>
                  <NumericFormat
                    value={this.state.serviceCharge}
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
                            Platform.OS === 'ios'
                              ? 'Asap-Regular'
                              : 'AsapRegular',
                          fontSize: 20,
                          textAlign: 'right',
                          color: 'black',
                        }}
                      >
                        {formattedValue}
                      </Text>
                    )} // <--- Don't forget this!
                  />
                </View>
              ) : null
            ) : null}
            {this.state.subTotal !== this.state.netTotal ? (
              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 5,
                  marginLeft: 30,
                  marginRight: 30,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 18,
                    color: 'black',
                  }}
                >
                  Net Total
                </Text>
                <NumericFormat
                  value={this.state.netTotal}
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
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 18,
                        textAlign: 'right',
                        color: 'black',
                      }}
                    >
                      {formattedValue}
                    </Text>
                  )} // <--- Don't forget this!
                />
              </View>
            ) : null}
            <View
              style={{
                height: 0.5,
                marginTop: 30,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: 'black',
              }}
            />

            {/* Select Coupon */}

            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 22,
                marginTop: 15,
                textAlign: 'center',
              }}
            >
              Coupons
            </Text>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                textAlign: 'left',
                marginRight: 30,
                marginLeft: 30,
                color: '#1c6638ff',
                marginTop: 5,
                marginBottom: 5,
              }}
            >
              1 Promotions Available
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 15 }}
            >
              <Card
                cardElevation={3}
                cardMaxElevation={3}
                cornerRadius={10}
                style={{ marginHorizontal: 10, marginVertical: 8 }}
              >
                <TouchableOpacity
                  onPress={() => this.togglePromoModal(true, 'SAVE1000', false)}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#ffa363',
                      borderStyle: 'dashed',
                      paddingVertical: 12,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      minHeight: 50,
                      backgroundColor: '#F0F0F0',
                    }}
                  >
                    {/* <Ionicons name={'bookmark'} size={18} color={'#ffa363'} /> */}
                    <FontAwesome6 name="bookmark" size={18} color="#ffa363" solid />

                    <Text
                      style={{
                        color: '#ffa363',
                        fontSize: 15,
                        fontWeight: 'bold',
                        marginLeft: 6,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                      }}
                    >
                      Get Rs.1,000 OFF your next order
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>

              <Card
                cardElevation={3}
                cardMaxElevation={3}
                cornerRadius={10}
                style={{ marginHorizontal: 10, marginVertical: 8 }}
              >
                <TouchableOpacity
                  onPress={() => this.togglePromoModal(true, 'SAVE101', false)}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#7a7a7a',
                      borderStyle: 'dashed',
                      paddingVertical: 12,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start', // left align with icon
                      minHeight: 50,
                      backgroundColor: '#F0F0F0',
                    }}
                  >
                    {/* <Ionicons name={'basket'} size={18} color={'#7a7a7a'} /> */}
                    <FontAwesome6 name="basket-shopping" size={18} color="#7a7a7a" solid />

                    <Text
                      style={{
                        color: '#7a7a7a',
                        fontSize: 15,
                        fontWeight: 'bold',
                        marginLeft: 6,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                      }}
                    >
                      Get Rs.750 OFF when you spend above Rs.3,000
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>

              <Card
                cardElevation={3}
                cardMaxElevation={3}
                cornerRadius={10}
                style={{ marginHorizontal: 10, marginVertical: 8 }}
              >
                <TouchableOpacity
                  onPress={() => this.togglePromoModal(true, 'SAVE102', false)}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#7a7a7a',
                      borderStyle: 'dashed',
                      paddingVertical: 12,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      minHeight: 50,
                      backgroundColor: '#F0F0F0',
                    }}
                  >
                    {/* <Ionicons name={'pricetag'} size={18} color={'#7a7a7a'} /> */}
                    <FontAwesome6 name="tag" size={18} color="#7a7a7a" solid />

                    <Text
                      style={{
                        color: '#7a7a7a',
                        fontSize: 15,
                        fontWeight: 'bold',
                        marginLeft: 6,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                      }}
                    >
                      Get Rs.1,200 OFF on weekend orders
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>

              <Card
                cardElevation={3}
                cardMaxElevation={3}
                cornerRadius={10}
                style={{ marginHorizontal: 10, marginVertical: 8 }}
              >
                <TouchableOpacity
                  onPress={() => this.togglePromoModal(true, 'SAVE103', false)}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#7a7a7a',
                      borderStyle: 'dashed',
                      paddingVertical: 12,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      minHeight: 50,
                      backgroundColor: '#F0F0F0',
                    }}
                  >
                    {/* <Ionicons name={'beer'} size={18} color={'#7a7a7a'} /> */}
                    <FontAwesome6 name="beer-mug-empty" size={18} color="#7a7a7a" solid />

                    <Text
                      style={{
                        color: '#7a7a7a',
                        fontSize: 15,
                        fontWeight: 'bold',
                        marginLeft: 6,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                      }}
                    >
                      Get Rs.300 OFF on drinks
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>

              <Card
                cardElevation={3}
                cardMaxElevation={3}
                cornerRadius={10}
                style={{ marginHorizontal: 10, marginVertical: 8 }}
              >
                <TouchableOpacity
                  onPress={() => this.togglePromoModal(true, '', true)}
                >
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: '#7a7a7a',
                      borderStyle: 'dashed',
                      paddingVertical: 12,
                      paddingHorizontal: 15,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      minHeight: 50,
                      backgroundColor: '#F0F0F0',
                    }}
                  >
                    {/* <Ionicons name={'pricetag'} size={18} color={'#7a7a7a'} /> */}
                    <FontAwesome6 name="tag" size={18} color="#7a7a7a" solid />

                    <Text
                      style={{
                        color: '#7a7a7a',
                        fontSize: 15,
                        fontWeight: 'bold',
                        marginRight: 6,
                        marginLeft: 6,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                      }}
                    >
                      Have a promo code?...
                    </Text>
                    {/* <Ionicons name={'add'} size={18} color={'#7a7a7a'} /> */}
                    <FontAwesome6 name="plus" size={18} color="#7a7a7a" solid />

                  </View>
                </TouchableOpacity>
              </Card>
            </ScrollView>

            {/* Show applied coupon & saved amount */}
            {/* {appliedCoupon && (
          <View style={{ padding: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              Applied Coupon: {appliedCoupon}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'green' }}>
              Saved Amount: Rs. {savedAmount}
            </Text>
          </View>
        )} */}

            <View style={{ marginHorizontal: 20, marginTop: 15 }}>
              {this.state.appliedCoupon && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 10,
                    backgroundColor: '#f2f9ff',
                    borderWidth: 1,
                    borderColor: '#66b3ff',
                  }}
                >
                  <View style={{ flexDirection: 'column' }}>
                    <Text
                      style={{
                        color: '#0080ff',
                        fontWeight: 'bold',
                        fontSize: 15,
                      }}
                    >
                      🎉 YAY! You saved Rs.{this.state.savedAmount} !
                    </Text>
                    <Text style={{ fontSize: 13, marginTop: 3, color: '#333' }}>
                      {this.state.appliedCoupon || 'None'} Applied!
                    </Text>
                  </View>

                  <TouchableOpacity onPress={this.handleRemoveCoupon}>
                    <Text style={{ color: '#c62828', fontWeight: 'bold' }}>
                      REMOVE
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Select Coupon */}

            <View
              style={{
                height: 0.5,
                marginTop: 30,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: 'black',
              }}
            />

            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 22,
                marginTop: 15,
                textAlign: 'center',
              }}
            >
              Dining type
            </Text>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                marginLeft: 30,
                marginTop: 5,
                marginRight: 30,
                textAlign: 'center',
              }}
            >
              Restaurants fall into several industry classifications, based upon
              menu style, preparation methods and pricing, as well as the means
              by which the food is served to the customer.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Card
                cardElevation={this.state.dineType === 'EatIn' ? 12 : 0}
                cardMaxElevation={12}
                cornerRadius={15}
                style={{ marginTop: 25 }}
              >
                <TouchableOpacity
                  onPress={() => this.onDineinTypePress('EatIn')}
                >
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      backgroundColor:
                        this.state.dineType === 'EatIn' ? 'black' : '#F0F0F0',
                      borderColor:
                        this.state.dineType === 'EatIn' ? 'black' : '#dbdbdb',
                      //  borderWidth: 1.5,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* <Ionicons
                      name="restaurant"
                      size={22}
                      color={
                        this.state.dineType === 'EatIn' ? 'white' : '#ffa363'
                      }
                    /> */}
    <FontAwesome
                      name="cutlery"
                      size={22}
                      color={
                        this.state.dineType === 'PickUp' ? 'white' : '#ffa363'
                      }
                    />
                    <Text
                      style={{
                        marginTop: 20,
                        fontSize: 16,
                        color:
                          this.state.dineType === 'EatIn' ? 'white' : '#7a7a7a',
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_SemiBold'
                            : 'AsapSemiBold',
                      }}
                    >
                      Eat in
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>
              <Card
                cardElevation={this.state.dineType === 'PickUp' ? 12 : 0}
                cardMaxElevation={12}
                cornerRadius={15}
                style={{ marginLeft: 20, marginTop: 25 }}
              >
                <TouchableOpacity
                  onPress={() => this.onDineinTypePress('PickUp')}
                >
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      backgroundColor:
                        this.state.dineType === 'PickUp' ? 'black' : '#F0F0F0',
                      borderColor:
                        this.state.dineType === 'PickUp' ? 'black' : '#dbdbdb',
                      // borderWidth: 1.5,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesome
                      name="shopping-bag"
                      size={22}
                      color={
                        this.state.dineType === 'PickUp' ? 'white' : '#ffa363'
                      }
                    />
                    <Text
                      style={{
                        marginTop: 20,
                        fontSize: 16,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_SemiBold'
                            : 'AsapSemiBold',
                        color:
                          this.state.dineType === 'PickUp'
                            ? 'white'
                            : '#7a7a7a',
                      }}
                    >
                      Pickup
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>
              <Card
                cardElevation={
                  this.state.dineType === 'Delivery' && this.state.isDelivery
                    ? 12
                    : 0
                }
                cardMaxElevation={12}
                cornerRadius={15}
                style={{ marginLeft: 20, marginTop: 25 }}
              >
                <TouchableOpacity
                  onPress={() => this.onDineinTypePress('Delivery')}
                  disabled={!this.state.isDelivery}
                >
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      backgroundColor:
                        this.state.dineType === 'Delivery' &&
                        this.state.isDelivery
                          ? 'black'
                          : '#F0F0F0',
                      borderColor:
                        this.state.dineType === 'Delivery' &&
                        this.state.isDelivery
                          ? 'black'
                          : '#dbdbdb',
                      // borderWidth: 1.5,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: this.state.isDelivery ? 1 : 0.5,
                    }}
                  >
                    <FontAwesome
                      name="truck"
                      size={26}
                      color={
                        this.state.dineType === 'Delivery' &&
                        this.state.isDelivery
                          ? 'white'
                          : '#ffa363'
                      }
                    />
                    <Text
                      style={{
                        marginTop: 17,
                        fontSize: 16,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_SemiBold'
                            : 'AsapSemiBold',
                        color:
                          this.state.dineType === 'Delivery' &&
                          this.state.isDelivery
                            ? 'white'
                            : '#7a7a7a',
                      }}
                    >
                      Delivery
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>
            </View>

            <View
              style={{
                marginLeft: 40,
                marginRight: 40,
                overflow: 'hidden',
                height:
                  this.state.dineType === 'EatIn' ||
                  this.state.dineType === 'PickUp'
                    ? null
                    : 0,
              }}
            >
              <View
                style={{ height: 0.5, marginTop: 30, backgroundColor: 'black' }}
              />
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 20,
                  marginTop: 15,
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                {this.state.dineType === 'EatIn'
                  ? 'EatIn Order Details'
                  : 'PickUp Order Details'}
              </Text>
              <View
                style={{
                  height: 0.5,
                  marginTop: 5,
                  marginBottom: 10,
                  backgroundColor: 'black',
                }}
              />
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 18,
                  marginTop: 10,
                  marginBottom: 10,
                }}
              >
                When would you like to place your order?
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => this.onSchedulePress('Now')}>
                    <View
                      style={{
                        flexDirection: 'row',
                        height: 50,
                        backgroundColor:
                          this.state.scheduleStatus === 'Now'
                            ? 'black'
                            : '#e3e3e3',
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f0f0f0',
                          marginRight: 10,
                          borderRadius: 5,
                        }}
                      >
                        {this.state.scheduleStatus === 'Now' ? (
                          // <IonicIcon
                          //   name="checkmark"
                          //   size={20}
                          //   color={'black'}
                          // />
                          <FontAwesome6 name="check" size={20} color="black" solid />

                        ) : null}
                      </View>
                      <Text
                        style={{
                          marginLeft: 10,
                          marginRight: 20,
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_SemiBold'
                              : 'AsapSemiBold',
                          fontSize: 16,
                          textAlign: 'right',
                          color:
                            this.state.scheduleStatus === 'Now'
                              ? 'white'
                              : 'black',
                        }}
                      >
                        Now
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={() => this.onSchedulePress('Later')}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        height: 50,
                        backgroundColor:
                          this.state.scheduleStatus === 'Later'
                            ? 'black'
                            : '#e3e3e3',
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f0f0f0',
                          marginRight: 10,
                          borderRadius: 5,
                        }}
                      >
                        {this.state.scheduleStatus === 'Later' ? (
                          // <IonicIcon
                          //   name="checkmark"
                          //   size={20}
                          //   color={'black'}
                          // />
                          <FontAwesome6 name="check" size={20} color="black" solid />

                        ) : null}
                      </View>
                      <Text
                        style={{
                          marginLeft: 10,
                          marginRight: 20,
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_SemiBold'
                              : 'AsapSemiBold',
                          fontSize: 16,
                          textAlign: 'right',
                          color:
                            this.state.scheduleStatus === 'Later'
                              ? 'white'
                              : 'black',
                        }}
                      >
                        Later
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {this.state.scheduleStatus === 'Now' ? (
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      color: 'black',
                    }}
                  >
                    Your order will be ready within 30 mins* from the order
                    confirmation.
                  </Text>
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      color: 'black',
                    }}
                  >
                    Current time Sri Lanka (
                    {moment(new Date()).format(' hh:mm:ss A ')})
                  </Text>
                </View>
              ) : (
                <>
                  {/* <View style={{ height: 0.5, marginTop: 20, backgroundColor: 'black' }} /> */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 20,
                      marginLeft: 3,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_SemiBold'
                              : 'AsapSemiBold',
                          fontSize: 18,
                        }}
                      >
                        {this.state.scheduleTime}
                      </Text>
                    </View>
                    <View style={{ flex: 0.4 }}>
                      <TouchableOpacity
                        style={{ alignItems: 'flex-end' }}
                        onPress={() => this.setState({ isEnableTime: true })}
                      >
                        <View
                          style={{
                            width: 140,
                            height: 35,
                            backgroundColor: '#e3e3e3',
                            borderRadius: 100 / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily:
                                Platform.OS === 'ios'
                                  ? 'Asap-Regular'
                                  : 'AsapRegular',
                              fontSize: 16,
                              textAlign: 'center',
                            }}
                          >
                            Schedule Time
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View
              style={{
                marginLeft: 40,
                marginRight: 40,
                overflow: 'hidden',
                height: this.state.dineType === 'Delivery' ? null : 0,
              }}
            >
              <View
                style={{ height: 0.5, marginTop: 30, backgroundColor: 'black' }}
              />
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 20,
                  marginTop: 15,
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                Delivery Order Details
              </Text>
              <View
                style={{
                  height: 0.5,
                  marginTop: 5,
                  marginBottom: 10,
                  backgroundColor: 'black',
                }}
              />
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 18,
                  marginTop: 10,
                  marginBottom: 10,
                }}
              >
                When would you like to place your order?
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => this.onSchedulePress('Now')}>
                    <View
                      style={{
                        flexDirection: 'row',
                        height: 50,
                        backgroundColor:
                          this.state.scheduleStatus === 'Now'
                            ? 'black'
                            : '#e3e3e3',
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f0f0f0',
                          marginRight: 10,
                          borderRadius: 5,
                        }}
                      >
                        {this.state.scheduleStatus === 'Now' ? (
                          // <IonicIcon
                          //   name="checkmark"
                          //   size={20}
                          //   color={'black'}
                          // />
                          <FontAwesome6 name="check" size={20} color="black" solid />
                        ) : null}
                      </View>
                      <Text
                        style={{
                          marginLeft: 10,
                          marginRight: 20,
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_SemiBold'
                              : 'AsapSemiBold',
                          fontSize: 16,
                          textAlign: 'right',
                          color:
                            this.state.scheduleStatus === 'Now'
                              ? 'white'
                              : 'black',
                        }}
                      >
                        Now
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity
                    onPress={() => this.onSchedulePress('Later')}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        height: 50,
                        backgroundColor:
                          this.state.scheduleStatus === 'Later'
                            ? 'black'
                            : '#e3e3e3',
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 5,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f0f0f0',
                          marginRight: 10,
                          borderRadius: 5,
                        }}
                      >
                        {this.state.scheduleStatus === 'Later' ? (
                          // <IonicIcon
                          //   name="checkmark"
                          //   size={20}
                          //   color={'black'}
                          // />
                          <FontAwesome6 name="check" size={20} color="black" solid />
                        ) : null}
                      </View>
                      <Text
                        style={{
                          marginLeft: 10,
                          marginRight: 20,
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_SemiBold'
                              : 'AsapSemiBold',
                          fontSize: 16,
                          textAlign: 'right',
                          color:
                            this.state.scheduleStatus === 'Later'
                              ? 'white'
                              : 'black',
                        }}
                      >
                        Later
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {this.state.scheduleStatus === 'Now' ? (
                <View style={{ marginTop: 20 }}>
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      color: 'black',
                    }}
                  >
                    Your order will be ready within 30 mins* from the order
                    confirmation.
                  </Text>
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      color: 'black',
                    }}
                  >
                    Current time Sri Lanka (
                    {moment(new Date()).format(' hh:mm:ss A ')})
                  </Text>
                </View>
              ) : (
                <>
                  {/* <View style={{ height: 0.5, marginTop: 20, backgroundColor: 'black' }} /> */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 20,
                      marginLeft: 3,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_SemiBold'
                              : 'AsapSemiBold',
                          fontSize: 18,
                        }}
                      >
                        {this.state.scheduleTime}
                      </Text>
                    </View>
                    <View style={{ flex: 0.4 }}>
                      <TouchableOpacity
                        style={{ alignItems: 'flex-end' }}
                        onPress={() => this.setState({ isEnableTime: true })}
                      >
                        <View
                          style={{
                            width: 140,
                            height: 35,
                            backgroundColor: '#e3e3e3',
                            borderRadius: 100 / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily:
                                Platform.OS === 'ios'
                                  ? 'Asap-Regular'
                                  : 'AsapRegular',
                              fontSize: 16,
                              textAlign: 'center',
                            }}
                          >
                            Schedule Time
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              <View
                style={{ height: 0.5, marginTop: 20, backgroundColor: 'black' }}
              />

              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 18,
                  marginTop: 10,
                  marginBottom: 10,
                }}
              >
                Where would you like your order be delivered to?
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                    }}
                  >
                    {this.state.address}
                  </Text>
                </View>
                <View style={{ flex: 0.4 }}>
                  <TouchableOpacity
                    style={{ alignItems: 'flex-end' }}
                    onPress={() => this.RBSheet.open()}
                  >
                    <View
                      style={{
                        width: 80,
                        height: 35,
                        backgroundColor: '#e3e3e3',
                        borderRadius: 100 / 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular'
                              : 'AsapRegular',
                          fontSize: 16,
                          textAlign: 'right',
                        }}
                      >
                        Change
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              {/* <View style={{ height: 0.5, marginTop: 20, backgroundColor: 'black' }} /> */}
            </View>

            <View
              style={{
                height: 0.5,
                marginTop: 20,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: 'black',
              }}
            />

            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Asap-Regular_SemiBold'
                    : 'AsapSemiBold',
                fontSize: 22,
                marginLeft: 30,
                marginTop: 25,
                marginBottom: 2,
                marginRight: 30,
                textAlign: 'center',
              }}
            >
              Payment type
            </Text>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 16,
                marginLeft: 30,
                marginTop: 5,
                marginRight: 30,
                textAlign: 'center',
              }}
            >
              Payment is the transfer of money or goods and services in exchange
              for a product or service.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Card
                cardElevation={this.state.paymentType === 'Card' ? 12 : 0}
                cardMaxElevation={12}
                cornerRadius={15}
                style={{ marginTop: 25 }}
              >
                <TouchableOpacity onPress={() => this.onCardPress()}>
                  <View
                    style={{
                      flexDirection: 'row',
                      width: 150,
                      height: 60,
                      backgroundColor:
                        this.state.paymentType === 'Card' ? 'black' : '#F0F0F0',
                      borderColor:
                        this.state.paymentType === 'Card' ? 'black' : '#dbdbdb',
                      // borderWidth: 1.5,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* <Ionicons
                      name="card"
                      size={22}
                      color={
                        this.state.paymentType === 'Card' ? 'white' : '#ffa363'
                      }
                    /> */}
                    <FontAwesome6
  name="credit-card"
  size={22}
  color={this.state.paymentType === 'Card' ? 'white' : '#ffa363'}
  solid
/>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_SemiBold'
                            : 'AsapSemiBold',
                        marginLeft: 20,
                        color:
                          this.state.paymentType === 'Card'
                            ? 'white'
                            : '#7a7a7a',
                      }}
                    >
                      Card
                    </Text>
                  </View>
                </TouchableOpacity>
                {/* <View style={{ position: 'absolute', width: 150, height: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15 }}>
                                    <Text style={{ color: 'white', fontFamily: Platform.OS === "ios" ? 'Asap-Regular_SemiBold' : 'AsapSemiBold', fontSize: 16 }}>Coming soon</Text>
                                </View> */}
              </Card>

              <Card
                cardElevation={this.state.paymentType === 'Cash' ? 12 : 0}
                cardMaxElevation={12}
                cornerRadius={15}
                style={{ marginLeft: 20, marginTop: 25 }}
              >
                <TouchableOpacity onPress={() => this.onCashPress()}>
                  <View
                    style={{
                      flexDirection: 'row',
                      width: 150,
                      height: 60,
                      backgroundColor:
                        this.state.paymentType === 'Cash' ? 'black' : '#F0F0F0',
                      borderColor:
                        this.state.paymentType === 'Cash' ? 'black' : '#dbdbdb',
                      // borderWidth: 1.5,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* <Ionicons
                      name="cash"
                      size={22}
                      color={
                        this.state.paymentType === 'Cash' ? 'white' : '#ffa363'
                      }
                    /> */}
                    <FontAwesome6
  name="money-bill"
  size={22}
  color={this.state.paymentType === 'Cash' ? 'white' : '#ffa363'}
  solid
/>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_SemiBold'
                            : 'AsapSemiBold',
                        marginLeft: 20,
                        color:
                          this.state.paymentType === 'Cash'
                            ? 'white'
                            : '#7a7a7a',
                      }}
                    >
                      Cash
                    </Text>
                  </View>
                </TouchableOpacity>
              </Card>
            </View>

            {/* <View style={[{ overflow: 'hidden', margin: this.state.paymentType === "Card" ? 10 : 0 }, { height: this.state.paymentType === "Card" ? null : 0 }]} >
                            {this.state.cardlist.length > 0 ? this.renderCard() : (
                                <View style={{ margin: 10, marginTop: 20 }}>
                                    <TouchableOpacity onPress={() => this.props.navigation.navigate("CreditCardScreen")}>
                                        <View style={{ flexDirection: 'row', margin: 10, alignItems: 'center' }}>
                                            <IonicIcon name="add-circle" size={30} />
                                            <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Medium' : 'AsapMedium' }}>Add Credit or Debit card</Text>
                                            <IonicIcon name="chevron-forward" size={30} />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View> */}

            <View
              style={{
                height: 0.5,
                marginTop: 30,
                marginBottom: 10,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: 'black',
              }}
            />

            {/*Location select was removed becus it wah moved to dashbored screen nad locatin will be select when the app open */}

            {/*<Text style={{*/}
            {/*    fontFamily: Platform.OS === "ios" ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',*/}
            {/*    fontSize: 22,*/}
            {/*    marginLeft: 30,*/}
            {/*    marginTop: 10,*/}
            {/*    marginBottom: 2,*/}
            {/*    marginRight: 30,*/}
            {/*    textAlign: 'center'*/}
            {/*}}>Location type</Text>*/}
            {/*<Text style={{*/}
            {/*    fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular',*/}
            {/*    fontSize: 16,*/}
            {/*    marginLeft: 30,*/}
            {/*    marginTop: 5,*/}
            {/*    marginRight: 30,*/}
            {/*    textAlign: 'center'*/}
            {/*}}>Pick a nearest location you have. Then we can offer quick and best*/}
            {/*    quality service to you.</Text>*/}

            {/*<View style={{flexDirection: 'row', justifyContent: 'center'}}>*/}
            {/*    {this.renderLoactions(this.state.locationList)}*/}
            {/*</View>*/}

            {/*<View style={{*/}
            {/*    height: 0.5,*/}
            {/*    marginTop: 20,*/}
            {/*    marginBottom: 5,*/}
            {/*    marginRight: 30,*/}
            {/*    marginLeft: 30,*/}
            {/*    backgroundColor: 'black'*/}
            {/*}}/>*/}

            {/* <TouchableOpacity onPress={() => { this.SRBSheet.open() }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 30, marginRight: 30, marginTop: 10, marginBottom: 10 }}>
                                <CheckBox
                                    value={this.state.isChecked}
                                    style={{ marginRight: 18, width: 30, height: 30 }}
                                    onCheckColor={'black'}
                                    onTintColor={'black'}
                                    tintColors={{ true: 'black', false: 'black' }}
                                    onAnimationType={'fill'} />
                                <Text style={{ flex: 1, fontSize: 18, fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular' }}>I have read and agree to the terms and conditions</Text>
                            </View>
                        </TouchableOpacity> */}
          </View>
        </Animated.ScrollView>

        <TouchableOpacity
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
            marginLeft: 30,
            marginRight: 30,
            marginBottom: 20,
          }}
          onPress={() => this.onPlaceorderPress()}
        >
          <View
            style={{
              width: '100%',
              height: 50,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'black',
              flexDirection: 'row',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 18,
                marginRight: 20,
                marginLeft: 50,
              }}
            >
              Place Order
            </Text>
            <ActivityIndicator
              animating={this.state.isOrderPlaced}
              color={'white'}
              size={25}
            />
          </View>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.header,
            { transform: [{ translateY: headerTranslateY }] },
          ]}
        >
          <Animated.View
            style={[
              {
                marginTop: 80,
                marginLeft: 30,
              },
              {
                transform: [
                  { translateX: titleTranslateX },
                  { scale: titleScale },
                  { translateY: titleTranslateY },
                ],
              },
            ]}
          >
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 28,
              }}
            >
              Checkout
            </Text>
          </Animated.View>
        </Animated.View>

        <TouchableOpacity
          style={{ top: 30, left: 20, position: 'absolute' }}
          onPress={() => this.props.navigation.goBack()}
        >
          <Animated.View
            style={[
              {
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              },
              {
                transform: [
                  { scale: buttonScale },
                  { translateY: buttonTranslateY },
                ],
              },
            ]}
          >
            <Image
              source={require('../assets/left-arrow.png')}
              style={{ width: 20, height: 20 }}
            />
          </Animated.View>
        </TouchableOpacity>

        <RBSheet
          ref={ref => {
            this.RBSheet = ref;
          }}
          height={300}
          openDuration={850}
          closeOnDragDown={true}
          closeOnPressMask={true}
          customStyles={{
            wrapper: {
              backgroundColor: 'transparent',
            },
            draggableIcon: {
              backgroundColor: '#000',
            },
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                margin: 10,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 18,
                color: 'black',
                alignSelf: 'center',
              }}
            >
              Change Delivery Address
            </Text>
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
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                justifyContent: 'center',
                color: 'black',
                textAlignVertical: 'top',
                marginLeft: 20,
                marginRight: 20,
                marginBottom: 10,
              }}
              multiline={true}
              blurOnSubmit={true}
              keyboardType={'default'}
              placeholderTextColor={'#7a7a7a'}
              onChangeText={address => this.setState({ typeaddress: address })}
            />
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
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                justifyContent: 'center',
                color: 'black',
                textAlignVertical: 'center',
                marginLeft: 20,
                marginRight: 20,
                marginBottom: 10,
              }}
              multiline={false}
              blurOnSubmit={true}
              keyboardType={'default'}
              placeholder={'City'}
              placeholderTextColor={'#7a7a7a'}
              onChangeText={address => this.setState({ typeaddress: address })}
            />
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                margin: 5,
              }}
              onPress={() => this.onChageAddress()}
            >
              <View
                style={{
                  width: '92%',
                  height: 45,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'black',
                  borderRadius: 5,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 18,
                  }}
                >
                  Done
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </RBSheet>

        <RBSheet
          ref={ref => {
            this.SRBSheet = ref;
          }}
          animationType={'fade'}
          height={600}
          openDuration={700}
          closeDuration={700}
          closeOnDragDown={false}
          closeOnPressMask={true}
          closeOnPressBack={true}
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
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                marginLeft: 30,
                marginTop: 30,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity onPress={() => this.SRBSheet.close()}>
                {/* <Ionicons
                  name={'arrow-back-outline'}
                  size={30}
                  color={'black'}
                /> */}
                <FontAwesome6 name="arrow-left" size={30} color="black" solid />
              </TouchableOpacity>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 24,
                  color: 'black',
                  marginLeft: 30,
                }}
              >
                Summary
              </Text>
            </View>

            <View
              style={{
                height: 0.5,
                marginBottom: 20,
                marginLeft: 20,
                marginRight: 20,
                backgroundColor: 'black',
              }}
            />

            <ScrollView>
              {/* <View style={{ height: 0.9, marginBottom: 20, marginLeft: 20, marginRight: 20, backgroundColor: 'black' }} /> */}

              {this.renderCartItems(this.state.isClickList)}

              <View
                style={{
                  height: 0.5,
                  marginBottom: 20,
                  marginLeft: 20,
                  marginRight: 20,
                  marginTop: 20,
                  backgroundColor: 'black',
                }}
              />

              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 18,
                  marginLeft: 20,
                }}
              >
                BILLING INFORMATION
              </Text>

              <View
                style={{
                  height: 0.5,
                  marginTop: 20,
                  marginLeft: 20,
                  marginRight: 20,
                  backgroundColor: 'black',
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 20,
                  marginLeft: 30,
                  marginRight: 30,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 18,
                    color: 'black',
                  }}
                >
                  Sub Total
                </Text>
                <NumericFormat
                  value={this.state.subTotal}
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
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 18,
                        textAlign: 'right',
                        color: 'black',
                      }}
                    >
                      {formattedValue}
                    </Text>
                  )} // <--- Don't forget this!
                />
              </View>

              {this.state.tax !== 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 5,
                    marginLeft: 30,
                    marginRight: 30,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 18,
                      color: 'black',
                    }}
                  >
                    Tax
                  </Text>
                  <NumericFormat
                    value={this.state.tax}
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
                            Platform.OS === 'ios'
                              ? 'Asap-Regular'
                              : 'AsapRegular',
                          fontSize: 20,
                          textAlign: 'right',
                          color: 'black',
                        }}
                      >
                        {formattedValue}
                      </Text>
                    )} // <--- Don't forget this!
                  />
                </View>
              ) : null}

              {this.state.discount !== 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 5,
                    marginLeft: 30,
                    marginRight: 30,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 18,
                      color: 'black',
                    }}
                  >
                    Discount
                  </Text>
                  <NumericFormat
                    value={this.state.discount}
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
                            Platform.OS === 'ios'
                              ? 'Asap-Regular'
                              : 'AsapRegular',
                          fontSize: 20,
                          textAlign: 'right',
                          color: 'black',
                        }}
                      >
                        {formattedValue}
                      </Text>
                    )} // <--- Don't forget this!
                  />
                </View>
              ) : null}
              {this.state.dineType === 'Delivery' ? (
                this.state.deliveryCharge !== 0 ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 5,
                      marginLeft: 30,
                      marginRight: 30,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 18,
                        color: 'black',
                      }}
                    >
                      Delivery Charge
                    </Text>
                    <NumericFormat
                      value={this.state.deliveryCharge}
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
                              Platform.OS === 'ios'
                                ? 'Asap-Regular'
                                : 'AsapRegular',
                            fontSize: 20,
                            textAlign: 'right',
                            color: 'black',
                          }}
                        >
                          {formattedValue}
                        </Text>
                      )} // <--- Don't forget this!
                    />
                  </View>
                ) : null
              ) : null}
              {this.state.dineType === 'PickUp' ||
              this.state.dineType === 'EatIn' ? (
                this.state.serviceCharge !== 0 ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 5,
                      marginLeft: 30,
                      marginRight: 30,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 18,
                        color: 'black',
                      }}
                    >
                      Service Charge
                    </Text>
                    <NumericFormat
                      value={this.state.serviceCharge}
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
                              Platform.OS === 'ios'
                                ? 'Asap-Regular'
                                : 'AsapRegular',
                            fontSize: 20,
                            textAlign: 'right',
                            color: 'black',
                          }}
                        >
                          {formattedValue}
                        </Text>
                      )} // <--- Don't forget this!
                    />
                  </View>
                ) : null
              ) : null}
              {this.state.subTotal !== this.state.netTotal ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 5,
                    marginLeft: 30,
                    marginRight: 30,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 18,
                      color: 'black',
                    }}
                  >
                    Net Total
                  </Text>
                  <NumericFormat
                    value={this.state.netTotal}
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
                            Platform.OS === 'ios'
                              ? 'Asap-Regular'
                              : 'AsapRegular',
                          fontSize: 18,
                          textAlign: 'right',
                          color: 'black',
                        }}
                      >
                        {formattedValue}
                      </Text>
                    )} // <--- Don't forget this!
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

              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 18,
                  marginLeft: 20,
                }}
              >
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
                }}
              >
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
                }}
              >
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 17,
                    color: '#9c9c9c',
                  }}
                >
                  Payment Type :
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 17,
                    marginLeft: 10,
                  }}
                >
                  {this.state.paymentType === ''
                    ? 'Not Selected'
                    : this.state.paymentType}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 20,
                }}
              >
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 17,
                    color: '#9c9c9c',
                  }}
                >
                  Location :
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 17,
                    marginLeft: 10,
                  }}
                >
                  {this.state.locationPressed === ''
                    ? 'Not Selected'
                    : this.state.locationPressed}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 3,
                  marginLeft: 20,
                }}
              >
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 17,
                    color: '#9c9c9c',
                  }}
                >
                  Dine Type :
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 17,
                    marginLeft: 10,
                  }}
                >
                  {this.state.dineType === 'null'
                    ? 'Not Selected'
                    : this.state.dineType}
                </Text>
              </View>
              {this.state.dineType === 'Delivery' ? (
                <View
                  style={{
                    flexDirection: 'row',
                    marginTop: 3,
                    marginLeft: 20,
                    marginRight: 20,
                  }}
                >
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 17,
                      color: '#9c9c9c',
                    }}
                  >
                    Delivery Address :
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      fontSize: 17,
                      marginLeft: 10,
                    }}
                  >
                    {this.state.address}
                  </Text>
                </View>
              ) : null}

              <View
                style={{
                  height: 0.9,
                  marginTop: 20,
                  marginLeft: 20,
                  marginRight: 20,
                  backgroundColor: 'black',
                }}
              />
            </ScrollView>
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 20,
                marginLeft: 30,
                marginRight: 30,
                marginBottom: 20,
              }}
              onPress={() => this.onAgreePress()}
            >
              <View
                style={{
                  width: '100%',
                  height: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'black',
                  flexDirection: 'row',
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                    fontSize: 18,
                    marginRight: 20,
                    marginLeft: 50,
                  }}
                >
                  I Agree
                </Text>
                <ActivityIndicator
                  animating={this.state.isOrderPlaced}
                  color={'white'}
                  size={25}
                />
              </View>
            </TouchableOpacity>
          </View>
        </RBSheet>

        <RBSheet
          ref={ref => {
            this.RRBSheet = ref;
          }}
          animationType={'fade'}
          height={355}
          openDuration={700}
          closeDuration={700}
          closeOnDragDown={false}
          closeOnPressMask={false}
          closeOnPressBack={false}
          customStyles={{
            wrapper: {
              backgroundColor: 'rgba(0,0,0,0.6)',
            },
            draggableIcon: {
              backgroundColor: '#000',
            },
          }}
        >
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ marginTop: 30, marginBottom: 10 }}>
              <Image
                source={require('../assets/4.png')}
                style={{ width: 110, height: 110, borderRadius: 110 / 2 }}
              />
            </View>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 24,
                color: 'black',
              }}
            >
              Thank you for your order!
            </Text>
            <Text
              style={{
                marginLeft: 50,
                marginRight: 50,
                marginTop: 5,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 15,
                color: '#5C5C5C',
                textAlign: 'center',
              }}
            >
              We take pride using only the best ingredients for the food that
              ends up on your table.
            </Text>
            <View style={{ marginTop: 25 }}>
              <TouchableOpacity onPress={() => this.onContinuShoppingPress()}>
                <View
                  style={{
                    width: 300,
                    height: 60,
                    backgroundColor: 'black',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                  }}
                >
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      fontSize: 18,
                      color: 'white',
                      marginRight: 20,
                      marginLeft: 20,
                    }}
                  >
                    Done
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </RBSheet>

        <DateTimePickerModal
          isVisible={this.state.isEnableTime}
          mode="time"
          date={new Date()}
          onConfirm={this.handleConfirm}
          onCancel={this.hideDatePicker}
          display={Platform.OS === 'ios' ? null : 'spinner'}
        />

        {this.state.dialogVisible && (
          <View
            style={{
              position: 'absolute',
              height: '100%',
              width: '100%',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertDialog
              onbuttonPress={() => {
                this.setState({ dialogVisible: false });
              }}
              message={this.state.status_message}
            />
          </View>
        )}

        {/* Coupon Modal */}

        <Modal
          transparent
          visible={this.state.promoModalVisible}
          animationType="slide"
          onRequestClose={() => this.togglePromoModal(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={() => this.togglePromoModal(false)}
                style={{
                  position: 'absolute',
                  top: 15,
                  right: 15,
                  padding: 5,
                }}
              >
                {/* <Ionicons name="close" size={22} color="#333" /> */}
                <FontAwesome6 name="xmark" size={22} color="#333" solid />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginBottom: 15,
                }}
              >
                Enter promo code
              </Text>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderStyle: 'dashed',
                  borderRadius: 8,
                  padding: 12,
                  width: '100%',
                  marginBottom: 20,
                  color: this.state.isCustomPromo ? '#000' : '#666',
                }}
                placeholder="Enter promo code"
                placeholderTextColor="#aaa"
                value={this.state.promoCode}
                editable={this.state.isCustomPromo}
                onChangeText={text => this.setState({ promoCode: text })}
              />

              <TouchableOpacity
                style={{
                  backgroundColor: '#ffcc00',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 40,
                  alignItems: 'center',
                  width: '100%',
                }}
                onPress={this.ApplyCoupon}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}
                >
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  onClearCart = async () => {
    try {
      // Get all AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      console.log('All keys in storage:', keys);

      // Keys you want to keep
      const keepKeys = [
        'address',
        'firstname',
        'lastname',
        'email',
        'phonenumber',
        'city',
        'OrderID',
        'EditStatus',
        'fcmToken',
        'LOCA',
        'LOCA_NAME',
      ];

      // Remove only cart-related keys
      const removeKeys = keys.filter(k => !keepKeys.includes(k));

      if (removeKeys.length > 0) {
        console.log('Keys to remove:', removeKeys);
        await AsyncStorage.multiRemove(removeKeys);
      }

      // Clear Redux + local state
      this.props.resetCart();
      this.setState({ list: [], Additionallist: [] });

      console.log('Cart cleared successfully');
    } catch (error) {
      console.log('Failed to clear cart:', error);
    }
  };

  async OnlineOrderDataSave() {
    let DeliveryCharge = 0;
    let ServiceCharge = 0;

    let OrderID = await AsyncStorage.getItem('OrderID');
    let Mobile = await AsyncStorage.getItem('phonenumber');
    let Address = '';
    const ItemList = this.props.cartItems;
    this.setState({ OrderID: OrderID });

    switch (this.state.dineType) {
      case 'EatIn':
        DeliveryCharge = 0;
        ServiceCharge = this.state.serviceCharge;
        break;
      case 'PickUp':
        DeliveryCharge = 0;
        ServiceCharge = this.state.serviceCharge;
        break;
      case 'Delivery':
        Address = this.state.address;
        DeliveryCharge = this.state.deliveryCharge;
        ServiceCharge = 0;
        break;

      default:
        break;
    }

    let Order = {
      OrderID: OrderID,
      Mobile: Mobile,
      Tax: this.state.tax,
      Version: getVersion(),
      Discount: this.state.discount,
      DeliveryCharge: DeliveryCharge,
      ServiceCharge: ServiceCharge,
      SubTotal: this.state.subTotal,
      NetTotal: this.state.netTotal,
      DineType: this.state.dineType,
      DeliveryAddress: Address,
      PaymentType: this.state.paymentType,
      ScheduleTime: this.state.scheduleTime,
      BranchLocation: this.state.locationPressed,
      Items: ItemList,
      isPayment: true,
    };

    fetch(PLACEORDERURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(Order),
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        if (json.strRturnRes === true) {
          this.RRBSheet.open();
          this.onClearAsync();
        }
      })
      .catch(er => {
        console.log('onPlaceorderPress', er);
        this.touchableInactive = false;
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
            },
          ],
          { cancelable: false },
        );
      });
  }

  async OnlineOrderDataSaveBeforPay(isCard) {
    let DeliveryCharge = 0;
    let ServiceCharge = 0;

    let OrderID = await AsyncStorage.getItem('OrderID');
    let Mobile = await AsyncStorage.getItem('phonenumber');
    let Address = '';
    const ItemList = this.props.cartItems;
    this.setState({ OrderID: OrderID });

    switch (this.state.dineType) {
      case 'EatIn':
        DeliveryCharge = 0;
        ServiceCharge = this.state.serviceCharge;
        break;
      case 'PickUp':
        DeliveryCharge = 0;
        ServiceCharge = this.state.serviceCharge;
        break;
      case 'Delivery':
        Address = this.state.address;
        DeliveryCharge = this.state.deliveryCharge;
        ServiceCharge = 0;
        break;

      default:
        break;
    }

    let Order = {
      OrderID: OrderID,
      Mobile: Mobile,
      Tax: this.state.tax,
      Version: getVersion(),
      Discount: this.state.discount,
      DeliveryCharge: DeliveryCharge,
      ServiceCharge: ServiceCharge,
      SubTotal: this.state.subTotal,
      NetTotal: this.state.netTotal,
      DineType: this.state.dineType,
      DeliveryAddress: Address,
      PaymentType: this.state.paymentType,
      ScheduleTime: this.state.scheduleTime,
      BranchLocation: this.state.locationPressed,
      Items: ItemList,
    };

    fetch(PLACEORDERURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(Order),
    })
      .then(res => {
        return res.json();
      })
      .then(json => {
        if (json.strRturnRes === true) {
          // this.RRBSheet.open();
          // this.onClearAsync();
          // this.onClearCart();
          this.props.onClearCart;
          if (isCard) {
            this.onCardPayment(this.state.DefaultEmail);
          } else {
            this.OnlineOrderDataSave();
          }
        }
      })
      .catch(er => {
        console.log('onPlaceorderPress', er);
        this.touchableInactive = false;
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
            },
          ],
          { cancelable: false },
        );
      });
  }
}

const mapDispatchToProps = dispatch => {
  return {
    resetCart: () => dispatch({ type: 'RESET_CART' }),
  };
};

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CheckoutScreen);

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    height: HEADER_MAX_HEIGHT,
  },
  headerBackground: {
    width: '100%',
    height: HEADER_MAX_HEIGHT,
  },
  headerImage: {
    width: '100%',
    height: HEADER_MAX_HEIGHT,
    position: 'absolute',
  },
});
