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
} from 'react-native';
import { Card } from 'react-native-paper';
import FastImage from 'react-native-fast-image';
import Slider from '../Components/Slider';
// import {Card} from 'react-native-shadow-cards';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { APIURL } from '../Data/CloneData';
import moment from 'moment';
import { connect } from 'react-redux';
import FoodQtyLabel from '../Components/Food&QtyLabel';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDatabase } from 'react-native-sqlite-storage';
import RBSheet from 'react-native-raw-bottom-sheet';
import { getVersion, isTablet } from 'react-native-device-info';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import ScaledImage from '../Components/ScaledImage';
import RadioButtonRN from 'radio-buttons-react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icons from 'react-native-vector-icons/Ionicons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AlertDialog from '../Components/AlertDialog';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

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

 componentDidMount() {
    this.startGlow();
    this.hasRestoredCart = false; 

    this._unsubscribe = this.props.navigation.addListener('focus', async () => {
      this.fadeIn();
      const preNAme = await AsyncStorage.getItem('Firstname');
      const preAddress = await AsyncStorage.getItem('Address');
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
    this.CheckUserLog();

    // Restore cart AFTER CheckUserLog completes
    setTimeout(async () => {
      const userlog = await AsyncStorage.getItem('phonenumber');
      if (userlog && !this.hasRestoredCart) {
        await this.restoreCartSilently();
        this.hasRestoredCart = true;
      }
    }, 500); // Give time for CheckUserLog to complete

    setTimeout(() => {
      this.debugAsyncStorage(); 
    }, 1000);

    this.onSaveOrderID();
  }

componentDidUpdate(prevProps) {
    // Only sync to AsyncStorage if cart was modified (not on initial restore)
    if (
      this.hasRestoredCart &&
      prevProps.cartItems.length !== this.props.cartItems.length
    ) {
      this.onReduxToAsync();
    }
  }

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

      // Add items to Redux
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

  // Helper methods remain the same
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

  onFacebookPress = () => {
    Linking.canOpenURL('fb://page/610237876001241').then(supported => {
      if (supported) {
        return Linking.openURL('fb://page/610237876001241');
      } else {
        return Linking.openURL('https://www.facebook.com/Cafe007Srilanka/');
      }
    });
  };

  onInstagramPress = () => {
    Linking.canOpenURL('instagram://user?username=cafe007.kuruwita').then(
      supported => {
        if (supported) {
          return Linking.openURL('instagram://user?username=cafe007.kuruwita');
        } else {
          return Linking.openURL('https://www.instagram.com/cafe007.kuruwita/');
        }
      },
    );
  };

  onYoutubePress = () => {
    Linking.canOpenURL('vnd.youtube://watch?v=4LEGIrZodsQ').then(supported => {
      if (supported) {
        return Linking.openURL('vnd.youtube://watch?v=4LEGIrZodsQ');
      } else {
        return Linking.openURL('https://www.youtube.com/watch?v=4LEGIrZodsQ');
      }
    });
  };

  GeneratGreetings = () => {
    var currentHour = moment().format('HH');

    if (currentHour >= 3 && currentHour < 12) {
      return 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 15) {
      return 'Good Afternoon';
    } else if (currentHour >= 15 && currentHour < 20) {
      return 'Good Evening';
    } else if (currentHour >= 20 && currentHour < 3) {
      return 'Good Night';
    } else {
      return 'Hello';
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

  onSaveOrderID = async () => {
    const cartKeys = await this.getCartKeys();
    const list = await AsyncStorage.multiGet(cartKeys);
    if (this.props.cartItems.length === 0 && list.length === 0) {
      AsyncStorage.setItem('OrderID', this.generateOrderID(7));
    }
  };

  CheckUserLog = async () => {
    let number = null;
    number = await AsyncStorage.getItem('phonenumber');
    if (number === null) {
      this.setState({ userlog: number });
    } else {
      this.setState({ userlog: number }, () => {
        this.GetPersonalInfo();
      });
    }
  };

  GetPersonalInfo = async () => {
    var Firstname = await AsyncStorage.getItem('firstname');
    var Address = await AsyncStorage.getItem('address');
    this.setState({
      Firstname: Firstname,
      address: Address,
    });
  };

  numberWithCommas = x => {
    let convertX = x.toString().replace(/\B(?=(\d{1000})+(?!\d))/g, ',');
    let xFloat = parseFloat(convertX).toFixed(2);
    return xFloat;
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
      if (!existing.has(item.CartItemID)) {
        this.props.addItemToCart(item);
      } else {
        console.log(`ℹ️ Skipped duplicate: ${item.ProductName}`);
      }
    });

    this.CRBSheet.close();
  };

 debugAsyncStorage = async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('=== ALL ASYNC STORAGE KEYS ===');
    console.log(allKeys);

    const cartKeys = allKeys.filter(k => k.startsWith('cart:'));
    console.log('=== CART KEYS ===');
    console.log(cartKeys);

    if (cartKeys.length > 0) {
      const cartItems = await AsyncStorage.multiGet(cartKeys);
      console.log('=== CART ITEMS ===');
      cartItems.forEach(([key, value]) => {
        console.log(key, ':', value);
      });
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

  renderSingleFavourite = ({ item, index }) => {
    // console.log('Product Name is:', item?.ProductName);
    console.log('Product Name is:', item?.Prod_Name);
    const countTypes = this.props.cartItems.filter(
      // product => product.ProductName === item.Prod_Name,
      product => product.Prod_Name === item.Prod_Name,
    );

    let qtycount = 0;
    countTypes.forEach(element => {
      qtycount = qtycount + element.Qty;
    });

    return (
      <View>
        <Card
          key={index}
          style={{
            width: 200,
            marginLeft: 10,
            marginBottom: 10,
            backgroundColor: 'white',
            borderRadius: 20,
            overflow: 'hidden',
            elevation: 6,
          }}
        >
          <TouchableOpacity
            disabled={item.isSoldOut ? true : false}
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
                    : {
                        uri: item.ImagePath,
                        priority: FastImage.priority.high,
                      }
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
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
            fontSize: 18,
            marginLeft: 15,
          }}
          numberOfLines={2}
        >
          {item.Prod_Name}
        </Text>
        <Text
          style={{
            width: 200,
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
            fontSize: 16,
            marginLeft: 10,
            textTransform: 'lowercase',
            color: '#5C5C5C',
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
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 14,
                marginTop: -2,
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
    const countTypes = this.props.cartItems.filter(
      product => product.ProductName === item.Prod_Name,
    );
    let qtycount = 0;
    countTypes.forEach(element => {
      qtycount = qtycount + element.Qty;
    });

    return (
      <View>
        <Card
          key={index}
          style={{
            width: 200,
            marginLeft: 10,
            marginBottom: 10,
            backgroundColor: 'white',
            borderRadius: 20,
            overflow: 'hidden',
            elevation: 6,
          }}
        >
          <TouchableOpacity
            disabled={item.isSoldOut === '1' ? true : false}
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
                    : {
                        uri: item.ImagePath,
                        priority: FastImage.priority.high,
                      }
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
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
            fontSize: 18,
            marginLeft: 15,
          }}
          numberOfLines={1}
        >
          {item.Prod_Name}
        </Text>
        <Text
          style={{
            width: 200,
            fontFamily:
              Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
            fontSize: 16,
            marginLeft: 10,
            textTransform: 'lowercase',
            color: '#5C5C5C',
          }}
          numberOfLines={1}
        >
          @{item.Prod_Name}
        </Text>
      </View>
    );
  };

  renderOffterItem(offers) {
    return offers.map((item, index) => {
      return (
        <View key={index} style={{ marginBottom: 10 }}>
          <ScaledImage uri={item.imagepath} width={width} />
          {item.title === '' ? null : (
            <>
              <Text
                style={{
                  fontSize: 18,
                  marginLeft: 20,
                  marginTop: 10,
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
                  backgroundColor: '#5C5C5C',
                }}
              />
            </>
          )}
          {item.description === '' ? null : (
            <>
              <Text
                style={{
                  fontSize: 16,
                  marginLeft: 20,
                  marginBottom: 10,
                  marginRight: 20,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  color: '#5C5C5C',
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
                  backgroundColor: '#5C5C5C',
                }}
              />
            </>
          )}
        </View>
      );
    });
  }

  render() {
    const width = 120;
    const height = 45;
    const borderRadius = 25;

    const translateX = this.state.glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, width],
    });
    return (
      <Animated.View
        style={[
          { flex: 1, backgroundColor: '#F0F0F0' },
          { opacity: this.state.fadeAnim },
        ]}
      >
        <ScrollView
          scrollEnabled={this.state.isEnableScroll}
          refreshControl={
            <RefreshControl
              refreshing={this.state.isLoading}
              colors={['red', 'green', 'blue']}
              title={'Refreshing'}
              titleColor={'black'}
            />
          }
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                // marginTop: 25,
              },
              { transform: [{ translateY: this.state.slideDown }] },
            ]}
          >
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
                <TouchableOpacity onPress={() => this.LocaSheet.open()}>
                  <Icons name="options-outline" size={25} />
                </TouchableOpacity>
              </View>

              <Text
                style={{
                  marginRight: 57,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 16,
                  paddingLeft: 5,
                  paddingRight: 5,
                  textAlign: 'left',
                }}
              >
                {this.state.LocationName}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 25,
              },
              { transform: [{ translateY: this.state.slideDown }] },
            ]}
          >
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
                  <FontAwesome name="align-left" size={20} />
                </TouchableOpacity>
              </View>
              {}
            </View>

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
                }}
              >
                {this.state.userlog === null
                  ? 'You are not signIn'
                  : this.state.address}
              </Text>
            </View>
          </Animated.View>

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
                }}
              >
                Hi {this.GeneratGreetings()} ,
              </Text>
              {this.state.userlog === null ? null : (
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 26,
                    marginBottom: 5,
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
                  color: '#5C5C5C',
                }}
              >
                Quick, grab your food before they run out!
              </Text>
            </View>
          </Animated.View>

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
                backgroundColor: '#5C5C5C',
              }}
            />

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
                  }}
                >
                  Looking for your favourite meal
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    color: '#5C5C5C',
                  }}
                >
                  The way to entice people into cooking is to cook delicious
                  things.
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
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 10,
                marginTop: 20,
                backgroundColor: '#5C5C5C',
              }}
            />

            <FlatList
              style={{ margin: 10 }}
              data={this.state.favouritlist}
              horizontal={true}
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
                backgroundColor: '#5C5C5C',
              }}
            />

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
                  }}
                >
                  Suggest Collections
                </Text>
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    color: '#5C5C5C',
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
                marginLeft: 25,
                marginRight: 25,
                marginBottom: 10,
                marginTop: 25,
                backgroundColor: '#5C5C5C',
              }}
            />

            <FlatList
              style={{ margin: 10 }}
              data={this.state.suggestList}
              horizontal={true}
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
                backgroundColor: '#5C5C5C',
              }}
            />

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
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 24,
                  textAlign: 'center',
                }}
              >
                Today Offers
              </Text>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  color: '#5C5C5C',
                  marginLeft: 10,
                  marginRight: 10,
                  textAlign: 'center',
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
                backgroundColor: '#5C5C5C',
              }}
            />
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
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 24,
                  textAlign: 'center',
                }}
              >
                Picked Up For You
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 10 }}
                contentContainerStyle={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexGrow: 1,
                }}
              >
                <Card
                  style={{
                    marginRight: 12,
                    borderRadius: 14,
                    width: 90,
                    height: 100,
                    justifyContent: 'center',
                    elevation: 3,
                    backgroundColor: '#e0e5ec9d',
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: '#ccc',
                  }}
                  mode="contained"
                >
                  <View style={{ alignItems: 'center', padding: 5 }}>
                    <Image
                      source={require('../assets/popular.png')}
                      style={{
                        width: 50,
                        height: 50,
                        resizeMode: 'contain',
                      }}
                    />

                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: '500',
                        textAlign: 'center',
                      }}
                    >
                      Popular
                    </Text>
                  </View>
                </Card>
                <Card
                  style={{
                    marginRight: 12,
                    borderRadius: 14,
                    width: 90,
                    height: 100,
                    justifyContent: 'center',
                    elevation: 3,
                    backgroundColor: '#e0e5ec9d',
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: '#ccc',
                  }}
                  mode="contained"
                >
                  <View style={{ alignItems: 'center', padding: 5 }}>
                    <Image
                      source={require('../assets/new.png')}
                      style={{
                        width: 50,
                        height: 50,
                        resizeMode: 'contain',
                      }}
                    />

                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: '500',
                        textAlign: 'center',
                      }}
                    >
                      Newly Added
                    </Text>
                  </View>
                </Card>
                <Card
                  style={{
                    marginRight: 12,
                    borderRadius: 14,
                    width: 90,
                    height: 100,
                    justifyContent: 'center',
                    elevation: 3,
                    backgroundColor: '#e0e5ec9d',
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: '#ccc',
                  }}
                  mode="contained"
                >
                  <View style={{ alignItems: 'center', padding: 5 }}>
                    <Image
                      source={require('../assets/trending.png')}
                      style={{
                        width: 50,
                        height: 50,
                        resizeMode: 'contain',
                      }}
                    />

                    <Text
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: '500',
                        textAlign: 'center',
                      }}
                    >
                      Trending
                    </Text>
                  </View>
                </Card>
              </ScrollView>
            </View>

            <View
              style={{
                height: 0.9,
                marginLeft: 25,
                marginRight: 25,
                marginTop: 10,
                backgroundColor: '#5C5C5C',
                marginBottom: 15,
              }}
            />

            <View style={{ marginBottom: 0 }}>
              {this.renderOffterItem(this.state.offersList)}
            </View>
          </Animated.View>
        </ScrollView>

        <RBSheet
          ref={ref => {
            this.LocaSheet = ref;
          }}
          animationType={'fade'}
          height={isTablet() ? 995 : 995}
          openDuration={800}
          closeDuration={800}
          closeOnDragDown={false}
          closeOnPressMask={true}
          closeOnPressBack={false}
          customStyles={{
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
            <ImageBackground
              source={require('../assets/image-placeholder.png')}
              style={{ width: width, height }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  marginTop: 50,
                  marginBottom: 10,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 22,
                  color: 'black',
                  alignSelf: 'center',
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
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 20,
                  color: 'black',
                  alignSelf: 'center',
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
                icon={<Icon name="check-circle" size={25} color="#2c9dd1" />}
              />
            </ImageBackground>
          </View>
        </RBSheet>

        <RBSheet
          ref={ref => {
            this.SRBSheet = ref;
          }}
          animationType={'fade'}
          height={isTablet() ? 490 : 510}
          openDuration={700}
          closeDuration={700}
          closeOnDragDown={false}
          closeOnPressMask={true}
          customStyles={{
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
            <Text
              allowFontScaling={false}
              style={{
                margin: 10,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 18,
                color: 'black',
                alignSelf: 'center',
              }}
            >
              About us
            </Text>
            <View
              style={{
                height: 1,
                marginRight: 30,
                marginLeft: 30,
                backgroundColor: '#dedede',
              }}
            />
            <ScrollView>
              <Text
                allowFontScaling={false}
                style={{
                  margin: 10,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 16,
                  color: 'black',
                  alignSelf: 'center',
                  marginLeft: 29,
                  marginRight: 20,
                  marginTop: 20,
                  textAlign: 'center',
                }}
              >
                Cafe 007 is a venture by Sarathchandra Textile, located amidst
                the stunning landscape of Sabaragamuwa province, The restaurant
                started its service in 2018 focusing on Ceylonese fusion
                inspired fast food serving some of the best burgers, sandwiches,
                wraps, drinks and desserts out of Colombo.
              </Text>
              {}

              <Text
                allowFontScaling={false}
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 18,
                  color: 'black',
                  alignSelf: 'center',
                }}
              >
                {' '}
                info@cafe007.lk
              </Text>
              <View
                style={{
                  height: 1,
                  marginRight: 30,
                  marginLeft: 30,
                  backgroundColor: '#dedede',
                  marginTop: 10,
                  marginBottom: 5,
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
                <View style={{ margin: 10, alignItems: 'flex-start' }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_SemiBold'
                          : 'AsapSemiBold',
                      fontSize: 16,
                      color: 'black',
                      textAlign: 'left',
                    }}
                  >
                    {this.state.LocationI}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      color: 'black',
                      textAlign: 'left',
                    }}
                  >
                    {this.state.LocationIAddress}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${this.state.LocationIPhone}`)
                    }
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 16,
                        color: 'black',
                        textAlign: 'left',
                      }}
                    >
                      Tel: {this.state.LocationIPhone}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${this.state.LocationIMobile}`)
                    }
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 16,
                        color: 'black',
                        textAlign: 'left',
                      }}
                    >
                      Tel: {this.state.LocationIMobile}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ margin: 10, alignItems: 'flex-end' }}>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_SemiBold'
                          : 'AsapSemiBold',
                      fontSize: 16,
                      color: 'black',
                      textAlign: 'right',
                    }}
                  >
                    {this.state.LocationII}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily:
                        Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                      fontSize: 16,
                      color: 'black',
                      textAlign: 'right',
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
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 16,
                        color: 'black',
                        textAlign: 'right',
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
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 16,
                        color: 'black',
                        textAlign: 'right',
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
                  backgroundColor: '#dedede',
                  marginTop: 5,
                }}
              />

              <Text
                style={{
                  margin: 10,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: 'black',
                  alignSelf: 'center',
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
                <TouchableOpacity
                  style={{ marginLeft: 10, marginRight: 10 }}
                  onPress={() => this.onFacebookPress()}
                >
                  <IonicIcon name="logo-facebook" size={25} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginRight: 10 }}
                  onPress={() => this.onInstagramPress()}
                >
                  <IonicIcon name="logo-instagram" size={25} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginRight: 10 }}
                  onPress={() =>
                    Linking.openURL('https://cafe007.lk/embilipitiya-cafe007/')
                  }
                >
                  <IonicIcon name="logo-google" size={25} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginRight: 10 }}
                  onPress={() => this.onYoutubePress()}
                >
                  <IonicIcon name="logo-youtube" size={25} />
                </TouchableOpacity>
              </View>

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
                powered by
              </Text>
              <TouchableOpacity
                style={{ marginBottom: 20 }}
                onPress={() => Linking.openURL('http://www.onimtait.com')}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 18,
                    color: 'black',
                    alignSelf: 'center',
                  }}
                >
                  http://www.onimtait.com
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </RBSheet>

        <RBSheet
          ref={ref => {
            this.RRBSheet = ref;
          }}
          animationType={'fade'}
          height={380}
          openDuration={700}
          closeDuration={700}
          closeOnDragDown={false}
          closeOnPressMask={false}
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
              Rate and tip
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
              Let us know about your meal and delivery. You can also add a tip
              for rider.
            </Text>
            <View style={{ marginTop: 25 }}>
              <TouchableOpacity onPress={() => this.onContinuePress()}>
                <View
                  style={{
                    width: 300,
                    height: 60,
                    backgroundColor: 'black',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                    }}
                  >
                    Continue
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 25 }}>
              <TouchableOpacity onPress={() => this.RRBSheet.close()}>
                <View
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text
                    style={{
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      fontSize: 18,
                      color: 'black',
                    }}
                  >
                    Skip
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </RBSheet>
      </Animated.View>
    );
  }

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
      .then(res => {
        return res.json();
      })
      .then(json => {
        const favouritlist = [];

        for (let i = 0; i < json.CommonResult.Table.length; i++) {
          favouritlist.push({
            Prod_Code: json.CommonResult.Table[i].Prod_Code,
            Prod_Name: json.CommonResult.Table[i].Prod_Name,
            ImagePath: json.CommonResult.Table[i].ImagePath,
            More_Descrip: json.CommonResult.Table[i].More_Descrip,
            Selling_Price: this.numberWithCommas(
              json.CommonResult.Table[i].Selling_Price,
            ),
            NconvertPrice: json.CommonResult.Table[i].Selling_Price,
            BestSeller: json.CommonResult.Table[i].isBestSeller,
            Offer: json.CommonResult.Table[i].isOffer,
            isSoldOut: json.CommonResult.Table[i].isSoldOut,
          });
        }

        this.setState({
          favouritlist: favouritlist,
          isLoading: false,
        });
      })
      .catch(er => {
        console.log(er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.LoadProducts(this.state.Location),
            },
          ],
          { cancelable: false },
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
      .then(res => {
        return res.json();
      })
      .then(json => {
        const suggestList = [];

        for (let i = 0; i < json.CommonResult.Table.length; i++) {
          suggestList.push({
            Prod_Code: json.CommonResult.Table[i].Prod_Code,
            Prod_Name: json.CommonResult.Table[i].Prod_Name,
            ImagePath: json.CommonResult.Table[i].ImagePath,
            More_Descrip: json.CommonResult.Table[i].More_Descrip,
            Selling_Price: this.numberWithCommas(
              json.CommonResult.Table[i].Selling_Price,
            ),
            NconvertPrice: json.CommonResult.Table[i].Selling_Price,
            BestSeller: json.CommonResult.Table[i].isBestSeller,
            Offer: json.CommonResult.Table[i].isOffer,
            isSoldOut: json.CommonResult.Table[i].isSoldOut,
          });
        }

        this.setState({
          suggestList: suggestList,
        });
      })
      .catch(er => {
        console.log(er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.LoadProducts(this.state.Location),
            },
          ],
          { cancelable: false },
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
      .then(res => {
        return res.json();
      })
      .then(json => {
        const offersList = [];

        for (let i = 0; i < json.CommonResult.Table.length; i++) {
          offersList.push({
            title: json.CommonResult.Table[i].title,
            description: json.CommonResult.Table[i].description,
            imagepath: json.CommonResult.Table[i].imagepath,
            promocode: json.CommonResult.Table[i].promocode,
            Height: parseInt(json.CommonResult.Table[i].Height),
            Width: parseInt(json.CommonResult.Table[i].Width),
          });
        }

        this.setState({
          offersList: offersList,
        });
      })
      .catch(er => {
        console.log(er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.LoadProducts(this.state.Location),
            },
          ],
          { cancelable: false },
        );
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
      .then(res => {
        return res.json();
      })
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
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.LoadProducts(this.state.Location),
            },
          ],
          { cancelable: false },
        );
      });
  }

  // GetLocationDetails() {
  //   fetch(APIURL, {
  //     method: 'POST',
  //     cache: 'no-cache',
  //     headers: {
  //       'content-type': 'application/json',
  //       'cache-control': 'no-cache',
  //     },
  //     body: JSON.stringify({
  //       HasReturnData: 'T',
  //       Parameters: [
  //         {
  //           Para_Data: '116',
  //           Para_Direction: 'Input',
  //           Para_Lenth: 10,
  //           Para_Name: '@Iid',
  //           Para_Type: 'int',
  //         },
  //       ],
  //       SpName: 'sp_Android_Common_API',
  //       con: '1',
  //     }),
  //   })
  //     .then(res => {
  //       return res.json();
  //     })
  //     .then(json => {
  //       const LocaData = [];

  //       for (let i = 0; i < json.CommonResult.Table.length; i++) {
  //         LocaData.push({
  //           Val: json.CommonResult.Table[i].loca,
  //           label: json.CommonResult.Table[i].description,
  //         });
  //       }

  //       this.setState({
  //         LocaData: LocaData,
  //         isLoading: false,
  //       });
  //     })
  //     .catch(er => {
  //       console.log('loca', er);
  //       Alert.alert(
  //         'Warning',
  //         "The operation couldn't be completed.",
  //         [
  //           {
  //             text: 'Try Again',
  //             onPress: () => this.GetLocationDetails(),
  //           },
  //         ],
  //         {cancelable: false},
  //       );
  //     })
  //     .finally(() => {
  //       setTimeout(async () => {
  //         if ((await AsyncStorage.getItem('LOCA')) === null) {
  //           this.LocaSheet.open();
  //         } else {
  //           this.retreiveLocation();
  //         }
  //       }, 500);
  //     });
  // }

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
      .then(res => res.json())
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
          if (!storedLoca) {
            this.LocaSheet.open();
          } else {
            this.retreiveLocation();
          }
        }
      })
      .catch(er => {
        console.log('loca', er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.GetLocationDetails(),
            },
          ],
          { cancelable: false },
        );
      });
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addItemToCart: product =>
      dispatch({ type: 'ADD_TO_CART', payload: product }),
    resetCart: () => dispatch({ type: 'RESET_CART' }),
  };
};

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DashboardScreen);
