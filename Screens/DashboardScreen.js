import React from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Platform,
  ImageBackground,
  Easing,
  StatusBar,
} from 'react-native';
import { Card } from 'react-native-paper';
import FastImage from 'react-native-fast-image';
import Slider from '../Components/Slider';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { APIURL } from '../Data/CloneData';
import moment from 'moment';
import { connect } from 'react-redux';
import FoodQtyLabel from '../Components/Food&QtyLabel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabase } from 'react-native-sqlite-storage';
import RBSheet from 'react-native-raw-bottom-sheet';
import { getVersion, isTablet } from 'react-native-device-info';
import ScaledImage from '../Components/ScaledImage';
import RadioButtonRN from 'radio-buttons-react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import LottieView from 'lottie-react-native';
import { showNetworkError } from '../Utils/networkError';

// ── Theme system ──────────────────────────────────────────────────────────────
import { withTheme } from '../Context/ThemeContext';
import ThemeToggle from '../Components/ThemeToggle';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
var db = openDatabase({ name: 'UserDatabase.db' });

class DashboardScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(1),
      slideDown: new Animated.Value(-width),
      slideRight: new Animated.Value(-width),
      slideUp: new Animated.Value(height),
      zoomIn: new Animated.Value(1),
      favouritlist: [],
      suggestList: [],
      offersList: [],
      userlog: null,
      Firstname: '',
      address: '',
      isLoading: true,
      isEnableScroll: false,
      isRBLoading: false,
      LocationI: '',
      LocationIAddress: '',
      LocationIPhone: '',
      LocationIMobile: '',
      LocationII: '',
      LocationIIAddress: '',
      LocationIIPhone: '',
      LocationIIMobile: '',
      Location: '',
      LocationName: '',
      LocaData: [],
      NotificationStatus: '',
      locationState: '',
      pulseAnim: new Animated.Value(1),
      glowAnim: new Animated.Value(0),
    };
    this.touchableInactive = false;
  }

  RESERVED_KEYS = new Set([
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
    'promoShown',
  ]);

  async componentDidMount() {
    this.startGlow();
    this.hasRestoredCart = false;

    this._unsubscribe = this.props.navigation.addListener('focus', async () => {
      this.fadeIn();
      const preNAme = await AsyncStorage.getItem('firstname');
      const preAddress = await AsyncStorage.getItem('address');
      if (
        preNAme !== this.state.Firstname ||
        preAddress !== this.state.address
      ) {
        this.CheckUserLog();
      }
    });

    this._unsubscribe2 = this.props.navigation.addListener('blur', async () => {
      this.fadeOut();
    });

    this.GetLocationDetails();
    await this.CheckUserLog();

    setTimeout(async () => {
      const userlog = await AsyncStorage.getItem('phonenumber');
      if (userlog && !this.hasRestoredCart) {
        await this.restoreCartSilently();
        this.hasRestoredCart = true;
      }
    }, 500);

    setTimeout(() => {
      this.debugAsyncStorage();
    }, 1000);

    this.onSaveOrderID();
  }

  componentDidUpdate(prevProps) {
    if (
      this.hasRestoredCart &&
      prevProps.cartItems.length !== this.props.cartItems.length
    ) {
      this.onReduxToAsync();
    }
  }

  // ── Cart helpers──────────────────────────────────────
  restoreCartSilently = async () => {
    try {
      const userlog = await AsyncStorage.getItem('phonenumber');
      if (!userlog) {
        console.log('User not logged in, skipping cart restore');
        return;
      }
      const cartKeys = await this.getCartKeys();
      if (cartKeys.length === 0) {
        console.log('No cart items to restore');
        return;
      }
      const items = await this.getValidStoredItems(cartKeys);
      if (items.length === 0) {
        console.log('No valid cart items found');
        return;
      }
      console.log(`Found ${items.length} cart items to restore`);
      items.forEach(item => {
        this.props.addItemToCart(item);
        console.log(`Restored: ${item.ProductName}`);
      });
      console.log(`Cart restored: ${items.length} items`);
    } catch (error) {
      console.error('Error restoring cart:', error);
    }
  };

  onReduxToAsync = async () => {
    const reduxList = this.props.cartItems;
    if (reduxList.length > 0) {
      console.log(`Syncing ${reduxList.length} items to AsyncStorage`);
      for (let i = 0; i < reduxList.length; i++) {
        const CartItemID = reduxList[i].CartItemID;
        if (!CartItemID) {
          console.warn('Skipping item without CartItemID');
          continue;
        }
        const Product = {
          OrderID: reduxList[i].OrderID,
          CartItemID: reduxList[i].CartItemID,
          ProductCode: reduxList[i].ProductCode,
          ProductName: reduxList[i].ProductName,
          ProductDescription: reduxList[i].ProductDescription,
          ProductIMG: reduxList[i].ProductIMG,
          Price: reduxList[i].ProductPrice,
          NetTotal: reduxList[i].NetTotal,
          Amount: reduxList[i].Amount,
          Qty: reduxList[i].Qty,
          Addons: reduxList[i].Addons || [],
          Extra: reduxList[i].Extra || [],
          LocationDB: reduxList[i].LocationDB,
          isDiscounted: reduxList[i].isDiscounted || false,
        };
        await AsyncStorage.setItem(
          `cart:${CartItemID}`,
          JSON.stringify(Product),
        );
        console.log(`Saved: ${Product.ProductName}`);
      }
    }
  };

  getCartKeys = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(k => k.startsWith('cart:'));
  };

  getValidStoredItems = async cartKeys => {
    const entries = await AsyncStorage.multiGet(cartKeys);
    const valid = [];
    for (const [key, raw] of entries) {
      if (!raw) {
        console.warn(`Empty value for key: ${key}`);
        continue;
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.CartItemID && parsed.ProductName) {
          valid.push(parsed);
        } else {
          console.warn(`Invalid cart item structure at ${key}:`, parsed);
        }
      } catch (e) {
        console.warn(`JSON parse error at ${key}:`, e.message);
      }
    }
    return valid;
  };

  // ── Animations ───────────────────────────────────────────────────
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

  GreetingAnimation = () => {
    Animated.parallel([
      Animated.spring(this.state.slideDown, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(this.state.slideRight, {
        toValue: 0,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.spring(this.state.slideUp, {
        toValue: 0,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      this.setState({ isEnableScroll: true });
    });
  };

  fadeIn = () => {
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 600,
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

  // ── Social links ─────────────────────────────────────────────────
  onFacebookPress = () => {
    const url = 'https://www.facebook.com/share/1NGgA5QHtT/?mibextid=wwXIfr';
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  };
  onInstagramPress = () => {
    const url =
      'https://www.instagram.com/cafe007_emb?igsh=MXE1ZG1iZW82ZXJodg==';
    Linking.canOpenURL(url).then(() => Linking.openURL(url));
  };
  onYoutubePress = () => {
    Linking.canOpenURL('vnd.youtube://watch?v=4LEGIrZodsQ').then(supported => {
      Linking.openURL(
        supported
          ? 'vnd.youtube://watch?v=4LEGIrZodsQ'
          : 'https://www.youtube.com/watch?v=4LEGIrZodsQ',
      );
    });
  };

  // ── Helpers ──────────────────────────────────────────────────────
  GeneratGreetings = () => {
    var currentHour = moment().format('HH');
    if (currentHour >= 3 && currentHour < 12) return 'Good Morning';
    if (currentHour >= 12 && currentHour < 15) return 'Good Afternoon';
    if (currentHour >= 15 && currentHour < 20) return 'Good Evening';
    if (currentHour >= 20 && currentHour < 3) return 'Good Night';
    return 'Hello';
  };

  generateOrderID = length => {
    const digits = '0123456789';
    let OrderID = '';
    for (let i = 0; i < length; i++)
      OrderID += digits[Math.floor(Math.random() * 10)];
    return OrderID;
  };

  onSaveOrderID = async () => {
    const cartKeys = await this.getCartKeys();
    const list = await AsyncStorage.multiGet(cartKeys);
    if (this.props.cartItems.length === 0 && list.length === 0) {
      AsyncStorage.setItem('OrderID', this.generateOrderID(7));
    }
  };

  CheckUserLog = async () => {
    try {
      let number = await AsyncStorage.getItem('phonenumber');
      this.setState({ userlog: number });
      if (number !== null) await this.GetPersonalInfo();
    } catch (error) {
      console.error('Error checking user login:', error);
    }
  };

  GetPersonalInfo = async () => {
    try {
      const Firstname = await AsyncStorage.getItem('firstname');
      const Address = await AsyncStorage.getItem('address');
      this.setState({ Firstname: Firstname || '', address: Address || '' });
    } catch (error) {
      console.error('Error getting personal info:', error);
    }
  };

  numberWithCommas = x => {
    let convertX = x.toString().replace(/\B(?=(\d{1000})+(?!\d))/g, ',');
    return parseFloat(convertX).toFixed(2);
  };

  onContinuePress = () => {
    this.RRBSheet.close();
    setTimeout(() => {
      this.props.navigation.navigate('RatingScreen');
    }, 700);
  };

  onAsyncToRedux = async () => {
    const cartKeys = await this.getCartKeys();
    const storedItems = await this.getValidStoredItems(cartKeys);
    const existing = new Set(this.props.cartItems.map(i => i.CartItemID));
    storedItems.forEach(item => {
      if (!existing.has(item.CartItemID)) this.props.addItemToCart(item);
      else console.log(`ℹ️ Skipped duplicate: ${item.ProductName}`);
    });
    this.CRBSheet.close();
  };

  debugAsyncStorage = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const cartKeys = allKeys.filter(k => k.startsWith('cart:'));
    console.log('=== ALL ASYNC STORAGE KEYS ===', allKeys);
    console.log('=== CART KEYS ===', cartKeys);
    if (cartKeys.length > 0) {
      const cartItems = await AsyncStorage.multiGet(cartKeys);
      cartItems.forEach(([key, value]) => console.log(key, ':', value));
    }
  };

  onClearCart = async () => {
    const cartKeys = await this.getCartKeys();
    await AsyncStorage.multiRemove(cartKeys);
    this.props.resetCart();
    this.CRBSheet.close();
  };

  retreiveLocation = async () => {
    await AsyncStorage.multiGet(['LOCA', 'LOCA_NAME']).then(res => {
      this.setState({ Location: res[0][1], LocationName: res[1][1] }, () => {
        this.LoadFavouriteItem(res[0][1]);
      });
    });
  };

  // ── Render helpers ────────
  renderSingleFavourite = ({ item, index }) => {
    const { theme } = this.props; // ← NEW: pull theme

    const countTypes = this.props.cartItems.filter(
      product => product.Prod_Name === item.Prod_Name,
    );
    let qtycount = 0;
    countTypes.forEach(element => {
      qtycount += element.Qty;
    });

    return (
      <View>
        <Card
          key={index}
          style={{
            width: 200,
            marginLeft: 10,
            marginBottom: 10,
            backgroundColor: theme.card,
            borderRadius: 20,
            overflow: 'hidden',
            elevation: 6,
          }}
        >
          <TouchableOpacity
            disabled={!!item.isSoldOut}
            onPress={() =>
              this.props.navigation.navigate('ItemScreen', {
                Location: 'Home',
                PCode: item.Prod_Code,
                PName: item.Prod_Name,
                PDescription: item.More_Descrip,
                PPrice: item.NconvertPrice,
                IMG: item.ImagePath,
              })
            }
          >
            <View style={{ flex: 1, borderRadius: 20 }}>
              <FastImage
                source={
                  item.ImagePath === ''
                    ? require('../assets/image-placeholder.png')
                    : { uri: item.ImagePath, priority: FastImage.priority.high }
                }
                style={{ width: 200, height: 190, borderRadius: 20 }}
              />
              <FoodQtyLabel
                isBestseller={item.BestSeller}
                isOffer={item.Offer}
                qty={qtycount}
              />
            </View>
          </TouchableOpacity>
        </Card>
        <Text
          style={{
            width: 200,
            marginLeft: 15,
            fontSize: 18,
            color: theme.text, // ← NEW
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
          }}
          numberOfLines={2}
        >
          {item.Prod_Name}
        </Text>
        <Text
          style={{
            width: 200,
            marginLeft: 10,
            fontSize: 16,
            textTransform: 'lowercase',
            color: theme.textSub,
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
          }}
          numberOfLines={1}
        >
          @{item.Prod_Name}
        </Text>
        {item.isSoldOut ? (
          <View
            style={{
              width: 70,
              height: 25,
              backgroundColor: 'red',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 15,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 14,
                marginTop: -2,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              }}
            >
              Sold out
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  renderSingleSuggest = ({ item, index }) => {
    const { theme } = this.props;

    const countTypes = this.props.cartItems.filter(
      product => product.ProductName === item.Prod_Name,
    );
    let qtycount = 0;
    countTypes.forEach(element => {
      qtycount += element.Qty;
    });

    return (
      <View>
        <Card
          key={index}
          style={{
            width: 200,
            marginLeft: 10,
            marginBottom: 10,
            backgroundColor: theme.card, // ← was 'white'
            borderRadius: 20,
            overflow: 'hidden',
            elevation: 6,
          }}
        >
          <TouchableOpacity
            disabled={item.isSoldOut === '1'}
            onPress={() =>
              this.props.navigation.navigate('ItemScreen', {
                Location: 'Home',
                PCode: item.Prod_Code,
                PName: item.Prod_Name,
                PDescription: item.More_Descrip,
                PPrice: item.NconvertPrice,
                IMG: item.ImagePath,
              })
            }
          >
            <View style={{ flex: 1, borderRadius: 20 }}>
              <FastImage
                source={
                  item.ImagePath === ''
                    ? require('../assets/image-placeholder.png')
                    : { uri: item.ImagePath, priority: FastImage.priority.high }
                }
                style={{ width: 200, height: 190, borderRadius: 20 }}
              />
              <FoodQtyLabel
                isBestseller={item.BestSeller}
                isOffer={item.Offer}
                qty={qtycount}
              />
            </View>
          </TouchableOpacity>
        </Card>
        <Text
          style={{
            width: 200,
            marginLeft: 15,
            fontSize: 18,
            color: theme.text,
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
          }}
          numberOfLines={1}
        >
          {item.Prod_Name}
        </Text>
        <Text
          style={{
            width: 200,
            marginLeft: 10,
            fontSize: 16,
            textTransform: 'lowercase',
            color: theme.textSub,
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
          }}
          numberOfLines={1}
        >
          @{item.Prod_Name}
        </Text>
      </View>
    );
  };

  renderOffterItem(offers) {
    const { theme } = this.props;
    return offers.map((item, index) => (
      <View key={index} style={{ marginBottom: 10 }}>
        <ScaledImage uri={item.imagepath} width={width} />
        {item.title !== '' && (
          <>
            <Text
              style={{
                fontSize: 18,
                marginLeft: 20,
                marginTop: 10,
                color: theme.text,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                textTransform: 'uppercase',
              }}
            >
              {item.title}
            </Text>
            <View
              style={{
                height: 0.9,
                marginLeft: 20,
                marginRight: 20,
                marginBottom: 10,
                marginTop: 10,
                backgroundColor: theme.separator,
              }}
            />
          </>
        )}
        {item.description !== '' && (
          <>
            <Text
              style={{
                fontSize: 16,
                marginLeft: 20,
                marginBottom: 10,
                marginRight: 20,
                color: theme.textSub,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              }}
            >
              {item.description}
            </Text>
            <View
              style={{
                height: 0.9,
                marginLeft: 20,
                marginRight: 20,
                marginBottom: 10,
                backgroundColor: theme.separator,
              }}
            />
          </>
        )}
      </View>
    ));
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  render() {
    const { theme, isDark } = this.props;

    const pillWidth = 120;
    const pillHeight = 45;
    const pillRadius = 25;
    const translateX = this.state.glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-pillWidth, pillWidth],
    });

    return (
      <Animated.View
        style={[
          { flex: 1, backgroundColor: theme.bg },
          { opacity: this.state.fadeAnim },
        ]}
      >
        <StatusBar
          barStyle={theme.statusBar}
          backgroundColor={theme.bg}
          translucent={false}
        />

        <ScrollView
          scrollEnabled={this.state.isEnableScroll}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isLoading}
              colors={[theme.accent]}
              tintColor={theme.accent}
              title="Refreshing"
              titleColor={theme.textSub}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Location row  ── */}
          <Animated.View
            style={[
              { flexDirection: 'row', alignItems: 'center' },
              { transform: [{ translateY: this.state.slideDown }] },
            ]}
          >
            {/* Location dot + name — takes all remaining space */}
            <View
              style={{
                marginLeft: 27,
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <View style={{ flex: 0.2 }}>
                <FontAwesome6
                  name="location-dot"
                  size={20}
                  solid
                  color={theme.accent}
                />
              </View>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 16,
                  paddingRight: 5,
                  color: theme.text,
                }}
              >
                {this.state.LocationName}
              </Text>
            </View>

            {/* ── Theme toggle — pinned to the right of the location row ── */}
            <ThemeToggle style={{ marginRight: 16, marginTop: 10 }} />
          </Animated.View>

          {/* ── Top action row — hamburger | delivery ── */}
          <Animated.View
            style={[
              { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
              { transform: [{ translateY: this.state.slideDown }] },
            ]}
          >
            {/* Hamburger */}
            <View
              style={{
                marginLeft: 30,
                flex: 0.5,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 0.6 }}>
                <TouchableOpacity onPress={() => this.SRBSheet.open()}>
                  <FontAwesome6
                    name="align-left"
                    size={20}
                    color={theme.text}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Delivery address  */}
            <View style={{ borderRadius: 50, margin: 10, flex: 1 }}>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 16,
                  paddingLeft: 5,
                  paddingRight: 5,
                  textAlign: 'right',
                  color: theme.text,
                }}
              >
                Delivery Details
              </Text>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  fontSize: 16,
                  paddingLeft: 5,
                  paddingRight: 5,
                  textAlign: 'right',
                  color: theme.textSub,
                }}
              >
                {this.state.userlog === null
                  ? 'You are not signIn'
                  : this.state.address}
              </Text>
            </View>
          </Animated.View>

          {/* ── Greeting ── */}
          <Animated.View
            style={[
              {
                marginRight: 20,
                marginLeft: 25,
                marginBottom: 10,
                marginTop: 15,
                flexDirection: 'row',
                alignItems: 'center',
              },
              { transform: [{ translateX: this.state.slideRight }] },
            ]}
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
                Hi {this.GeneratGreetings()} ,
              </Text>
              {this.state.userlog !== null && (
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 26,
                    marginBottom: 5,
                    color: theme.text,
                  }}
                >
                  {this.state.Firstname}
                </Text>
              )}
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 16,
                  color: theme.textSub,
                }}
              >
                Quick, grab your food before they run out!
              </Text>
            </View>
          </Animated.View>

          {/* ── Slider + content  ── */}
          <Animated.View
            style={[{ transform: [{ translateY: this.state.slideUp }] }]}
          >
            <View style={{ marginTop: 10, marginBottom: 10 }}>
              <Slider />
            </View>

            <View
              style={{
                height: 0.9,
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 15,
                backgroundColor: theme.separator,
              }}
            />

            {/* Favourites header + See menu pill */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 20,
                marginRight: 20,
              }}
            >
              <View style={{ flex: 0.8 }}>
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
                  Looking for your favourite meal
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    color: theme.textSub,
                  }}
                >
                  The way to entice people into cooking is to cook delicious
                  things.
                </Text>
              </View>

              {/* See menu pill  */}
              <TouchableOpacity
                style={{ flex: 0.5, alignItems: 'flex-end', marginRight: 10 }}
                onPress={() => this.props.navigation.navigate('HomeScreen')}
              >
                <Animated.View
                  style={[
                    {
                      width: 125,
                      height: 50,
                      backgroundColor: theme.pill,
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
                      color: theme.pillText,
                    }}
                  >
                    See menu
                  </Text>
                  <MaskedView
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                    maskElement={
                      <View
                        style={{
                          flex: 1,
                          borderRadius: pillRadius,
                          borderWidth: 2,
                          borderColor: 'black',
                        }}
                      />
                    }
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: pillRadius,
                        borderWidth: 2,
                        borderColor: isDark ? theme.accent : '#fff',
                      }}
                    />
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
                        colors={[
                          'transparent',
                          isDark ? 'rgba(232,160,64,0.6)' : 'gold',
                          'transparent',
                        ]}
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
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 10,
                marginTop: 20,
                backgroundColor: theme.separator,
              }}
            />

            <FlatList
              style={{ margin: 10 }}
              data={this.state.favouritlist}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={this.renderSingleFavourite}
              keyExtractor={(item, index) => index.toString()}
            />

            <View
              style={{
                height: 0.5,
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 10,
                marginTop: 10,
                backgroundColor: theme.separator,
              }}
            />

            {/* Suggest header + See menu pill */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: 20,
                marginRight: 20,
                marginTop: 15,
              }}
            >
              <View style={{ flex: 0.8 }}>
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
                  Suggest Collections
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    color: theme.textSub,
                  }}
                >
                  Real cooking is more about following your heart than following
                  recipes.
                </Text>
              </View>

              <TouchableOpacity
                style={{ flex: 0.5, alignItems: 'flex-end', marginRight: 10 }}
                onPress={() => this.props.navigation.navigate('HomeScreen')}
              >
                <Animated.View
                  style={[
                    {
                      width: 125,
                      height: 50,
                      backgroundColor: theme.pill,
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
                      color: theme.pillText,
                    }}
                  >
                    See menu
                  </Text>
                  <MaskedView
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                    maskElement={
                      <View
                        style={{
                          flex: 1,
                          borderRadius: pillRadius,
                          borderWidth: 2,
                          borderColor: 'black',
                        }}
                      />
                    }
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: pillRadius,
                        borderWidth: 2,
                        borderColor: isDark ? theme.accent : '#fff',
                      }}
                    />
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
                        colors={[
                          'transparent',
                          isDark ? 'rgba(232,160,64,0.6)' : 'gold',
                          'transparent',
                        ]}
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
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 10,
                marginTop: 25,
                backgroundColor: theme.separator,
              }}
            />

            <FlatList
              style={{ margin: 10 }}
              data={this.state.suggestList}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={this.renderSingleSuggest}
              keyExtractor={(item, index) => index.toString()}
            />

            <View
              style={{
                height: 0.5,
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 10,
                marginTop: 10,
                backgroundColor: theme.separator,
              }}
            />

            {/* Today Offers header */}
            <View
              style={{
                marginLeft: 20,
                marginRight: 20,
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 24,
                  textAlign: 'center',
                  color: theme.text,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                }}
              >
                Today Offers
              </Text>
              <Text
                style={{
                  marginLeft: 10,
                  marginRight: 10,
                  textAlign: 'center',
                  color: theme.textSub,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                }}
              >
                Restaurant promotions can involve everything from showcasing
                signature dishes to running happy hour deals
              </Text>
            </View>

            <View
              style={{
                height: 0.5,
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 10,
                marginTop: 10,
                backgroundColor: theme.separator,
              }}
            />

            {/* Picked Up For You */}
            <View
              style={{
                marginLeft: 20,
                marginRight: 20,
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 24,
                  textAlign: 'center',
                  color: theme.text,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                }}
              >
                Picked Up For You
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 10 }}
                contentContainerStyle={{
                  paddingHorizontal: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                {/* Popular */}
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.navigate('PopularScreen')
                  }
                  style={{ alignItems: 'center', marginRight: 16 }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      backgroundColor: theme.card,
                      justifyContent: 'center',
                      alignItems: 'center',
                      elevation: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  >
                    <LottieView
                      source={require('../assets/lottiejson/Popular Badge.json')}
                      autoPlay
                      loop
                      style={{ width: 80, height: 80 }}
                    />
                  </View>
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      textAlign: 'center',
                      color: theme.text,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                    }}
                  >
                    Popular
                  </Text>
                </TouchableOpacity>

                {/* Newly Added */}
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.navigate('NewlyAddedScreen')
                  }
                  style={{ alignItems: 'center', marginRight: 16 }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      backgroundColor: theme.card,
                      justifyContent: 'center',
                      alignItems: 'center',
                      elevation: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  >
                    <LottieView
                      source={require('../assets/lottiejson/New button.json')}
                      autoPlay
                      loop
                      style={{ width: 80, height: 80 }}
                    />
                  </View>
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      textAlign: 'center',
                      color: theme.text,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                    }}
                  >
                    Newly Added
                  </Text>
                </TouchableOpacity>

                {/* Trending */}
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.navigate('TrendingScreen')
                  }
                  style={{ alignItems: 'center', marginRight: 16 }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      backgroundColor: theme.card,
                      justifyContent: 'center',
                      alignItems: 'center',
                      elevation: 6,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  >
                    <LottieView
                      source={require('../assets/lottiejson/Untitled file.json')}
                      autoPlay
                      loop
                      style={{ width: 52, height: 52 }}
                    />
                  </View>
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      textAlign: 'center',
                      color: theme.text,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                    }}
                  >
                    Trending
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={{ marginBottom: 0 }}>
              {this.renderOffterItem(this.state.offersList)}
            </View>
          </Animated.View>
        </ScrollView>

        {/* ── Location RBSheet ── */}
        <RBSheet
          ref={ref => {
            this.LocaSheet = ref;
          }}
          animationType="fade"
          height={isTablet() ? 995 : 995}
          openDuration={800}
          closeDuration={800}
          closeOnDragDown={false}
          closeOnPressMask
          closeOnPressBack={false}
          customStyles={{
            container: {
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
              backgroundColor: theme.card,
            },
          }}
        >
          <View style={{ flex: 1 }}>
            <ImageBackground
              source={require('../assets/image-placeholder.png')}
              style={{ width, height }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  marginTop: 50,
                  marginBottom: 10,
                  alignSelf: 'center',
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 22,
                  color: 'black',
                }}
              >
                Select Location For Your Order
              </Text>
              <RadioButtonRN
                animationTypes={['shake']}
                style={{ marginTop: 30 }}
                boxStyle={{ marginLeft: 30, marginRight: 30 }}
                circleSize={30}
                textStyle={{
                  marginRight: 40,
                  alignSelf: 'center',
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 20,
                  color: 'black',
                }}
                data={this.state.LocaData}
                selectedBtn={e => {
                  if (this.props.cartItems.length > 0) {
                    this.setState(
                      { Location: e.Val, LocationName: e.label },
                      async () => {
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
                          'LOCA_NAME',
                        ].forEach(p => keys.splice(keys.indexOf(p), 1));
                        await AsyncStorage.multiRemove(keys).then(() => {
                          this.props.resetCart();
                        });
                        AsyncStorage.setItem('LOCA', e.Val);
                        AsyncStorage.setItem('LOCA_NAME', e.label);
                      },
                    );
                  } else {
                    this.setState(
                      { Location: e.Val, LocationName: e.label },
                      () => {
                        AsyncStorage.setItem('LOCA', e.Val);
                        AsyncStorage.setItem('LOCA_NAME', e.label);
                      },
                    );
                  }
                  this.LoadFavouriteItem(e.Val);
                  this.LocaSheet.close();
                }}
              />
            </ImageBackground>
          </View>
        </RBSheet>

        {/* ── About RBSheet ── */}
        <RBSheet
          ref={ref => {
            this.SRBSheet = ref;
          }}
          animationType="fade"
          height={isTablet() ? 490 : 510}
          openDuration={700}
          closeDuration={700}
          closeOnDragDown={false}
          closeOnPressMask
          customStyles={{
            container: {
              borderTopLeftRadius: 15,
              borderTopRightRadius: 15,
              backgroundColor: theme.card,
            },
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              allowFontScaling={false}
              style={{
                margin: 10,
                alignSelf: 'center',
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 18,
                color: theme.text,
              }}
            >
              About us
            </Text>
            <View
              style={{
                height: 1,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: theme.separator,
              }}
            />
            <ScrollView>
              <Text
                allowFontScaling={false}
                style={{
                  margin: 10,
                  marginLeft: 29,
                  marginRight: 20,
                  marginTop: 20,
                  textAlign: 'center',
                  alignSelf: 'center',
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 16,
                  color: theme.text,
                }}
              >
                Cafe 007 is a venture by Sarathchandra Textile, located amidst
                the stunning landscape of Sabaragamuwa province, The restaurant
                started its service in 2018 focusing on Ceylonese fusion
                inspired fast food serving some of the best burgers, sandwiches,
                wraps, drinks and desserts out of Colombo.
              </Text>

              <TouchableOpacity
                onPress={() => Linking.openURL('mailto:info@cafe007.lk')}
                style={{ alignSelf: 'center' }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    alignSelf: 'center',
                    textDecorationLine: 'underline',
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_SemiBold'
                        : 'AsapSemiBold',
                    fontSize: 18,
                    color: theme.accent,
                  }}
                >
                  info@cafe007.lk
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  height: 1,
                  marginRight: 30,
                  marginLeft: 30,
                  marginTop: 10,
                  marginBottom: 5,
                  backgroundColor: theme.separator,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  marginLeft: 29,
                  marginRight: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ margin: 10, alignItems: 'center' }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      textAlign: 'center',
                      color: theme.text,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_SemiBold'
                          : 'AsapSemiBold',
                      fontSize: 16,
                    }}
                  >
                    {this.state.LocationII}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      textAlign: 'center',
                      color: theme.textSub,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                    }}
                  >
                    {this.state.LocationIIAddress}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${this.state.LocationIIPhone}`)
                    }
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        textAlign: 'center',
                        color: theme.accent,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 16,
                      }}
                    >
                      Tel: {this.state.LocationIIPhone}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${this.state.LocationIIMobile}`)
                    }
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        textAlign: 'center',
                        color: theme.accent,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 16,
                      }}
                    >
                      Tel: {this.state.LocationIIMobile}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  marginRight: 30,
                  marginLeft: 30,
                  marginTop: 5,
                  backgroundColor: theme.separator,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginLeft: 20,
                  marginRight: 20,
                  marginTop: 15,
                  marginBottom: 20,
                  paddingTop: 5,
                  paddingBottom: 5,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingVertical: 10,
                  }}
                  onPress={() => Linking.openURL('http://www.onimtait.com')}
                >
                  <Text
                    style={{
                      marginBottom: 8,
                      fontSize: 15,
                      color: theme.textMuted,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                    }}
                  >
                    powered by
                  </Text>
                  <Image
                    source={
                      isDark
                        ? require('../assets/images_dark.png')
                        : require('../assets/images.png')
                    }
                    style={{ width: 50, height: 50 }}
                  />
                </TouchableOpacity>

                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      marginBottom: 12,
                      fontSize: 18,
                      color: theme.textSub,
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    }}
                  >
                    version {getVersion()}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {[
                      { icon: 'facebook', fn: this.onFacebookPress },
                      { icon: 'instagram', fn: this.onInstagramPress },
                      {
                        icon: 'google',
                        fn: () =>
                          Linking.openURL(
                            'https://cafe007.lk/embilipitiya-cafe007/',
                          ),
                      },
                      { icon: 'youtube', fn: this.onYoutubePress },
                    ].map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        style={{ marginRight: 12 }}
                        onPress={s.fn}
                      >
                        <FontAwesome6
                          name={s.icon}
                          size={25}
                          brand
                          color={theme.text}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </RBSheet>

        {/* ── Rate RBSheet ── */}
        <RBSheet
          ref={ref => {
            this.RRBSheet = ref;
          }}
          animationType="fade"
          height={380}
          openDuration={700}
          closeDuration={700}
          closeOnDragDown={false}
          closeOnPressMask={false}
          customStyles={{
            wrapper: { backgroundColor: 'rgba(0,0,0,0.6)' },
            container: {
              backgroundColor: theme.card,
            },
          }}
        >
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ marginTop: 30, marginBottom: 10 }}>
              <Image
                source={require('../assets/4.png')}
                style={{ width: 110, height: 110, borderRadius: 55 }}
              />
            </View>
            <Text
              style={{
                fontSize: 24,
                color: theme.text,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              }}
            >
              Rate and tip
            </Text>
            <Text
              style={{
                marginLeft: 50,
                marginRight: 50,
                marginTop: 5,
                textAlign: 'center',
                fontSize: 15,
                color: theme.textSub,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              }}
            >
              Let us know about your meal and delivery. You can also add a tip
              for rider.
            </Text>
            <View style={{ marginTop: 25 }}>
              <TouchableOpacity onPress={this.onContinuePress}>
                <View
                  style={{
                    width: 300,
                    height: 60,
                    backgroundColor: theme.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: theme.pillText,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                    }}
                  >
                    Continue
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 25 }}>
              <TouchableOpacity onPress={() => this.RRBSheet.close()}>
                <Text
                  style={{
                    fontSize: 18,
                    color: theme.text,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  }}
                >
                  Skip
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </RBSheet>
      </Animated.View>
    );
  }

  // ── Data loaders ────────────────────────────────────────────
  LoadFavouriteItem(Loca) {
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
            Para_Data: '113',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: Loca,
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text1',
            Para_Type: 'VARCHAR',
          },
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    })
      .then(r => r.json())
      .then(json => {
        const favouritlist = json.CommonResult.Table.map(i => ({
          Prod_Code: i.Prod_Code,
          Prod_Name: i.Prod_Name,
          ImagePath: i.ImagePath,
          More_Descrip: i.More_Descrip,
          Selling_Price: this.numberWithCommas(i.Selling_Price),
          NconvertPrice: i.Selling_Price,
          BestSeller: i.isBestSeller,
          Offer: i.isOffer,
          isSoldOut: i.isSoldOut,
        }));
        this.setState({ favouritlist, isLoading: false });
      })
      .catch(er => {
        console.log(er);
        showNetworkError(
          er,
          () => this.LoadFavouriteItem(this.state.Location),
          null,
        );
      })
      .finally(() => {
        this.GreetingAnimation();
        this.LoadSuggestItem(Loca);
      });
  }

  LoadSuggestItem(Loca) {
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
            Para_Data: '114',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: Loca,
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text1',
            Para_Type: 'VARCHAR',
          },
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    })
      .then(r => r.json())
      .then(json => {
        const suggestList = json.CommonResult.Table.map(i => ({
          Prod_Code: i.Prod_Code,
          Prod_Name: i.Prod_Name,
          ImagePath: i.ImagePath,
          More_Descrip: i.More_Descrip,
          Selling_Price: this.numberWithCommas(i.Selling_Price),
          NconvertPrice: i.Selling_Price,
          BestSeller: i.isBestSeller,
          Offer: i.isOffer,
          isSoldOut: i.isSoldOut,
        }));
        this.setState({ suggestList });
      })
      .catch(er => {
        console.log(er);
        showNetworkError(
          er,
          () => this.LoadSuggestItem(this.state.Location),
          null,
        );
      })
      .finally(() => {
        this.LoadOffers();
      });
  }

  LoadOffers() {
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
            Para_Data: '91',
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
      .then(r => r.json())
      .then(json => {
        const offersList = json.CommonResult.Table.map(i => ({
          title: i.title,
          description: i.description,
          imagepath: i.imagepath,
          promocode: i.promocode,
          Height: parseInt(i.Height),
          Width: parseInt(i.Width),
        }));
        this.setState({ offersList });
      })
      .catch(er => {
        console.log(er);
        showNetworkError(er, () => this.LoadOffers(), null);
      })
      .finally(() => {
        this.LoadInfo();
      });
  }

  LoadInfo() {
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
            Para_Data: '110',
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
      .then(r => r.json())
      .then(json => {
        this.setState({
          LocationI: json.CommonResult.Table[0].Location,
          LocationIAddress: json.CommonResult.Table[0].Address,
          LocationIPhone: json.CommonResult.Table[0].Phonenumber,
          LocationIMobile: json.CommonResult.Table[0].Mobilenumber,
          LocationII: json.CommonResult.Table[1].Location,
          LocationIIAddress: json.CommonResult.Table[1].Address,
          LocationIIPhone: json.CommonResult.Table[1].Phonenumber,
          LocationIIMobile: json.CommonResult.Table[1].Mobilenumber,
        });
      })
      .catch(er => {
        console.log(er);
        showNetworkError(er, () => this.LoadInfo(), null);
      });
  }

  GetLocationDetails() {
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
            Para_Data: '116',
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
      .then(r => r.json())
      .then(async json => {
        const LocaData = json.CommonResult.Table.map(item => ({
          Val: item.loca,
          label: item.description,
        }));
        this.setState({ LocaData, isLoading: false });
        if (LocaData.length === 1) {
          const singleLocation = LocaData[0];
          this.setState(
            {
              Location: singleLocation.Val,
              LocationName: singleLocation.label,
            },
            async () => {
              await AsyncStorage.setItem('LOCA', singleLocation.Val);
              await AsyncStorage.setItem('LOCA_NAME', singleLocation.label);
              this.LoadFavouriteItem(singleLocation.Val);
            },
          );
        } else if (LocaData.length > 1) {
          const storedLoca = await AsyncStorage.getItem('LOCA');
          if (!storedLoca) this.LocaSheet.open();
          else this.retreiveLocation();
        }
      })
      .catch(er => {
        console.log('loca', er);
        showNetworkError(er, () => this.GetLocationDetails(), null);
      });
  }
}

// ── Redux ─────────────────────────────────────────────────────────────────────
const mapDispatchToProps = dispatch => ({
  addItemToCart: product => dispatch({ type: 'ADD_TO_CART', payload: product }),
  resetCart: () => dispatch({ type: 'RESET_CART' }),
});
const mapStateToProps = state => ({ cartItems: state });

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTheme(DashboardScreen));
