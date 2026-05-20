import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { NumericFormat } from 'react-number-format';
import { APIURL } from '../Data/CloneData';
import { connect } from 'react-redux';
import CheckBox from '@react-native-community/checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RadioGroup from 'react-native-radio-buttons-group';
import FastImage from 'react-native-fast-image';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { withTheme } from '../Context/ThemeContext';
import ThemeToggle from '../Components/ThemeToggle';
import { showNetworkError } from '../Utils/networkError';
import LottieView from 'lottie-react-native';

const HEADER_MAX_HEIGHT = 240;
const HEADER_MIN_HEIGHT = Platform.OS === 'android' ? 64 : 74;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

class ItemScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      Shop_Status: '',
      Location: this.props.route.params.Location,
      ProductCode: this.props.route.params.PCode,
      ProductName: this.props.route.params.PName,
      ProductDescription: this.props.route.params.PDescription,
      ProductPrice: this.props.route.params.PPrice,
      ProductIMG: this.props.route.params.IMG,
      isDiscounted: this.props.route.params.isDiscounted,
      isPopular: this.props.route.params.isPopular,
      scrollY: new Animated.Value(0),
      scrollPosition: 0,
      itemQty: 1,
      Amount: this.props.route.params.PPrice,
      checked: false,
      list: [],
      Additionallist: [],
      RequiredItemList: [],
      isLoading: false,
      userlog: null,
      name: '',
      OrderID: null,
      SelectedRequiredItem: {},
      Max_Addons: 0,
      Max_Additional_Addons: 0,
      addonsSelectedID: 0,
      isRefeshedID: 0,
      loading: true,
      LocationDB: '',
      overlayOpacity: new Animated.Value(1),
      isLoadingVisible: false,
    };
    this.touchableInactive = false;
    this.isScrolled = false;
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  componentDidMount() {
    this.onCheckUserLog();
    this._retrieveData();

    if (this.state.Location === 'Cart') {
      this.setState({ isLoading: true });
      this.LoadFoodAddons(this.state.ProductCode);
    } else if (this.state.Location === 'Banner') {
      this.setState({ isLoading: true });
      this.LoadFoodDetails(this.state.ProductCode);
    } else {
      this.LoadFoodAddons(this.state.ProductCode);
    }
  }

  onPlusPress() {
    if (this.state.itemQty < 999) {
      this.setState({ itemQty: this.state.itemQty + 1 });
    }
  }

  onMinPress() {
    if (this.state.itemQty > 1) {
      this.setState({ itemQty: this.state.itemQty - 1 });
    }
  }

  hideLoadingWithDelay = () => {
    Animated.timing(this.state.overlayOpacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      this.setState({ isLoading: false, isLoadingVisible: false });
      this.state.overlayOpacity.setValue(1); // reset for next time
    });
  };

  LoadStoreStatus() {
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
            Para_Data: '112',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: this.state.LocationDB,
            Para_Direction: 'Input',
            Para_Lenth: 100,
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
        this.setState({ Shop_Status: json.CommonResult.Table[0].Shop_Status });

        if (json.CommonResult.Table[0].Shop_Status == 'T') {
          Alert.alert(
            'Warning',
            'Currently Unavailable',
            [
              { text: 'Try Again', onPress: () => this.hideLoadingWithDelay() },
              { text: 'Close', onPress: () => this.hideLoadingWithDelay() },
            ],
            { cancelable: false },
          );
        } else {
          if (
            this.state.Additionallist.length !== 0 ||
            this.state.list.length !== 0
          ) {
            if (
              !this.isScrolled &&
              this.state.Location !== 'Cart' &&
              this.state.scrollPosition <= 430
            ) {
              this.isScrolled = true;
              this.scrollView.scrollTo({ y: 530, animated: true });
            } else {
              this.onAddtoCart();
            }
          } else {
            this.onAddtoCart();
          }
        }
      });
  }

  LoadFoodDetails(ProductCode) {
    AsyncStorage.setItem('LOCA', '');
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
            Para_Data: '111',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: ProductCode,
            Para_Direction: 'Input',
            Para_Lenth: 100,
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
        console.log(json.CommonResult.Table[0]);
        this.setState({
          ProductName: json.CommonResult.Table[0].Prod_Name,
          ProductDescription: json.CommonResult.Table[0].More_Descrip,
          ProductPrice: json.CommonResult.Table[0].Purchase_Price,
          ProductIMG: json.CommonResult.Table[0].ImagePath,
          Amount: json.CommonResult.Table[0].Purchase_Price,
        });
      })
      .catch(er => {
        console.log(er);
        showNetworkError(
          er,
          () => this.LoadFoodDetails(this.state.ProductCode),
          null,
        );
      })
      .finally(() => {
        this.LoadFoodAddons(ProductCode);
      });
  }

  LoadFoodAddons(ProductCode) {
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
            Para_Data: '102',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: ProductCode,
            Para_Direction: 'Input',
            Para_Lenth: 100,
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
        if (this.state.Location === 'Cart') {
          const list = [];
          const additionallist = [];
          const RequiredItemList = [];
          const SelectRItem = this.props.route.params.RequiredItem;
          const addlist = this.props.route.params.Addons;
          const extralist = this.props.route.params.Extra;
          var PMax_Addons = 0;
          var PMax_AdditionalAddons = 0;

          if (json.CommonResult.Table.length !== 0) {
            PMax_Addons = json.CommonResult.Table[0].product_max_addons;
            json.CommonResult.Table.forEach((element, index) => {
              list.push({
                id: index,
                addonsId: element.addonsId,
                name: element.name,
                price: parseInt(element.price),
                checked: false,
                color: 'black',
              });
            });
            if (PMax_Addons === addlist.length) {
              const unselectedList = list.filter(i => !i.checked);
              for (let i = 0; i < unselectedList.length; i++) {
                list[i].color = '#bababa';
              }
              for (let index = 0; index < addlist.length; index++) {
                const idx = list.findIndex(x => x.name === addlist[index].name);
                list[idx].checked = true;
                list[idx].color = 'black';
              }
            } else {
              for (let i = 0; i < addlist.length; i++) {
                const idx = list.findIndex(x => x.name === addlist[i].name);
                list[idx].checked = true;
                list[idx].color = 'black';
              }
            }
          }

          if (json.CommonResult.Table1.length !== 0) {
            PMax_AdditionalAddons =
              json.CommonResult.Table1[0].product_max_extras;
            json.CommonResult.Table1.forEach((element, index) => {
              additionallist.push({
                id: index,
                extrasId: element.extrasId,
                name: element.name,
                price: parseInt(element.price),
                checked: false,
                color: 'black',
              });
            });
            if (PMax_AdditionalAddons === extralist.length) {
              const unselectedAdditional = additionallist.filter(
                i => !i.checked,
              );
              for (let y = 0; y < unselectedAdditional.length; y++) {
                additionallist[y].color = '#bababa';
              }
              for (let a = 0; a < extralist.length; a++) {
                const idx = additionallist.findIndex(
                  x => x.name === extralist[a].name,
                );
                additionallist[idx].checked = true;
                additionallist[idx].color = 'black';
              }
            } else {
              for (let z = 0; z < extralist.length; z++) {
                const idx = additionallist.findIndex(
                  x => x.name == extralist[z].name,
                );
                additionallist[idx].checked = true;
                additionallist[idx].color = 'black';
              }
            }
          }

          this.setState({
            SelectedRequiredItem: SelectRItem,
            list,
            Additionallist: additionallist,
            RequiredItemList,
            itemQty: this.props.route.params.PQty,
            Amount: this.props.route.params.Amount,
            Max_Addons: PMax_Addons,
            Max_Additional_Addons: PMax_AdditionalAddons,
          });
          this.hideLoadingWithDelay();
          this.scrollView.scrollToEnd({ animated: true });
        } else {
          const list = [];
          const Additionallist = [];
          const RequiredItemList = [];
          var PMax_Addons = 0;
          var PMax_AdditionalAddons = 0;

          if (json.CommonResult.Table.length !== 0) {
            PMax_Addons = json.CommonResult.Table[0].product_max_addons;
            json.CommonResult.Table.forEach((element, index) => {
              list.push({
                id: index,
                addonsId: element.addonsId,
                name: element.name,
                price: parseInt(element.price),
                checked: false,
                color: 'black',
              });
            });
          }
          if (json.CommonResult.Table1.length !== 0) {
            PMax_AdditionalAddons =
              json.CommonResult.Table1[0].product_max_extras;
            json.CommonResult.Table1.forEach((element, index) => {
              Additionallist.push({
                id: index,
                extrasId: element.extrasId,
                name: element.name,
                price: parseInt(element.price),
                checked: false,
                color: 'black',
              });
            });
          }

          this.setState({
            list,
            Additionallist,
            RequiredItemList,
            Max_Addons: PMax_Addons,
            Max_Additional_Addons: PMax_AdditionalAddons,
          });
          this.hideLoadingWithDelay();
        }
      })
      .catch(error => {
        console.log('LoadFoodAddons', error);
        showNetworkError(
          error,
          () => this.LoadFoodAddons(this.state.ProductCode),
          null,
        );
      });
  }

  // ── Addon / Extra render helpers ────────────────────────────────────────────
  renderAdditionalAddons() {
    const { theme } = this.props;
    return this.state.Additionallist.map((item, key) => (
      <TouchableOpacity
        key={key}
        onPress={() => this.checkThisAdditionalBox(item.id)}
      >
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface,
            margin: 5,
            borderRadius: 10,
            borderColor: theme.cardBorder,
            borderWidth: 1,
            padding: 15,
          }}
        >
          <CheckBox
            disabled={true}
            style={{ marginRight: 18, height: 25, width: 25 }}
            onCheckColor={theme.accent}
            onTintColor={theme.accent}
            tintColors={{
              true: theme.accent,
              false: item.color === 'black' ? theme.text : '#bababa',
            }}
            onAnimationType={'fill'}
            value={item.checked}
          />
          <Text
            style={{
              flex: 1.2,
              fontSize: 18,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              color: item.color === 'black' ? theme.text : theme.textMuted,
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
                  flex: 0.8,
                  textAlign: 'right',
                  marginRight: 10,
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  color: item.color === 'black' ? theme.text : theme.textMuted,
                }}
              >
                + {formattedValue}
              </Text>
            )}
          />
        </View>
      </TouchableOpacity>
    ));
  }

  renderAddons() {
    const { theme } = this.props;
    return this.state.list.map((item, key) => (
      <TouchableOpacity key={key} onPress={() => this.checkThisBox(item.id)}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.surface,
            margin: 5,
            borderRadius: 10,
            borderColor: theme.cardBorder,
            borderWidth: 1,
            padding: 15,
          }}
        >
          <CheckBox
            disabled={true}
            style={{ marginRight: 18, height: 25, width: 25 }}
            onCheckColor={theme.accent}
            onTintColor={theme.accent}
            tintColors={{
              true: theme.accent,
              false: item.color === 'black' ? theme.text : '#bababa',
            }}
            onAnimationType={'fill'}
            value={item.checked}
          />
          <Text
            style={{
              flex: 1.2,
              fontSize: 18,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              color: item.color === 'black' ? theme.text : theme.textMuted,
            }}
          >
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  }

  // ── Selection logic ───────────────────────────────────────
  checkThisAdditionalBox(itemID) {
    const additionallist = this.state.Additionallist;
    const index = additionallist.findIndex(x => x.id === itemID);
    const checked = this.state.Additionallist.filter(t => t.checked);
    const unchecked = this.state.Additionallist.filter(t => !t.checked);

    if (this.state.Max_Additional_Addons === 0) {
      additionallist[index].checked = !additionallist[index].checked;
      if (additionallist[itemID].checked) {
        this.setState({
          Amount: this.state.Amount + additionallist[itemID].price,
        });
      } else {
        this.setState({
          Amount: this.state.Amount - additionallist[itemID].price,
        });
      }
    } else {
      if (checked.length === this.state.Max_Additional_Addons) {
        if (additionallist[itemID].checked) {
          additionallist[index].checked = !additionallist[index].checked;
          this.setState({
            Amount: this.state.Amount - additionallist[itemID].price,
          });
          for (let i = 0; i < unchecked.length; i++) {
            unchecked[i].color = 'black';
          }
        }
      } else {
        additionallist[index].checked = !additionallist[index].checked;
        const NewChecked = additionallist.filter(t => t.checked);
        const NewUnChecked = additionallist.filter(t => !t.checked);
        if (NewChecked.length === this.state.Max_Additional_Addons) {
          for (let i = 0; i < NewUnChecked.length; i++) {
            NewUnChecked[i].color = '#bababa';
          }
        }
        if (additionallist[itemID].checked) {
          this.setState({
            Amount: this.state.Amount + additionallist[itemID].price,
          });
        } else {
          this.setState({
            Amount: this.state.Amount - additionallist[itemID].price,
          });
        }
      }
    }
    this.setState({ Additionallist: additionallist });
  }

  checkThisBox(itemID) {
    const list = this.state.list;
    const index = list.findIndex(x => x.id === itemID);
    const checked = this.state.list.filter(t => t.checked);
    const unchecked = this.state.list.filter(t => !t.checked);

    if (this.state.Max_Addons === 0) {
      list[index].checked = !list[index].checked;
      if (list[itemID].checked) {
        this.setState({ addonsSelectedID: this.state.addonsSelectedID + 1 });
      } else {
        this.setState({ addonsSelectedID: this.state.addonsSelectedID - 1 });
      }
    } else {
      if (checked.length === this.state.Max_Addons) {
        if (list[itemID].checked) {
          list[index].checked = !list[index].checked;
          this.setState({ addonsSelectedID: this.state.addonsSelectedID - 1 });
          for (let i = 0; i < unchecked.length; i++) {
            unchecked[i].color = 'black';
          }
        }
      } else {
        list[index].checked = !list[index].checked;
        const NewChecked = list.filter(t => t.checked);
        const NewUnChecked = list.filter(t => !t.checked);
        if (NewChecked.length === this.state.Max_Addons) {
          for (let i = 0; i < NewUnChecked.length; i++) {
            NewUnChecked[i].color = '#bababa';
          }
        }
        if (list[itemID].checked) {
          this.setState({ addonsSelectedID: this.state.addonsSelectedID + 1 });
        } else {
          this.setState({ addonsSelectedID: this.state.addonsSelectedID - 1 });
        }
      }
    }
    this.setState(list);
  }

  checkThisRadio(item) {
    item.forEach(element => {
      if (element.selected) {
        this.setState({ SelectedRequiredItem: element.value });
      }
    });
  }

  onCheckUserLog = async () => {
    let number = await AsyncStorage.getItem('phonenumber');
    let OrderID = await AsyncStorage.getItem('OrderID');
    this.setState({ userlog: number, OrderID });
  };

  _retrieveData = async () => {
    const value = await AsyncStorage.getItem('LOCA');
    this.setState({ LocationDB: value });
  };

  onAddtoCart = () => {
    if (!this.touchableInactive) {
      this.touchableInactive = true;
      let CartItemID = this.generateID(5);

      var itemcode = this.state.list.map(t => t.addonsId);
      var item = this.state.list.map(t => t.name);
      var itemprice = this.state.list.map(t => t.price);
      var checked = this.state.list.map(t => t.checked);
      let selected = [];
      for (let i = 0; i < checked.length; i++) {
        if (checked[i]) {
          selected.push({
            OrderID: this.state.OrderID,
            CartItemID,
            ProductCode: this.state.ProductCode,
            AddonsCode: itemcode[i],
            name: item[i],
            price: itemprice[i],
          });
        }
      }

      var itemcode2 = this.state.Additionallist.map(t => t.extrasId);
      var item2 = this.state.Additionallist.map(t => t.name);
      var itemprice2 = this.state.Additionallist.map(t => t.price);
      var additional_checked = this.state.Additionallist.map(t => t.checked);
      let Extralist = [];
      for (let y = 0; y < additional_checked.length; y++) {
        if (additional_checked[y]) {
          Extralist.push({
            OrderID: this.state.OrderID,
            CartItemID,
            ProductCode: this.state.ProductCode,
            ExtraCode: itemcode2[y],
            name: item2[y],
            price: itemprice2[y],
          });
        }
      }

      if (this.state.Location === 'Cart') {
        let CartItemID = this.props.route.params.CartItemID;
        let Product = {
          OrderID: this.state.OrderID,
          CartItemID,
          ProductCode: this.state.ProductCode,
          ProductName: this.state.ProductName,
          ProductDescription: this.state.ProductDescription,
          ProductIMG: this.state.ProductIMG,
          Price: this.state.ProductPrice,
          NetTotal: this.state.Amount * this.state.itemQty,
          Amount: this.state.Amount,
          Qty: this.state.itemQty,
          Addons: selected,
          Extra: Extralist,
          index: this.props.route.params.index,
          LocationDB: this.state.LocationDB,
          isDiscounted: this.state.isDiscounted,
          isPopular: this.state.isPopular,
        };
        if (this.state.userlog !== null) {
          AsyncStorage.setItem(CartItemID, JSON.stringify(Product));
        }
        this.props.updateItemToCart(Product);
        this.props.navigation.goBack();
      } else {
        let Product = {
          OrderID: this.state.OrderID,
          CartItemID,
          ProductCode: this.state.ProductCode,
          ProductName: this.state.ProductName,
          ProductDescription: this.state.ProductDescription,
          ProductIMG: this.state.ProductIMG,
          Price: this.state.ProductPrice,
          NetTotal: this.state.Amount * this.state.itemQty,
          Amount: this.state.Amount,
          Qty: this.state.itemQty,
          Addons: selected,
          Extra: Extralist,
          LocationDB: this.state.LocationDB,
          isDiscounted: this.state.isDiscounted,
          isPopular: this.state.isPopular,
        };
        if (this.state.userlog !== null) {
          if (this.props.cartItems.length === 0) {
            this.onClearAsync();
          }
          AsyncStorage.setItem(CartItemID, JSON.stringify(Product));
        }
        this.props.addItemToCart(Product);
        this.props.navigation.goBack();
      }
    }
  };

  onClearAsync = async () => {
    try {
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
      await AsyncStorage.multiRemove(keys);
    } catch (error) {}
  };

  generateID = length => {
    var result = '';
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  onRemoveFromCart = async () => {
    if (!this.touchableInactive) {
      this.touchableInactive = true;
      await AsyncStorage.removeItem(this.props.route.params.CartItemID);
      this.props.removeItemFromCart({ index: this.props.route.params.index });
      this.props.navigation.goBack();
    }
  };

  onEnableLoader = () => {
    if (this.state.Shop_Status == 'T') {
    } else {
      if (
        (this.state.Additionallist.length === 0 &&
          this.state.list.length === 0) ||
        this.state.Location === 'Cart'
      ) {
        this.setState({ isLoading: true });
      } else {
        if (this.isScrolled) {
          this.setState({ isLoading: true });
        }
      }
    }
  };

  render() {
    const { theme, isDark } = this.props;

    // ── Scroll animations ─────────────────────────────────────────
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
      outputRange: [0, 0, Platform.OS === 'android' ? -8 : 5],
      extrapolate: 'clamp',
    });
    const titleOpacity = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* ── Scrollable body ── */}
        <Animated.ScrollView
          ref={ref => {
            this.scrollView = ref;
          }}
          contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT - 32 }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
            {
              useNativeDriver: true,
              listener: e =>
                this.setState({
                  scrollPosition: e.nativeEvent.contentOffset.y,
                }),
            },
          )}
        >
          <View
            style={{
              marginTop: 20,
              marginLeft: 20,
              marginRight: 20,
              paddingTop: 20,
            }}
          >
            {/* ── Product name + Popular badge row ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 30,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    color: theme.text,
                  }}
                >
                  {this.state.ProductName}
                </Text>
                <Text
                  style={{
                    textTransform: 'lowercase',
                    fontSize: 16,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    color: theme.textSub,
                  }}
                >
                  @{this.state.ProductName}
                </Text>
              </View>

              {this.state.isPopular && (
                <View
                  style={{
                    marginRight: 20,
                    alignItems: 'center',
                    marginTop: 20,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: '#FF6900',
                      borderRadius: 10,
                      paddingVertical: 6,
                      paddingHorizontal: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesome6 name="fire" size={22} color="white" solid />
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 13,
                        marginTop: 5,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular_Bold'
                            : 'AsapBold',
                      }}
                    >
                      Popular
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ── Description ── */}
            <View style={{ margin: 20 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  color: theme.text,
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  margin: 10,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  color: theme.textSub,
                }}
              >
                {this.state.ProductDescription === ''
                  ? 'No Description Available'
                  : this.state.ProductDescription}
              </Text>
            </View>
          </View>

          {/* ── Required items (radio) ── */}
          {this.state.RequiredItemList.length !== 0 ? (
            <View>
              <Text
                style={{
                  fontSize: 20,
                  textAlign: 'center',
                  margin: 10,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  color: theme.text,
                }}
              >
                Frequently Bought Together
              </Text>
              <RadioGroup
                containerStyle={{ width: 200, alignItems: 'flex-start' }}
                radioButtons={this.state.RequiredItemList}
                onPress={i => this.checkThisRadio(i)}
              />
            </View>
          ) : null}

          {/* ── Addons ── */}
          {this.state.list.length !== 0 ? (
            <>
              <View style={{ margin: 20, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 20,
                    textAlign: 'center',
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    color: theme.text,
                  }}
                >
                  {' '}
                  More topping,{'\n'} more delicious!
                </Text>
              </View>
              <View style={{ marginTop: 5 }}>{this.renderAddons()}</View>
            </>
          ) : null}

          {/* ── Extra additional ── */}
          {this.state.Additionallist.length !== 0 ? (
            <>
              <View style={{ marginTop: 5 }}>
                <Text
                  style={{
                    fontSize: 20,
                    textAlign: 'center',
                    margin: 10,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    color: theme.text,
                  }}
                >
                  Extra additional
                </Text>
                {this.renderAdditionalAddons()}
              </View>
            </>
          ) : null}

          {/* ── Total price ── */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <NumericFormat
              value={this.state.Amount * this.state.itemQty}
              displayType={'text'}
              thousandSeparator={true}
              fixedDecimalScale={true}
              decimalScale={2}
              prefix={'LKR '}
              renderText={formattedValue => (
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    color: theme.text,
                  }}
                >
                  {formattedValue}
                </Text>
              )}
            />
            {this.state.isDiscounted && (
              <Text
                style={{
                  color: '#FF5722',
                  fontSize: 16,
                  marginTop: 4,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                }}
              >
                ( 10% OFF )
              </Text>
            )}
          </View>

          {/* ── Remove from cart ── */}
          {this.state.Location === 'Cart' ? (
            <TouchableOpacity
              style={{
                width: 190,
                alignSelf: 'center',
                marginTop: 20,
                margin: 10,
              }}
              onPressIn={() => {
                this.setState({ isLoading: true });
              }}
              onPress={() => this.onRemoveFromCart()}
            >
              <Text
                style={{
                  textAlign: 'center',
                  color: 'red',
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                }}
              >
                REMOVE FROM CART
              </Text>
            </TouchableOpacity>
          ) : null}
        </Animated.ScrollView>

        {/* ── Add / Update cart bottom bar ── */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.pill,
            borderRadius: 55 / 2,
            height: 55,
            alignItems: 'center',
            margin: 20,
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', left: 20 }}>
            <TouchableOpacity onPress={this.onMinPress.bind(this)}>
              <FontAwesome6
                name="minus"
                size={25}
                color={theme.pillText}
                style={{ flex: 1, margin: 10 }}
                solid
              />
            </TouchableOpacity>
            <Text
              style={{
                margin: 10,
                fontSize: 22,
                width: '18%',
                textAlign: 'center',
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                color: theme.pillText,
              }}
            >
              {this.state.itemQty}
            </Text>
            <TouchableOpacity onPress={this.onPlusPress.bind(this)}>
              <FontAwesome6
                name="plus"
                size={25}
                color={theme.pillText}
                style={{ flex: 1, margin: 10 }}
                solid
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPressIn={() => this.onEnableLoader()}
            onPress={() => {
              this.LoadStoreStatus();
            }}
          >
            <View style={{ flex: 1, justifyContent: 'center', right: 30 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  color: theme.pillText,
                }}
              >
                {this.state.Location === 'Cart' ? 'UPDATE CART' : 'ADD TO CART'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Sticky image header ── */}
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: theme.surface },
            { transform: [{ translateY: headerTranslateY }] },
          ]}
        >
          <Animated.View
            style={[
              styles.headerBackground,
              {
                opacity: imageOpacity,
                transform: [{ translateY: imageTranslateY }],
              },
            ]}
          >
            <FastImage
              style={[
                styles.headerImage,
                { backgroundColor: 'rgba(0,0,0,0.4)' },
              ]}
              source={
                this.state.ProductIMG === ''
                  ? require('../assets/image-placeholder.png')
                  : {
                      uri: this.state.ProductIMG,
                      priority: FastImage.priority.normal,
                    }
              }
              resizeMode={FastImage.resizeMode.cover}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.headerImage,
              {
                opacity: imageOpacity,
                transform: [{ translateY: imageTranslateY }],
              },
            ]}
          >
            <FastImage
              style={styles.headerImage}
              source={
                this.state.ProductIMG === ''
                  ? require('../assets/image-placeholder.png')
                  : {
                      uri: this.state.ProductIMG,
                      priority: FastImage.priority.normal,
                    }
              }
              resizeMode={
                this.state.ProductIMG === ''
                  ? FastImage.resizeMode.cover
                  : FastImage.resizeMode.contain
              }
              onLoadStart={() => {
                this.setState({ loading: true });
              }}
              onLoadEnd={() => {
                this.setState({ loading: false });
              }}
            >
              <ActivityIndicator
                animating={this.state.loading}
                color={theme.accent}
                size={'large'}
                style={{ marginTop: 100 }}
              />
            </FastImage>
          </Animated.View>
        </Animated.View>

        {/* ── Back button ── */}
        <TouchableOpacity
          style={{ top: 20, left: 20, position: 'absolute' }}
          onPress={() => this.props.navigation.goBack()}
        >
          <Animated.View
            style={[
              {
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FFFFFF',
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

        <View
          style={{
            position: 'absolute',
            top: 20,
            right: 16,
          }}
        >
          <ThemeToggle />
        </View>

        {/* ── Collapsed title on scroll ── */}
        <Animated.View
          style={[
            { position: 'absolute', top: 28, left: 100, width: '60%' },
            { opacity: titleOpacity },
            { transform: [{ translateY: buttonTranslateY }] },
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: 20,
              textTransform: 'uppercase',
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              color: theme.text,
            }}
          >
            {this.state.ProductName}
          </Text>
        </Animated.View>

        {/* ── Full-screen loading overlay ── */}
        {this.state.isLoading || this.state.isLoadingVisible ? (
          <Animated.View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              opacity: this.state.overlayOpacity,
            }}
          >
            <View
              style={{
                width: 110,
                height: 110,
                backgroundColor: isDark
                  ? 'rgba(30,30,30,0.92)'
                  : 'rgba(245,245,245,0.92)',
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 8,
              }}
            >
              <LottieView
                source={require('../assets/lottiejson/fast-food.json')}
                autoPlay
                loop
                style={{ width: 80, height: 80 }}
              />
              <Text
                style={{
                  fontSize: 13,
                  marginTop: 2,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  color: isDark ? '#cccccc' : '#333333',
                }}
              >
                {this.state.Location === 'Cart' ? 'Updating...' : 'Adding...'}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>
    );
  }
}

// ── Redux ─────────────────────────────────────────────────────────────────────
const mapDispatchToProps = dispatch => ({
  addItemToCart: product => dispatch({ type: 'ADD_TO_CART', payload: product }),
  updateItemToCart: product =>
    dispatch({ type: 'UPDATE_FROM_CART', payload: product }),
  removeItemFromCart: product =>
    dispatch({ type: 'REMOVE_FROM_CART', payload: product }),
});
const mapStateToProps = state => ({ cartItems: state });

// withTheme wraps first, then connect — same pattern as DashboardScreen
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTheme(ItemScreen));

// ── StyleSheet — only static values, dynamic theme colours stay inline ────────
const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
