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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Card } from 'react-native-paper';
import CheckBox from '@react-native-community/checkbox';
import { NumericFormat } from 'react-number-format';
import { connect } from 'react-redux';
import { openDatabase } from 'react-native-sqlite-storage';
import RadioButton from 'react-native-radio-button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RBSheet from 'react-native-raw-bottom-sheet';
import { APIURL, PLACEORDERURL } from '../Data/CloneData';
import moment from 'moment';
import { getVersion } from 'react-native-device-info';
import PayHere from '@payhere/payhere-mobilesdk-reactnative';
import AlertDialog from '../Components/AlertDialog';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import DatePicker from 'react-native-date-picker';
import { withTheme } from '../Context/ThemeContext'; // ← NEW
import ThemeToggle from '../Components/ThemeToggle'; // ← NEW

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
      selectedDate: new Date(),
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
      isDelivery: false,
      zoomIn: new Animated.Value(1),
      glowAnim: new Animated.Value(0),
      coupons: [],
      couponValue: '',
    };

    this.touchableInactive = false;
    this.RBSheetTouchableInactive = false;

    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  componentDidMount() {
    this.startGlow();
    this.initializeScreen();

    this._unsubscribe = this.props.navigation.addListener('focus', () => {
      this.getCoupons();
      this.GetTaxNetTotal(this.state.dineType);
      this.checkDeliveryAvailability();
    });

    this._unsubscribeBlur = this.props.navigation.addListener('blur', () => {
      this.touchableInactive = false;
      this.RBSheetTouchableInactive = false;
    });
  }

  initializeScreen = () => {
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

    this.setState({
      isClickList: list,
      appliedCoupon: null,
      savedAmount: 0,
      promoCode: '',
      couponValue: '',
    });

    this.GetRegisterdCreditCard();
    this.getCoupons();
    this.GetTaxNetTotal('null');
    this.GetAddress();
    this._retrieveData();
    this.checkDeliveryAvailability();
  };

  componentWillUnmount() {
    if (this._unsubscribe) this._unsubscribe();
    if (this._unsubscribeBlur) this._unsubscribeBlur();
    if (this.CalculateTime) clearTimeout(this.CalculateTime);
    this.touchableInactive = false;
    this.RBSheetTouchableInactive = false;
    if (this.RBSheet) this.RBSheet.close();
    if (this.SRBSheet) this.SRBSheet.close();
    if (this.RRBSheet) this.RRBSheet.close();
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
      if (value !== null) this.setState({ locationPressed: value });
    } catch (error) {
      console.log(error);
    }
  };

  togglePromoModal = (visible, code = '', isCustom = false) => {
    this.setState({ promoModalVisible: visible, promoCode: code, isCustomPromo: isCustom });
  };

  handleApplyPromo = () => {
    const { promoCode, coupons, subTotal } = this.state;
    if (promoCode.trim() !== '') {
      const matchedCoupon = coupons.find(c => c.coupon === promoCode);
      if (matchedCoupon) {
        let discountAmount = 0;
        const couponValue = matchedCoupon.value;
        if (typeof couponValue === 'string' && couponValue.includes('%')) {
          const percentage = parseFloat(couponValue.replace('%', ''));
          discountAmount = (subTotal * percentage) / 100;
        } else {
          discountAmount = parseFloat(couponValue);
        }
        this.setState(
          { appliedCoupon: promoCode, savedAmount: discountAmount, couponValue, isCustomPromo: false },
          () => { this.GetTaxNetTotal(this.state.dineType); },
        );
      } else {
        Alert.alert('Invalid Coupon', 'This coupon code is not valid or has expired.');
      }
    }
    this.togglePromoModal(false);
  };

  getCouponIcon = coupon => {
    const couponText = (coupon.coupon || '').toLowerCase();
    const description = (coupon.description || '').toLowerCase();
    if (couponText.includes('1000') || description.includes('1000')) return { name: 'bookmark', color: '#ffa363' };
    if (description.includes('spend') || description.includes('above')) return { name: 'basket-shopping', color: '#7a7a7a' };
    if (description.includes('weekend')) return { name: 'tag', color: '#7a7a7a' };
    if (description.includes('drink')) return { name: 'beer-mug-empty', color: '#7a7a7a' };
    return { name: 'tag', color: '#7a7a7a' };
  };

  handleRemoveCoupon = () => {
    this.setState({ appliedCoupon: null, savedAmount: 0, promoCode: '', couponValue: '' },
      () => { this.GetTaxNetTotal(this.state.dineType); });
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
        for (let i = 0; i < results.rows.length; ++i) temp.push(results.rows.item(i));
        this.setState({ cardlist: temp });
      });
    });
  };

  GetTaxNetTotal = async DineType => {
    var mobilenumber = await AsyncStorage.getItem('phonenumber');
    fetch(APIURL, {
      method: 'POST', cache: 'no-cache',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify({
        HasReturnData: 'T',
        Parameters: [
          { Para_Data: '94',              Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
          { Para_Data: mobilenumber,      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'varchar' },
          { Para_Data: this.state.subTotal, Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'varchar' },
          { Para_Data: DineType,          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'varchar' },
        ],
        SpName: 'sp_Android_Common_API', con: '1',
      }),
    })
      .then(res => res.json())
      .then(json => {
        let calculatedNetTotal = json.CommonResult.Table[0].NetTotal;
        if (this.state.savedAmount > 0) calculatedNetTotal -= this.state.savedAmount;
        this.setState({
          tax: json.CommonResult.Table[0].Tax,
          deliveryCharge: json.CommonResult.Table[0].DeliveryCharge,
          discount: json.CommonResult.Table[0].Discount,
          serviceCharge: json.CommonResult.Table[0].ServiceCharge,
          netTotal: calculatedNetTotal,
        });
      })
      .catch(er => {
        Alert.alert('Warning', "The operation coundn't be completed.",
          [{ text: 'Try Again', onPress: () => this.GetTaxNetTotal() }], { cancelable: false });
      })
      .finally(() => { this.GetLocation(); });
  };

  GetLocation = () => {
    fetch(APIURL, {
      method: 'POST', cache: 'no-cache',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify({
        HasReturnData: 'T',
        Parameters: [{ Para_Data: '101', Para_Direction: 'Input', Para_Lenth: 10, Para_Name: '@Iid', Para_Type: 'int' }],
        SpName: 'sp_Android_Common_API', con: '1',
      }),
    })
      .then(res => res.json())
      .then(json => {
        const Locations = json.CommonResult.Table.map(element => ({ name: element.location }));
        this.setState({ locationList: Locations });
      })
      .catch(er => { console.log('GetLocation', er); })
      .finally(() => { this.IsVerifiedEmail(); });
  };

  IsVerifiedEmail = async () => {
    const mobile = await AsyncStorage.getItem('phonenumber');
    fetch(APIURL, {
      method: 'POST', cache: 'no-cache',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify({
        HasReturnData: 'T',
        Parameters: [
          { Para_Data: '109',  Para_Direction: 'Input', Para_Lenth: 10,    Para_Name: '@Iid',   Para_Type: 'int'     },
          { Para_Data: mobile, Para_Direction: 'Input', Para_Lenth: 50000, Para_Name: '@Text1', Para_Type: 'varchar' },
        ],
        SpName: 'sp_Android_Common_API', con: '1',
      }),
    })
      .then(res => res.json())
      .then(json => {
        this.setState({
          DefaultEmail: json.CommonResult.Table[0].Email,
          isEmailVerified: json.CommonResult.Table[0].EmailVerified,
        });
      });
  };

  ApplyCoupon = async () => {
    const { promoCode, subTotal, coupons } = this.state;
    this.togglePromoModal(false);
    const matchedCoupon = coupons.find(c => c.coupon === promoCode);
    if (matchedCoupon) {
      let discountAmount = 0;
      const couponValue = matchedCoupon.value;
      if (typeof couponValue === 'string' && couponValue.includes('%')) {
        discountAmount = (subTotal * parseFloat(couponValue.replace('%', ''))) / 100;
      } else {
        discountAmount = parseFloat(couponValue);
      }
      this.setState({ appliedCoupon: promoCode, savedAmount: discountAmount, couponValue, isCustomPromo: false },
        () => { this.GetTaxNetTotal(this.state.dineType); });
      return;
    }
    try {
      const res = await fetch(APIURL, {
        method: 'POST', cache: 'no-cache',
        headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
        body: JSON.stringify({
          HasReturnData: 'T',
          Parameters: [
            { Para_Data: '125',      Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
            { Para_Data: promoCode,  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'varchar' },
            { Para_Data: subTotal,   Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'varchar' },
          ],
          SpName: 'sp_Android_Common_API', con: '1',
        }),
      });
      const json = await res.json();
      if (json.strRturnRes) {
        const result = json.CommonResult.Table[0];
        if (result.SUCESS === 'SUCESS') {
          let discountAmount = 0;
          const apiCouponValue = result.VALUE || result.value || result.Discount;
          if (typeof apiCouponValue === 'string' && apiCouponValue.includes('%')) {
            discountAmount = (subTotal * parseFloat(apiCouponValue.replace('%', ''))) / 100;
          } else {
            discountAmount = parseFloat(apiCouponValue);
          }
          this.setState({ appliedCoupon: promoCode, savedAmount: discountAmount, couponValue: apiCouponValue },
            () => { this.GetTaxNetTotal(this.state.dineType); });
        } else {
          this.setState({ appliedCoupon: null, savedAmount: 0, couponValue: '' });
          Alert.alert('Invalid Coupon', result.MSG || 'Invalid coupon');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate coupon. Please try again.');
    }
  };

  GetDeliveryStatus = async () => {
    const location = await AsyncStorage.getItem('LOCA_NAME');
    fetch(APIURL, {
      method: 'POST', cache: 'no-cache',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify({
        HasReturnData: 'T',
        Parameters: [
          { Para_Data: '119',              Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
          { Para_Data: '',                 Para_Direction: 'Input', Para_Lenth: 50000, Para_Name: '@Text1', Para_Type: 'varchar' },
          { Para_Data: location,           Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'varchar' },
          { Para_Data: this.state.subTotal, Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'varchar' },
        ],
        SpName: 'sp_Android_Common_API', con: '1',
      }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.strRturnRes) {
          if (json.CommonResult.Table[0].STATUS === 'T') {
            this.setState({ dineType: 'Delivery' });
            this.GetTaxNetTotal('Delivery');
          }
          this.setState({ dialogVisible: true, canDeliver: json.CommonResult.Table[0].STATUS, status_message: json.CommonResult.Table[0].MSG });
        }
      })
      .catch(error => { console.log(error); });
  };

  checkDeliveryAvailability = async () => {
    try {
      const response = await fetch(APIURL, {
        method: 'POST', cache: 'no-cache',
        headers: { 'Content-Type': 'application/json', 'cache-control': 'no-cache' },
        body: JSON.stringify({
          HasReturnData: 'T',
          Parameters: [
            { Para_Data: '124', Para_Direction: 'Input', Para_Lenth: 4,   Para_Name: '@Iid',   Para_Type: 'int'     },
            { Para_Data: '',    Para_Direction: 'Input', Para_Lenth: 50000, Para_Name: '@Text1', Para_Type: 'varchar' },
            { Para_Data: '',    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'varchar' },
          ],
          SpName: 'sp_Android_Common_API', con: '1',
        }),
      });
      const json = await response.json();
      if (json.strRturnRes && json.CommonResult.Table.length > 0) {
        this.setState({ isDelivery: json.CommonResult.Table[0].isDelivery });
      }
    } catch (error) { console.log('Delivery API Error:', error); }
  };

  getCoupons = async () => {
    this.setState({ coupons: [] });
    try {
      const phonenumber = await AsyncStorage.getItem('phonenumber');
      const response = await fetch(APIURL, {
        method: 'POST', cache: 'no-cache',
        headers: { 'Content-Type': 'application/json', 'cache-control': 'no-cache' },
        body: JSON.stringify({
          HasReturnData: 'T',
          Parameters: [
            { Para_Data: '127',       Para_Direction: 'Input', Para_Lenth: 4,     Para_Name: '@Iid',   Para_Type: 'int'     },
            { Para_Data: phonenumber, Para_Direction: 'Input', Para_Lenth: 50000, Para_Name: '@Text1', Para_Type: 'varchar' },
            { Para_Data: '',          Para_Direction: 'Input', Para_Lenth: 100,   Para_Name: '@Text2', Para_Type: 'varchar' },
          ],
          SpName: 'sp_Android_Common_API', con: '1',
        }),
      });
      const json = await response.json();
      if (json.strRturnRes && json.CommonResult.Table.length > 0) {
        this.setState({ coupons: json.CommonResult.Table });
      } else {
        this.setState({ coupons: [] });
      }
    } catch (error) { this.setState({ coupons: [] }); }
  };

  GetAddress = () => {
    AsyncStorage.multiGet(['address', 'city']).then(response => {
      this.setState({ address: response[0][1], city: response[1][1] });
    });
  };

  onChageAddress = () => {
    if (this.state.typeaddress !== '') this.setState({ address: this.state.typeaddress });
    this.RBSheet.close();
  };

  onCardPayment = DefaultEmail => {
    AsyncStorage.multiGet(['OrderID', 'phonenumber', 'address', 'firstname', 'lastname', 'email', 'city'])
      .then(response => {
        const OrderID   = response[0][1];
        const Mobile    = response[1][1];
        const Address   = response[2][1];
        const FirstName = response[3][1];
        const LastName  = response[4][1];
        const Email     = response[5][1];
        const City      = response[6][1];
        this.setState({ OrderID });

        const paymentObject = {
          sandbox: false,
          merchant_id: '218556',
          merchant_secret: 'Mzg3NjcyNTY3MjQ1Nzk0NTY5OTMwMTIxMTA4NzI0MTI4MjU5MzM=',
          notify_url: 'http://sample.com/notify',
          order_id: OrderID, items: OrderID,
          amount: parseFloat(this.state.netTotal).toFixed(2),
          currency: 'LKR',
          first_name: FirstName, last_name: LastName,
          email: DefaultEmail === null ? Email : DefaultEmail,
          phone: Mobile, address: Address, city: City, country: 'Sri Lanka',
          delivery_address: this.state.address, delivery_city: this.state.city,
          delivery_country: 'Sri Lanka', custom_1: '', custom_2: '',
        };

        PayHere.startPayment(
          paymentObject,
          paymentId => { this.OnlineOrderDataSave(); },
          errorData => { this.setState({ isOrderPlaced: false }); this.touchableInactive = false; },
          ()        => { this.setState({ isOrderPlaced: false }); this.touchableInactive = false; },
        );
      });
  };

  onPlaceorderPress = async () => {
    if (this.state.dineType === 'null' || this.state.paymentType === '' ||
        this.state.scheduleTime === 'Choose Time' || this.state.locationPressed === '') {
      Alert.alert('Warning', 'Please select all required items');
      return;
    }
    this.setState({ isOrderPlaced: true });
    if (this.state.paymentType === 'Card') {
      if (!this.touchableInactive) {
        this.touchableInactive = true;
        if (this.state.DefaultEmail === null) {
          if (this.state.isEmailVerified) { this.OnlineOrderDataSaveBeforPay(true); }
          else { Alert.alert('Warning', 'Please verified your email first'); this.touchableInactive = false; }
        } else { this.OnlineOrderDataSaveBeforPay(true); }
      }
    } else {
      if (!this.touchableInactive) { this.touchableInactive = true; this.OnlineOrderDataSaveBeforPay(false); }
    }
  };

  generateOrderID = length => {
    const digits = '0123456789';
    let OrderID = '';
    for (let i = 0; i < length; i++) OrderID += digits[Math.floor(Math.random() * 10)];
    return OrderID;
  };

  onClearAsync = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keepKeys = ['address','firstname','lastname','email','phonenumber','city','OrderID','EditStatus','fcmToken','LOCA','LOCA_NAME','PUSH','NID'];
      const removeKeys = keys.filter(k => !keepKeys.includes(k));
      if (removeKeys.length > 0) await AsyncStorage.multiRemove(removeKeys);
      this.props.resetCart();
    } catch (error) { console.log('Failed to clear cart:', error); }
  };

  onContinuShoppingPress = async () => {
    if (!this.RBSheetTouchableInactive) {
      this.RBSheetTouchableInactive = true;
      this.RRBSheet.close();
      const keys = await AsyncStorage.getAllKeys();
      ['address','firstname','lastname','email','phonenumber','city','OrderID','EditStatus','fcmToken','LOCA','PUSH','NID']
        .forEach(p => keys.splice(keys.indexOf(p), 1));
      await AsyncStorage.multiRemove(keys).then(() => {
        this.props.resetCart();
        AsyncStorage.setItem('OrderID', this.generateOrderID(7));
        Promise.all([this.props.navigation.goBack()]).then(() =>
          this.props.navigation.navigate('OrderDetailsScreen', { OrderID: this.state.OrderID }));
      });
    }
  };

  onDineinTypePress = Type => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    switch (Type) {
      case 'EatIn':   this.setState({ dineType: 'EatIn' });   this.GetTaxNetTotal('EatIn');   break;
      case 'PickUp':  this.setState({ dineType: 'PickUp' });  this.GetTaxNetTotal('PickUp');  break;
      case 'Delivery': this.GetDeliveryStatus(); break;
      default: break;
    }
  };

  onSchedulePress = Status => {
    switch (Status) {
      case 'Now':
        this.setState({ scheduleStatus: 'Now', scheduleTime: moment(new Date()).format(' hh:mm:ss A ') });
        break;
      case 'Later':
        this.setState({ scheduleStatus: 'Later', scheduleTime: 'Choose Time' });
        break;
      default: break;
    }
  };

  hideDatePicker = () => { this.setState({ isEnableTime: false }); };

  handleConfirm = date => {
    this.setState({ scheduleTime: moment(date).format(' hh:mm:ss A '), isEnableTime: false, selectedDate: date });
  };

  onSeeMenu = () => {
    Promise.all([this.props.navigation.goBack()]).then(() => this.props.navigation.navigate('HomeScreen'));
  };

  onAddItems = () => {
    Promise.all([this.props.navigation.goBack()]).then(() => this.props.navigation.navigate('Home'));
  };

  onViewItemsPress = ItemID => {
    const list = this.state.isClickList;
    list[ItemID].Checked = !list[ItemID].Checked;
    this.setState({ isClickList: list });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  onAgreePress = () => {
    if (this.state.dineType === 'null') { Alert.alert('Alert', 'Dine Type Not Selected'); this.SRBSheet.close(); }
    else if (this.state.locationPressed === '') { Alert.alert('Alert', 'Location Not Selected'); this.SRBSheet.close(); }
    else if (this.state.paymentType === '') { Alert.alert('Alert', 'Payment Type Not Selected'); this.SRBSheet.close(); }
    else { this.SRBSheet.close(); this.onPlaceorderPress(); }
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  renderCartItems = Item => {
    const { theme } = this.props;
    return Item.map((item, index) => (
      <View key={index} style={{ flex: 1, margin: 5, marginLeft: 10 }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{
            width: 25, height: 25, backgroundColor: theme.surface,
            alignItems: 'center', marginLeft: 10, marginRight: 10,
            marginTop: 5, justifyContent: 'center', borderRadius: 6,
          }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 14, fontWeight: 'bold', color: theme.text,
            }}>{item.Qty}</Text>
          </View>
          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
            fontSize: 19, marginLeft: 10, flex: 0.85, fontWeight: '800', color: theme.text,
          }}>{item.ProductName} </Text>
          <View style={{ flexDirection: 'column' }}>
            <NumericFormat
              value={item.NetTotal} displayType={'text'} thousandSeparator={true}
              fixedDecimalScale={true} decimalScale={2} prefix={'LKR '}
              renderText={formattedValue => (
                <Text style={{
                  textAlignVertical: 'top', marginLeft: 15,
                  fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                  fontSize: 18, color: theme.text,
                }}>{formattedValue}</Text>
              )}
            />
            {item.isDiscounted && (
              <Text style={{
                backgroundColor: '#194dadd3', color: 'white', fontSize: 14,
                paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6,
                alignSelf: 'flex-end', marginTop: 4,
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              }}>10% off</Text>
            )}
          </View>
        </View>
        <View style={{ marginBottom: 5 }}>
          {item.Addons.length + item.Extra.length > 0 && !item.Checked ? (
            <TouchableOpacity onPress={() => this.onViewItemsPress(index)}>
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 15, color: theme.textMuted, marginLeft: 60,
              }}>Show {item.Addons.length + item.Extra.length} more items</Text>
            </TouchableOpacity>
          ) : null}
          <View style={{ height: item.Checked ? null : 0, overflow: 'hidden' }}>
            {this.renderAddons(item.Addons)}
            {this.renderExtra(item.Extra)}
            <TouchableOpacity style={{ marginTop: 5 }} onPress={() => this.onViewItemsPress(index)}>
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 15, color: theme.text, marginLeft: 60,
              }}>Show less items</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ));
  };

  renderAddons(Addons) {
    const { theme } = this.props;
    return Addons.map((item, key) => (
      <Animated.View key={key} style={{ alignItems: 'center', marginLeft: 60, flexDirection: 'row' }}>
        <Text style={{
          fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
          fontSize: 17, color: theme.textMuted, marginRight: 5,
        }}>{item.name}</Text>
        <NumericFormat
          value={item.price} displayType={'text'} thousandSeparator={true}
          fixedDecimalScale={true} decimalScale={2} prefix={'LKR '}
          renderText={formattedValue => (
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 17, color: theme.textMuted,
            }}>({formattedValue})</Text>
          )}
        />
      </Animated.View>
    ));
  }

  renderExtra(Extra) {
    const { theme } = this.props;
    return Extra.map((item, key) => (
      <View key={key} style={{ alignItems: 'center', marginLeft: 60, flexDirection: 'row' }}>
        <Text style={{
          fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
          fontSize: 17, color: theme.textMuted, marginRight: 5,
        }}>{item.name}</Text>
        <NumericFormat
          value={item.amount} displayType={'text'} thousandSeparator={true}
          fixedDecimalScale={true} decimalScale={2} prefix={'LKR '}
          renderText={formattedValue => (
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 17, color: theme.textMuted,
            }}>({formattedValue})</Text>
          )}
        />
      </View>
    ));
  }

  renderCard() {
    const { theme } = this.props;
    return this.state.cardlist.map((item, index) => {
      let imageuri = '';
      let cardtype = '';
      switch (item.card_type) {
        case 'visa':             imageuri = require('../assets/cardicon/stp_card_visa.png');       cardtype = 'Visa';             break;
        case 'master-card':      imageuri = require('../assets/cardicon/stp_card_mastercard.png'); cardtype = 'Master card';      break;
        case 'american-express': imageuri = require('../assets/cardicon/stp_card_amex.png');       cardtype = 'American Express'; break;
        case 'diners-club':      imageuri = require('../assets/cardicon/stp_card_diners.png');     cardtype = 'Diners Club';      break;
        case 'discover':         imageuri = require('../assets/cardicon/stp_card_discover.png');   cardtype = 'Discover';         break;
        case 'jcb':              imageuri = require('../assets/cardicon/stp_card_jcb.png');        cardtype = 'JCB';              break;
        default: break;
      }
      return (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginRight: 20 }}>
          <Image source={imageuri} style={{ height: 35 }} resizeMode={'contain'} />
          <Text style={{
            flex: 1, fontSize: 20,
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
            marginLeft: 15, color: theme.text,
          }}>{cardtype}</Text>
          <RadioButton
            size={14} innerColor={theme.text} outerColor={theme.text}
            animation={'bounceIn'} isSelected={this.state.selectedIndex === index}
            onPress={() => { this.onPress(index); }}
          />
        </View>
      );
    });
  }

  // ── Helper: themed row for billing totals ─────────────────────────────────
  renderTotalRow(label, value, color = null) {
    const { theme } = this.props;
    const textColor = color || theme.text;
    return (
      <View style={{ flexDirection: 'row', marginTop: 5, marginLeft: 30, marginRight: 30 }}>
        <Text style={{
          flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
          fontSize: 18, color: textColor,
        }}>{label}</Text>
        <NumericFormat
          value={value} displayType={'text'} thousandSeparator={true}
          fixedDecimalScale={true} decimalScale={2} prefix={'LKR '}
          renderText={formattedValue => (
            <Text style={{
              flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 18, textAlign: 'right', color: textColor,
            }}>{formattedValue}</Text>
          )}
        />
      </View>
    );
  }

  render() {
    const { theme, isDark } = this.props; // ← theme tokens

    const headerTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE], outputRange: [0, -HEADER_SCROLL_DISTANCE], extrapolate: 'clamp',
    });
    const buttonScale = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE], outputRange: [1, 1, 0.9], extrapolate: 'clamp',
    });
    const buttonTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE], outputRange: [0, -15, -15], extrapolate: 'clamp',
    });
    const titleTranslateX = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE], outputRange: [0, 10, 10], extrapolate: 'clamp',
    });
    const titleTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE], outputRange: [0, 6, 6], extrapolate: 'clamp',
    });
    const titleScale = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE], outputRange: [1, 0.9, 0.8], extrapolate: 'clamp',
    });
    const translateX = this.state.glowAnim.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] });

    // ── Reusable themed sub-components ──────────────────────────────────────
    const Separator = ({ mt = 10, mb = 10 }) => (
      <View style={{ height: 0.5, marginTop: mt, marginBottom: mb, marginRight: 30, marginLeft: 30, backgroundColor: theme.separator }} />
    );

    const SectionTitle = ({ children, mt = 15 }) => (
      <Text style={{
        fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
        fontSize: 22, marginTop: mt, textAlign: 'center', color: theme.text,
      }}>{children}</Text>
    );

    const SectionSubtitle = ({ children }) => (
      <Text style={{
        fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
        fontSize: 16, textAlign: 'center', marginLeft: 30, marginRight: 30,
        marginTop: 5, color: theme.textSub,
      }}>{children}</Text>
    );

    // ── Schedule block (used for both EatIn/PickUp and Delivery) ────────────
    const ScheduleBlock = () => (
      <>
        <Text style={{
          fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
          fontSize: 18, marginTop: 10, marginBottom: 10, color: theme.text,
        }}>When would you like to place your order?</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          {['Now', 'Later'].map((status, i) => (
            <View key={status} style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => this.onSchedulePress(status)}>
                <View style={{
                  flexDirection: 'row', height: 50,
                  backgroundColor: this.state.scheduleStatus === status ? theme.pill : theme.surface,
                  borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                  marginRight: i === 0 ? 5 : 0, marginLeft: i === 1 ? 5 : 0,
                }}>
                  <View style={{
                    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: theme.bg, marginRight: 10, borderRadius: 5,
                  }}>
                    {this.state.scheduleStatus === status && (
                      <FontAwesome6 name="check" size={14} color={theme.text} solid />
                    )}
                  </View>
                  <Text style={{
                    marginLeft: 10, marginRight: 20,
                    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                    fontSize: 16, textAlign: 'right',
                    color: this.state.scheduleStatus === status ? theme.pillText : theme.text,
                  }}>{status}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {this.state.scheduleStatus === 'Now' ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 16, color: theme.textSub }}>
              Your order will be ready within 30 mins* from the order confirmation.
            </Text>
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 16, color: theme.textSub }}>
              Current time Sri Lanka ({moment(new Date()).format(' hh:mm:ss A ')})
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginLeft: 3 }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                fontSize: 18, color: theme.text,
              }}>{this.state.scheduleTime}</Text>
            </View>
            <View style={{ flex: 0.4 }}>
              <TouchableOpacity style={{ alignItems: 'flex-end' }} onPress={() => this.setState({ isEnableTime: true })}>
                <View style={{
                  width: 140, height: 35, backgroundColor: theme.surface,
                  borderRadius: 100 / 2, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 16, color: theme.text,
                  }}>Schedule Time</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </>
    );

    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>

        {/* ── Scrollable body ── */}
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: theme.bg }}
          contentContainerStyle={{ paddingTop: 140 }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
            { useNativeDriver: true },
          )}
        >
          <View style={{ flex: 1 }}>

            {/* Terms */}
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
              fontSize: 22, textAlign: 'right', marginRight: 30, marginLeft: 30, marginBottom: 10, color: theme.text,
            }}>Order verification</Text>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
              fontSize: 18, textAlign: 'left', marginRight: 30, marginLeft: 30, color: theme.text,
            }}>Terms and Conditions</Text>
            <View style={{ height: 0.5, marginTop: 15, marginBottom: 10, marginRight: 30, marginLeft: 30, backgroundColor: theme.separator }} />
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16, marginTop: 10, marginLeft: 30, margin: 10, textAlign: 'left', marginRight: 30, color: theme.textSub,
            }}>
              1. The order price might change.{'\n'}
              2. Some items in the order may be out of stock, and those items will not be delivered. Therefore, the total order value will be changed.
            </Text>
            <View style={{ height: 0.5, marginTop: 15, marginBottom: 10, marginRight: 30, marginLeft: 30, backgroundColor: theme.separator }} />

            {/* Your Items header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 30, marginTop: 10, marginBottom: 10, marginRight: 40 }}>
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                fontSize: 22, flex: 1, color: theme.text,
              }}>Your Items</Text>
              <TouchableOpacity
                style={{ flex: 0.5, alignItems: 'flex-end', marginRight: 10 }}
                onPress={() => this.props.navigation.navigate('HomeScreen')}
              >
                <Animated.View style={[{
                  width: 125, height: 50, backgroundColor: theme.pill,
                  borderRadius: 125 / 2, alignItems: 'center', justifyContent: 'center',
                }, { transform: [{ scale: this.state.zoomIn }] }]}>
                  <Text allowFontScaling={false} style={{
                    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 16, color: theme.pillText,
                  }}>See menu</Text>
                  <MaskedView
                    style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                    maskElement={<View style={{ flex: 1, borderRadius: 25, borderWidth: 2, borderColor: 'black' }} />}
                  >
                    <View style={{ flex: 1, borderRadius: 25, borderWidth: 2, borderColor: isDark ? theme.accent : '#fff' }} />
                    <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, transform: [{ translateX }] }}>
                      <LinearGradient
                        colors={['transparent', isDark ? 'rgba(232,160,64,0.6)' : 'gold', 'transparent']}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }}
                      />
                    </Animated.View>
                  </MaskedView>
                </Animated.View>
              </TouchableOpacity>
            </View>
            <View style={{ height: 0.5, marginTop: 10, marginBottom: 10, marginRight: 30, marginLeft: 30, backgroundColor: theme.separator }} />

            {/* Cart items */}
            <View>{this.renderCartItems(this.state.isClickList)}</View>

            {/* Add items */}
            <TouchableOpacity style={{ marginLeft: 30, marginTop: 10, marginBottom: 10 }} onPress={() => this.onAddItems()}>
              <View style={{
                flexDirection: 'row', width: 130, height: 35,
                backgroundColor: theme.surface, borderRadius: 100 / 2,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <FontAwesome6 name="plus" size={20} solid color={theme.text} />
                <Text style={{
                  fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                  color: theme.text, fontSize: 16, marginLeft: 5,
                }}>Add items</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 0.8, marginTop: 10, marginRight: 30, marginLeft: 30, backgroundColor: theme.separator }} />

            {/* Totals */}
            <View style={{ flexDirection: 'row', marginTop: 30, marginLeft: 30, marginRight: 30 }}>
              <Text style={{ flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 18, color: theme.text }}>Sub Total</Text>
              <NumericFormat value={this.state.subTotal} displayType={'text'} thousandSeparator={true} fixedDecimalScale={true} decimalScale={2} prefix={'LKR '}
                renderText={v => <Text style={{ flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 18, textAlign: 'right', color: theme.text }}>{v}</Text>} />
            </View>
            {this.state.tax !== 0 && this.renderTotalRow('Tax', this.state.tax)}
            {this.state.discount !== 0 && this.renderTotalRow('Discount', this.state.discount)}
            {this.state.dineType === 'Delivery' && this.state.deliveryCharge !== 0 && this.renderTotalRow('Delivery Charge', this.state.deliveryCharge)}
            {(this.state.dineType === 'PickUp' || this.state.dineType === 'EatIn') && this.state.serviceCharge !== 0 && this.renderTotalRow('Service Charge', this.state.serviceCharge)}
            {this.state.savedAmount > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 5, marginLeft: 30, marginRight: 30 }}>
                <Text style={{ flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 18, color: '#28a745' }}>
                  Coupon Discount ({this.state.appliedCoupon})
                </Text>
                {this.state.couponValue && this.state.couponValue.includes('%') ? (
                  <Text style={{ flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 18, textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>
                    - {this.state.couponValue}
                  </Text>
                ) : (
                  <NumericFormat value={this.state.savedAmount} displayType={'text'} thousandSeparator={true} fixedDecimalScale={true} decimalScale={2} prefix={'LKR '}
                    renderText={v => <Text style={{ flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 18, textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>- {v}</Text>} />
                )}
              </View>
            )}
            {this.state.subTotal !== this.state.netTotal && this.renderTotalRow('Net Total', this.state.netTotal)}

            <Separator mt={30} mb={0} />

            {/* Coupons */}
            <SectionTitle mt={15}>Coupons</SectionTitle>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16, textAlign: 'left', marginRight: 30, marginLeft: 30,
              color: '#1c6638ff', marginTop: 5, marginBottom: 5,
            }}>
              {this.state.coupons.length} {this.state.coupons.length === 1 ? 'Promotion' : 'Promotions'} Available
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
              {this.state.coupons.map((coupon, index) => {
                const icon = this.getCouponIcon(coupon);
                const isHighlighted = index === 0;
                const displayText = coupon.description ||
                  (typeof coupon.value === 'string' && coupon.value.includes('%')
                    ? `Get ${coupon.value} OFF` : `Get Rs.${coupon.value} OFF`);
                return (
                  <Card key={coupon.coupon || index} cardElevation={3} cardMaxElevation={3} cornerRadius={10}
                    style={{ marginHorizontal: 10, marginVertical: 8 }}>
                    <TouchableOpacity onPress={() => this.togglePromoModal(true, coupon.coupon, false)}>
                      <View style={{
                        borderWidth: 1, borderColor: isHighlighted ? '#ffa363' : '#7a7a7a',
                        borderStyle: 'dashed', paddingVertical: 12, paddingHorizontal: 15,
                        borderRadius: 10, flexDirection: 'row', alignItems: 'center',
                        minHeight: 50, backgroundColor: theme.card,
                      }}>
                        <FontAwesome6 name={icon.name} size={18} color={isHighlighted ? '#ffa363' : icon.color} solid />
                        <Text style={{
                          color: isHighlighted ? '#ffa363' : theme.textSub, fontSize: 15,
                          fontWeight: 'bold', marginLeft: 6,
                          fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                        }}>{displayText}</Text>
                      </View>
                    </TouchableOpacity>
                  </Card>
                );
              })}
            </ScrollView>

            {/* Applied coupon banner */}
            <View style={{ marginHorizontal: 20, marginTop: 15 }}>
              {this.state.appliedCoupon && (
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  padding: 12, borderRadius: 10, backgroundColor: isDark ? '#0d2a1a' : '#f2f9ff',
                  borderWidth: 1, borderColor: isDark ? '#1c6638ff' : '#66b3ff',
                }}>
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={{ color: isDark ? '#4fc97a' : '#0080ff', fontWeight: 'bold', fontSize: 15 }}>
                      🎉 YAY! You saved {this.state.couponValue || ''}!
                    </Text>
                    <Text style={{ fontSize: 13, marginTop: 3, color: theme.textSub }}>
                      {this.state.appliedCoupon || 'None'} Applied!
                    </Text>
                  </View>
                  <TouchableOpacity onPress={this.handleRemoveCoupon}>
                    <Text style={{ color: '#c62828', fontWeight: 'bold' }}>REMOVE</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Separator mt={30} mb={0} />

            {/* Dining type */}
            <SectionTitle mt={15}>Dining type</SectionTitle>
            <SectionSubtitle>Restaurants fall into several industry classifications, based upon menu style, preparation methods and pricing, as well as the means by which the food is served to the customer.</SectionSubtitle>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              {/* Eat In */}
              <Card cardElevation={this.state.dineType === 'EatIn' ? 12 : 0} cardMaxElevation={12} cornerRadius={15} style={{ marginTop: 25, backgroundColor: theme.bg }}>
                <TouchableOpacity onPress={() => this.onDineinTypePress('EatIn')}>
                  <View style={{
                    width: 100, height: 100,
                    backgroundColor: this.state.dineType === 'EatIn' ? theme.pill : theme.surface,
                    borderColor: this.state.dineType === 'EatIn' ? theme.pill : theme.separator,
                    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FontAwesome6 name="utensils" size={22} color={this.state.dineType === 'EatIn' ? theme.pillText : '#ffa363'} />
                    <Text style={{
                      marginTop: 20, fontSize: 16,
                      color: this.state.dineType === 'EatIn' ? theme.pillText : theme.textSub,
                      fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                    }}>Eat in</Text>
                  </View>
                </TouchableOpacity>
              </Card>
              {/* Pick Up */}
              <Card cardElevation={this.state.dineType === 'PickUp' ? 12 : 0} cardMaxElevation={12} cornerRadius={15} style={{ marginLeft: 20, marginTop: 25, backgroundColor: theme.bg }}>
                <TouchableOpacity onPress={() => this.onDineinTypePress('PickUp')}>
                  <View style={{
                    width: 100, height: 100,
                    backgroundColor: this.state.dineType === 'PickUp' ? theme.pill : theme.surface,
                    borderColor: this.state.dineType === 'PickUp' ? theme.pill : theme.separator,
                    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FontAwesome6 name="bag-shopping" size={22} color={this.state.dineType === 'PickUp' ? theme.pillText : '#ffa363'} />
                    <Text style={{
                      marginTop: 20, fontSize: 16,
                      color: this.state.dineType === 'PickUp' ? theme.pillText : theme.textSub,
                      fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                    }}>Pickup</Text>
                  </View>
                </TouchableOpacity>
              </Card>
              {/* Delivery */}
          <Card
  cardElevation={0}
  cardMaxElevation={0}
  cornerRadius={15}
  style={{
    marginLeft: 20,
    marginTop: 25,
    backgroundColor: theme.bg,
    // shadow only when selected AND enabled
    ...(this.state.dineType === 'Delivery' && this.state.isDelivery
      ? theme.shadow
      : {}),
  }}
>
  <TouchableOpacity
    onPress={() => this.onDineinTypePress('Delivery')}
    disabled={!this.state.isDelivery}
  >
    <View style={{
      width: 100,
      height: 100,
      backgroundColor: this.state.dineType === 'Delivery' && this.state.isDelivery
        ? theme.pill
        : theme.surface,
      borderColor: this.state.dineType === 'Delivery' && this.state.isDelivery
        ? theme.pill
        : theme.separator,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      // opacity instead of disabled background handles the "unavailable" look
      opacity: this.state.isDelivery ? 1 : 0.4,
    }}>
      <FontAwesome6
        name="truck"
        size={26}
        color={this.state.dineType === 'Delivery' && this.state.isDelivery
          ? theme.pillText
          : '#ffa363'}
      />
      <Text style={{
        marginTop: 17,
        fontSize: 16,
        color: this.state.dineType === 'Delivery' && this.state.isDelivery
          ? theme.pillText
          : theme.textSub,
        fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
      }}>
        Delivery
      </Text>
    </View>
  </TouchableOpacity>
</Card>
            </View>

            {/* EatIn / PickUp order details */}
            <View style={{
              marginLeft: 40, marginRight: 40, overflow: 'hidden',
              height: this.state.dineType === 'EatIn' || this.state.dineType === 'PickUp' ? null : 0,
            }}>
              <View style={{ height: 0.5, marginTop: 30, backgroundColor: theme.separator }} />
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                fontSize: 20, marginTop: 15, marginBottom: 10, textAlign: 'center', color: theme.text,
              }}>{this.state.dineType === 'EatIn' ? 'EatIn Order Details' : 'PickUp Order Details'}</Text>
              <View style={{ height: 0.5, marginTop: 5, marginBottom: 10, backgroundColor: theme.separator }} />
              <ScheduleBlock />
            </View>

            {/* Delivery order details */}
            <View style={{ marginLeft: 40, marginRight: 40, overflow: 'hidden', height: this.state.dineType === 'Delivery' ? null : 0 }}>
              <View style={{ height: 0.5, marginTop: 30, backgroundColor: theme.separator }} />
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                fontSize: 20, marginTop: 15, marginBottom: 10, textAlign: 'center', color: theme.text,
              }}>Delivery Order Details</Text>
              <View style={{ height: 0.5, marginTop: 5, marginBottom: 10, backgroundColor: theme.separator }} />
              <ScheduleBlock />
              <View style={{ height: 0.5, marginTop: 20, backgroundColor: theme.separator }} />
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                fontSize: 18, marginTop: 10, marginBottom: 10, color: theme.text,
              }}>Where would you like your order be delivered to?</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 16, color: theme.text }}>
                    {this.state.address}
                  </Text>
                </View>
                <View style={{ flex: 0.4 }}>
                  <TouchableOpacity style={{ alignItems: 'flex-end' }} onPress={() => this.RBSheet.open()}>
                    <View style={{
                      width: 80, height: 35, backgroundColor: theme.surface,
                      borderRadius: 100 / 2, alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 16, color: theme.text }}>Change</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Separator mt={20} mb={0} />

            {/* Payment type */}
            <SectionTitle mt={25}>Payment type</SectionTitle>
            <SectionSubtitle>Payment is the transfer of money or goods and services in exchange for a product or service.</SectionSubtitle>

            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              {/* Card */}
              <Card cardElevation={this.state.paymentType === 'Card' ? 12 : 0} cardMaxElevation={12} cornerRadius={15} style={{ marginTop: 25, backgroundColor: theme.bg }}>
                <TouchableOpacity onPress={() => this.onCardPress()}>
                  <View style={{
                    flexDirection: 'row', width: 150, height: 60,
                    backgroundColor: this.state.paymentType === 'Card' ? theme.pill : theme.surface,
                    borderColor: this.state.paymentType === 'Card' ? theme.pill : theme.separator,
                    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FontAwesome6 name="credit-card" size={22} solid
                      color={this.state.paymentType === 'Card' ? theme.pillText : '#ffa363'} />
                    <Text style={{
                      fontSize: 16, marginLeft: 20,
                      fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                      color: this.state.paymentType === 'Card' ? theme.pillText : theme.textSub,
                    }}>Card</Text>
                  </View>
                </TouchableOpacity>
              </Card>
              {/* Cash */}
              <Card cardElevation={this.state.paymentType === 'Cash' ? 12 : 0} cardMaxElevation={12} cornerRadius={15} style={{ marginLeft: 20, marginTop: 25, backgroundColor: theme.bg }}>
                <TouchableOpacity onPress={() => this.onCashPress()}>
                  <View style={{
                    flexDirection: 'row', width: 150, height: 60,
                    backgroundColor: this.state.paymentType === 'Cash' ? theme.pill : theme.surface,
                    borderColor: this.state.paymentType === 'Cash' ? theme.pill : theme.separator,
                    borderRadius: 15, alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FontAwesome6 name="money-bill" size={22} solid
                      color={this.state.paymentType === 'Cash' ? theme.pillText : '#ffa363'} />
                    <Text style={{
                      fontSize: 16, marginLeft: 20,
                      fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
                      color: this.state.paymentType === 'Cash' ? theme.pillText : theme.textSub,
                    }}>Cash</Text>
                  </View>
                </TouchableOpacity>
              </Card>
            </View>

            <Separator mt={30} mb={10} />
          </View>
        </Animated.ScrollView>

        {/* ── Place Order button ── */}
        <TouchableOpacity
          style={{ alignItems: 'center', justifyContent: 'center', marginTop: 20, marginLeft: 30, marginRight: 30, marginBottom: 20 }}
          onPress={() => this.onPlaceorderPress()}
        >
          <View style={{
            width: '100%', height: 50, alignItems: 'center', justifyContent: 'center',
            backgroundColor: theme.pill, flexDirection: 'row',
          }}>
            <Text style={{
              color: theme.pillText,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 18, marginRight: 20, marginLeft: 50,
            }}>Place Order</Text>
            <ActivityIndicator animating={this.state.isOrderPlaced} color={theme.pillText} size={25} />
          </View>
        </TouchableOpacity>

        {/* ── Sticky header ── */}
        <Animated.View style={[styles.header, { backgroundColor: theme.bg, transform: [{ translateY: headerTranslateY }] }]}>
          <Animated.View style={[{ marginTop: 80, marginLeft: 30 }, {
            transform: [{ translateX: titleTranslateX }, { scale: titleScale }, { translateY: titleTranslateY }],
          }]}>
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 28, color: theme.text }}>
              Checkout
            </Text>
          </Animated.View>
        </Animated.View>

        {/* ── Back button ── */}
        <TouchableOpacity style={{ top: 30, left: 20, position: 'absolute' }} onPress={() => this.props.navigation.goBack()}>
          <Animated.View style={[{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, {
            transform: [{ scale: buttonScale }, { translateY: buttonTranslateY }],
          }]}>
            <Image source={require('../assets/left-arrow.png')} style={{ width: 20, height: 20, tintColor: theme.text }} />
          </Animated.View>
        </TouchableOpacity>

        {/* ── Theme toggle pinned top-right ── */}
        <ThemeToggle style={{ position: 'absolute', top: 30, right: 20 }} />

        {/* ── Change address RBSheet ── */}
        <RBSheet
          ref={ref => { this.RBSheet = ref; }}
          height={300} openDuration={850}
          closeOnDragDown={true} closeOnPressMask={true}
          customStyles={{ wrapper: { backgroundColor: 'transparent' }, draggableIcon: { backgroundColor: theme.text } }}
        >
          <View style={{ flex: 1, backgroundColor: theme.card }}>
            <Text style={{
              margin: 10, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 18, color: theme.text, alignSelf: 'center',
            }}>Change Delivery Address</Text>
            <TextInput
              style={{
                backgroundColor: theme.surface, height: 100, paddingLeft: 20, borderRadius: 5,
                borderColor: theme.inputBorder, borderWidth: 1, fontSize: 19,
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                color: theme.text, textAlignVertical: 'top',
                marginLeft: 20, marginRight: 20, marginBottom: 10,
              }}
              multiline={true} blurOnSubmit={true} keyboardType={'default'}
              placeholderTextColor={theme.textMuted}
              onChangeText={address => this.setState({ typeaddress: address })}
            />
            <TextInput
              style={{
                backgroundColor: theme.surface, height: 50, paddingLeft: 20, borderRadius: 5,
                borderColor: theme.inputBorder, borderWidth: 1, fontSize: 19,
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                color: theme.text, textAlignVertical: 'center',
                marginLeft: 20, marginRight: 20, marginBottom: 10,
              }}
              multiline={false} blurOnSubmit={true} keyboardType={'default'}
              placeholder={'City'} placeholderTextColor={theme.textMuted}
              onChangeText={address => this.setState({ typeaddress: address })}
            />
            <TouchableOpacity
              style={{ alignItems: 'center', justifyContent: 'center', margin: 5 }}
              onPress={() => this.onChageAddress()}
            >
              <View style={{
                width: '92%', height: 45, alignItems: 'center', justifyContent: 'center',
                backgroundColor: theme.pill, borderRadius: 5,
              }}>
                <Text style={{
                  color: theme.pillText,
                  fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium', fontSize: 18,
                }}>Done</Text>
              </View>
            </TouchableOpacity>
          </View>
        </RBSheet>

        {/* ── Summary RBSheet ── */}
        <RBSheet
          ref={ref => { this.SRBSheet = ref; }}
          animationType={'fade'} height={600} openDuration={700} closeDuration={700}
          closeOnDragDown={false} closeOnPressMask={true} closeOnPressBack={true}
          customStyles={{
            wrapper: { backgroundColor: 'rgba(0,0,0,0.6)' },
            draggableIcon: { backgroundColor: theme.text },
            container: { borderTopLeftRadius: 15, borderTopRightRadius: 15, backgroundColor: theme.card },
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', marginLeft: 30, marginTop: 30, marginBottom: 20 }}>
              <TouchableOpacity onPress={() => this.SRBSheet.close()}>
                <FontAwesome6 name="arrow-left" size={30} color={theme.text} solid />
              </TouchableOpacity>
              <Text style={{
                flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 24, color: theme.text, marginLeft: 30,
              }}>Summary</Text>
            </View>
            <View style={{ height: 0.5, marginBottom: 20, marginLeft: 20, marginRight: 20, backgroundColor: theme.separator }} />
            <ScrollView>
              {this.renderCartItems(this.state.isClickList)}
              <View style={{ height: 0.5, marginBottom: 20, marginLeft: 20, marginRight: 20, marginTop: 20, backgroundColor: theme.separator }} />
              <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 18, marginLeft: 20, color: theme.text }}>BILLING INFORMATION</Text>
              <View style={{ height: 0.5, marginTop: 20, marginLeft: 20, marginRight: 20, backgroundColor: theme.separator }} />
              {this.renderTotalRow('Sub Total', this.state.subTotal)}
              {this.state.tax !== 0 && this.renderTotalRow('Tax', this.state.tax)}
              {this.state.discount !== 0 && this.renderTotalRow('Discount', this.state.discount)}
              {this.state.dineType === 'Delivery' && this.state.deliveryCharge !== 0 && this.renderTotalRow('Delivery Charge', this.state.deliveryCharge)}
              {(this.state.dineType === 'PickUp' || this.state.dineType === 'EatIn') && this.state.serviceCharge !== 0 && this.renderTotalRow('Service Charge', this.state.serviceCharge)}
              {this.state.subTotal !== this.state.netTotal && this.renderTotalRow('Net Total', this.state.netTotal)}
              <View style={{ height: 0.9, marginTop: 20, marginBottom: 20, marginLeft: 20, marginRight: 20, backgroundColor: theme.separator }} />
              <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 18, marginLeft: 20, color: theme.text }}>ORDER INFORMATION</Text>
              <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 14, marginLeft: 20, marginRight: 20, color: theme.textMuted, marginTop: 5 }}>
                The information presented here is included on your order like payment type, dine type, delivery address
              </Text>
              <View style={{ height: 0.9, marginTop: 20, marginBottom: 20, marginLeft: 20, marginRight: 20, backgroundColor: theme.separator }} />
              {[
                { label: 'Payment Type :', value: this.state.paymentType === '' ? 'Not Selected' : this.state.paymentType },
                { label: 'Location :', value: this.state.locationPressed === '' ? 'Not Selected' : this.state.locationPressed },
                { label: 'Dine Type :', value: this.state.dineType === 'null' ? 'Not Selected' : this.state.dineType },
              ].map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20, marginTop: i > 0 ? 3 : 0 }}>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 17, color: theme.textMuted }}>{row.label}</Text>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 17, marginLeft: 10, color: theme.text }}>{row.value}</Text>
                </View>
              ))}
              {this.state.dineType === 'Delivery' && (
                <View style={{ flexDirection: 'row', marginTop: 3, marginLeft: 20, marginRight: 20 }}>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 17, color: theme.textMuted }}>Delivery Address :</Text>
                  <Text style={{ flex: 1, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 17, marginLeft: 10, color: theme.text }}>{this.state.address}</Text>
                </View>
              )}
              <View style={{ height: 0.9, marginTop: 20, marginLeft: 20, marginRight: 20, backgroundColor: theme.separator }} />
            </ScrollView>
            <TouchableOpacity
              style={{ alignItems: 'center', justifyContent: 'center', marginTop: 20, marginLeft: 30, marginRight: 30, marginBottom: 20 }}
              onPress={() => this.onAgreePress()}
            >
              <View style={{ width: '100%', height: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pill, flexDirection: 'row' }}>
                <Text style={{ color: theme.pillText, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium', fontSize: 18, marginRight: 20, marginLeft: 50 }}>I Agree</Text>
                <ActivityIndicator animating={this.state.isOrderPlaced} color={theme.pillText} size={25} />
              </View>
            </TouchableOpacity>
          </View>
        </RBSheet>

        {/* ── Thank you RBSheet ── */}
        <RBSheet
          ref={ref => { this.RRBSheet = ref; }}
          animationType={'fade'} height={355} openDuration={700} closeDuration={700}
          closeOnDragDown={false} closeOnPressMask={false} closeOnPressBack={false}
          customStyles={{
            wrapper: { backgroundColor: 'rgba(0,0,0,0.6)' },
            draggableIcon: { backgroundColor: theme.text },
            container: { backgroundColor: theme.card },
          }}
        >
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ marginTop: 30, marginBottom: 10 }}>
              <Image source={require('../assets/4.png')} style={{ width: 110, height: 110, borderRadius: 55 }} />
            </View>
            <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 24, color: theme.text }}>
              Thank you for your order!
            </Text>
            <Text style={{ marginLeft: 50, marginRight: 50, marginTop: 5, fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular', fontSize: 15, color: theme.textSub, textAlign: 'center' }}>
              We take pride using only the best ingredients for the food that ends up on your table.
            </Text>
            <View style={{ marginTop: 25 }}>
              <TouchableOpacity onPress={() => this.onContinuShoppingPress()}>
                <View style={{ width: 300, height: 60, backgroundColor: theme.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold', fontSize: 18, color: theme.pillText, marginRight: 20, marginLeft: 20 }}>Done</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </RBSheet>

        <DatePicker
          modal open={this.state.isEnableTime} date={this.state.selectedDate} mode="time"
          onConfirm={this.handleConfirm} onCancel={this.hideDatePicker}
          theme={isDark ? 'dark' : 'light'}
          title="Select Time" confirmText="Confirm" cancelText="Cancel"
        />

        {this.state.dialogVisible && (
          <View style={{ position: 'absolute', height: '100%', width: '100%', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}>
            <AlertDialog onbuttonPress={() => { this.setState({ dialogVisible: false }); }} message={this.state.status_message} />
          </View>
        )}

        {/* ── Coupon modal ── */}
        <Modal
          transparent visible={this.state.promoModalVisible}
          animationType="fade" onRequestClose={() => this.togglePromoModal(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 20, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => this.togglePromoModal(false)}
                    style={{ position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 1 }}
                  >
                    <FontAwesome6 name="xmark" size={22} color={theme.text} solid />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, marginTop: 5, color: theme.text }}>
                    Enter promo code
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1, borderColor: theme.inputBorder, borderStyle: 'dashed',
                      borderRadius: 8, padding: 12, width: '100%', marginBottom: 20,
                      color: this.state.isCustomPromo ? theme.text : theme.textMuted,
                      backgroundColor: theme.inputBg,
                      fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    }}
                    placeholder="Enter promo code" placeholderTextColor={theme.textMuted}
                    value={this.state.promoCode} editable={this.state.isCustomPromo}
                    onChangeText={text => this.setState({ promoCode: text })}
                    autoCapitalize="characters" autoCorrect={false} returnKeyType="done"
                    onSubmitEditing={() => { Keyboard.dismiss(); this.ApplyCoupon(); }}
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: '#ffcc00', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 40, alignItems: 'center', width: '100%' }}
                    onPress={() => { Keyboard.dismiss(); this.ApplyCoupon(); }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000', fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold' }}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }

  // ── Data methods (unchanged) ───────────────────────────────────────────────
  onClearCart = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const keepKeys = ['address','firstname','lastname','email','phonenumber','city','OrderID','EditStatus','fcmToken','LOCA','LOCA_NAME'];
      const removeKeys = keys.filter(k => !keepKeys.includes(k));
      if (removeKeys.length > 0) await AsyncStorage.multiRemove(removeKeys);
      this.props.resetCart();
      this.setState({ list: [], Additionallist: [] });
    } catch (error) { console.log('Failed to clear cart:', error); }
  };

  async OnlineOrderDataSave() {
    let DeliveryCharge = 0;
    let ServiceCharge  = 0;
    let Address        = '';
    let OrderID  = await AsyncStorage.getItem('OrderID');
    let Mobile   = await AsyncStorage.getItem('phonenumber');
    const ItemList = this.props.cartItems;
    this.setState({ OrderID });

    switch (this.state.dineType) {
      case 'EatIn':    ServiceCharge  = this.state.serviceCharge; break;
      case 'PickUp':   ServiceCharge  = this.state.serviceCharge; break;
      case 'Delivery': Address = this.state.address; DeliveryCharge = this.state.deliveryCharge; break;
      default: break;
    }

    let Order = {
      OrderID, Mobile, Tax: this.state.tax, Version: getVersion(),
      Discount: this.state.discount, DeliveryCharge, ServiceCharge,
      SubTotal: this.state.subTotal, NetTotal: this.state.netTotal,
      DineType: this.state.dineType, DeliveryAddress: Address,
      PaymentType: this.state.paymentType, ScheduleTime: this.state.scheduleTime,
      BranchLocation: this.state.locationPressed, Items: ItemList,
      isPayment: true, coupon_code: this.state.appliedCoupon,
    };

    fetch(PLACEORDERURL, {
      method: 'POST', cache: 'no-cache',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify(Order),
    })
      .then(res => res.json())
      .then(json => {
        if (json.strRturnRes === true) {
          this.setState({ isOrderPlaced: false });
          this.RRBSheet.open();
          this.onClearAsync();
        }
      })
      .catch(er => {
        this.touchableInactive = false;
        Alert.alert('Warning', "The operation coundn't be completed.", [{ text: 'Try Again' }], { cancelable: false });
      });
  }

  async OnlineOrderDataSaveBeforPay(isCard) {
    let DeliveryCharge = 0;
    let ServiceCharge  = 0;
    let Address        = '';
    let OrderID  = await AsyncStorage.getItem('OrderID');
    let Mobile   = await AsyncStorage.getItem('phonenumber');
    const ItemList = this.props.cartItems;
    this.setState({ OrderID });

    switch (this.state.dineType) {
      case 'EatIn':    ServiceCharge  = this.state.serviceCharge; break;
      case 'PickUp':   ServiceCharge  = this.state.serviceCharge; break;
      case 'Delivery': Address = this.state.address; DeliveryCharge = this.state.deliveryCharge; break;
      default: break;
    }

    let Order = {
      OrderID, Mobile, Tax: this.state.tax, Version: getVersion(),
      Discount: this.state.discount, DeliveryCharge, ServiceCharge,
      SubTotal: this.state.subTotal, NetTotal: this.state.netTotal,
      DineType: this.state.dineType, DeliveryAddress: Address,
      PaymentType: this.state.paymentType, ScheduleTime: this.state.scheduleTime,
      BranchLocation: this.state.locationPressed, Items: ItemList,
      coupon_code: this.state.appliedCoupon,
    };

    fetch(PLACEORDERURL, {
      method: 'POST', cache: 'no-cache',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify(Order),
    })
      .then(res => res.json())
      .then(json => {
        if (json.strRturnRes === true) {
          if (isCard) { this.onCardPayment(this.state.DefaultEmail); }
          else { this.OnlineOrderDataSave(); }
        }
      })
      .catch(er => {
        this.touchableInactive = false;
        this.setState({ isOrderPlaced: false });
        Alert.alert('Warning', "The operation coundn't be completed.", [{ text: 'Try Again' }], { cancelable: false });
      });
  }
}

const mapDispatchToProps = dispatch => ({ resetCart: () => dispatch({ type: 'RESET_CART' }) });
const mapStateToProps    = state    => ({ cartItems: state });

// withTheme first, connect second — same pattern as all other screens
export default connect(mapStateToProps, mapDispatchToProps)(withTheme(CheckoutScreen));

const styles = StyleSheet.create({
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    overflow: 'hidden', height: HEADER_MAX_HEIGHT,
    // backgroundColor removed — applied inline via theme.bg in render()
  },
});