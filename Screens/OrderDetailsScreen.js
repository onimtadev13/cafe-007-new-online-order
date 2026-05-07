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
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderProcess from '../Components/OrderProcess';
import messaging from '@react-native-firebase/messaging';
import RBSheet from 'react-native-raw-bottom-sheet';
import {CommonActions} from '@react-navigation/native';
import OrderImageSlider from '../Components/OrderImageSlider';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {withTheme} from '../Context/ThemeContext';    // ← NEW
import ThemeToggle from '../Components/ThemeToggle';  // ← NEW

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = Platform.OS === 'android' ? 64 : 74;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const width = Dimensions.get('screen').width;
let height = Dimensions.get('window').height;

class OrderDetailsScreen extends React.PureComponent {
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
    this.messageListner = messaging().onMessage(async remoteMessage => {
      const status = remoteMessage.data?.Status;
      switch (status) {
        case 'Processing': this.setState({OrderStatus: '1'}); break;
        case 'Preparing':  this.setState({OrderStatus: '2'}); break;
        case 'Delivery':   this.setState({OrderStatus: '3'}); break;
        case 'Cancel':     this.setState({OrderStatus: '4'}); break;
        case 'Finish':     this.setState({OrderStatus: '5'}); break;
        default: break;
      }
    });
  };

  onOrderCancelPress = Reason => {
    fetch(APIURL, {
      method: 'POST', cache: 'no-cache',
      headers: {'content-type': 'application/json', 'cache-control': 'no-cache'},
      body: JSON.stringify({
        HasReturnData: 'F',
        Parameters: [
          {Para_Data: '103',                Para_Direction: 'Input', Para_Lenth: 10,    Para_Name: '@Iid',   Para_Type: 'int'},
          {Para_Data: this.state.OrderID,   Para_Direction: 'Input', Para_Lenth: 50000, Para_Name: '@Text1', Para_Type: 'varchar'},
          {Para_Data: Reason,               Para_Direction: 'Input', Para_Lenth: 100,   Para_Name: '@Text2', Para_Type: 'varchar'},
        ],
        SpName: 'sp_Android_Common_API', con: '1',
      }),
    })
      .then(res => res.json())
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
    const ReasonList = CancelReason.map(element => ({
      id: element.id,
      message: element.message,
      isSelected: false,
    }));
    this.setState({CancelReason: ReasonList, isClickAddReason: false});
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  renderCartItems = Item => {
    const {theme} = this.props;  // ← NEW
    return Item.map((item, index) => (
      <View key={index} style={{
        flex: 1, margin: 5, marginLeft: 10,
        backgroundColor: theme.surface,   // ← was '#F0F0F0'
      }}>
        <View style={{flexDirection: 'row'}}>
          <View style={{
            width: 30, height: 30,
            backgroundColor: theme.surfaceDeep,  // ← was '#e0e0e0'
            alignItems: 'center', margin: 10,
            justifyContent: 'center', borderRadius: 6,
          }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 16, fontWeight: 'bold',
              color: theme.text,           // ← NEW
            }}>{item.Qty}</Text>
          </View>
          <Text style={{
            marginTop: 6,
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
            fontSize: 18, marginLeft: 10, flex: 0.85, fontWeight: '800',
            color: theme.text,             // ← NEW
          }}>{item.ProductName} </Text>
          <NumericFormat
            value={item.NetTotal}
            displayType={'text'}
            thousandSeparator={true}
            fixedDecimalScale={true}
            decimalScale={2}
            prefix={'LKR '}
            renderText={formattedValue => (
              <Text style={{
                marginTop: 6, textAlignVertical: 'top', marginLeft: 15,
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 20, color: theme.text,  // ← NEW
              }}>{formattedValue}</Text>
            )}
          />
        </View>
        <View style={{marginBottom: 10}}>
          {this.renderAddons(item.Addons)}
          {this.renderExtra(item.Extra)}
        </View>
      </View>
    ));
  };

  renderAddons(Addons) {
    const {theme} = this.props;  // ← NEW
    return Addons.map((item, key) => (
      <View key={key} style={{alignItems: 'center', marginLeft: 60, flexDirection: 'row'}}>
        <Text style={{
          fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
          fontSize: 16, marginRight: 5,
          color: theme.textMuted,          // ← was '#969696'
        }}>{item.name}</Text>
        <NumericFormat
          value={item.price}
          displayType={'text'}
          thousandSeparator={true}
          fixedDecimalScale={true}
          decimalScale={2}
          prefix={'LKR '}
          renderText={formattedValue => (
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 16,
              color: theme.textMuted,      // ← was '#969696'
            }}>({formattedValue})</Text>
          )}
        />
      </View>
    ));
  }

  renderExtra(Extra) {
    const {theme} = this.props;  // ← NEW
    return Extra.map((item, key) => (
      <View key={key} style={{alignItems: 'center', marginLeft: 60, flexDirection: 'row'}}>
        <Text style={{
          fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
          fontSize: 16, marginRight: 5,
          color: theme.textMuted,          // ← was '#969696'
        }}>{item.name}</Text>
        <NumericFormat
          value={item.amount}
          displayType={'text'}
          thousandSeparator={true}
          fixedDecimalScale={true}
          decimalScale={2}
          prefix={'LKR '}
          renderText={formattedValue => (
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
              fontSize: 16,
              color: theme.textMuted,      // ← was '#969696'
            }}>({formattedValue})</Text>
          )}
        />
      </View>
    ));
  }

  renderReason = ({item}) => {
    const {theme} = this.props;  // ← NEW
    return (
      <TouchableOpacity
        style={{flex: 1, margin: 5, justifyContent: 'space-between'}}
        onPress={() => this.onReasonClick(item.id)}>
        <View style={{
          flex: 1, alignItems: 'center', justifyContent: 'center',
          borderColor: item.isSelected ? theme.pill : theme.inputBorder,  // ← NEW
          borderWidth: 1,
          backgroundColor: item.isSelected ? theme.pill : 'transparent',  // ← NEW
          borderRadius: 5,
        }}>
          <Text style={{
            paddingLeft: 10, paddingRight: 10,
            paddingBottom: 5, paddingTop: 5,
            textAlign: 'center',
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 16,
            color: item.isSelected ? theme.pillText : theme.textMuted,    // ← NEW
          }}>{item.message}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  onReasonClick = ReasonID => {
    const list = this.state.CancelReason;
    const index = list.findIndex(i => i.id === ReasonID);
    list[index].isSelected = !list[index].isSelected;
    this.setState({
      isClickAddReason: list[5].isSelected,
      CancelReason: list,
      flatID: this.state.flatID + 1,
    });
  };

  onBackPress = () => {
    if (this.state.backStatus === '0') {
      this.props.navigation.dispatch(
        CommonActions.reset({index: 0, routes: [{name: 'Orders'}]}),
      );
    } else {
      this.props.navigation.goBack();
    }
  };

  onCancelSubmitPress = () => {
    if (!this.CanceltouchableInactive) {
      var Reason = '';
      var Selected = this.state.CancelReason.filter(i => i.isSelected === true);
      Reason = Selected.map(s => s.message).join(' | ');

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

  // ── Billing row helper — avoids repeating the same pattern 6 times ──────────
  renderBillingRow(label, value, isFirst = false) {
    const {theme} = this.props;
    return (
      <View style={{
        flexDirection: 'row',
        marginTop: isFirst ? 0 : 5,
        marginLeft: 30, marginRight: 30,
      }}>
        <Text style={{
          flex: 1,
          fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
          fontSize: 16,
          color: theme.textSub,            // ← was 'black'
        }}>{label}</Text>
        <NumericFormat
          value={value}
          displayType={'text'}
          thousandSeparator={true}
          fixedDecimalScale={true}
          decimalScale={2}
          prefix={'LKR '}
          renderText={formattedValue => (
            <Text style={{
              flex: 1,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16, textAlign: 'right',
              color: theme.text,           // ← was 'black'
            }}>{formattedValue}</Text>
          )}
        />
      </View>
    );
  }

  render() {
    const {theme} = this.props;  // ← NEW: single destructure at top

    // ── Separator ─────────────────────────────────────────────────────────────
    const Separator = ({mt = 10, mb = 20}) => (
      <View style={{
        height: 0.9,
        marginTop: mt, marginBottom: mb,
        marginLeft: 20, marginRight: 20,
        backgroundColor: theme.separator,   // ← was 'black'
      }} />
    );

    // ── Scroll animations (unchanged) ─────────────────────────────────────────
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
      case '1': ORDERSTATUS = 'Processing';  break;
      case '2': ORDERSTATUS = 'Preparing';   break;
      case '3': ORDERSTATUS = 'Delivering';  break;
      case '4': ORDERSTATUS = 'Cancel';      break;
      case '5': ORDERSTATUS = 'Finish';      break;
      default: break;
    }

    return (
      <View style={{flex: 1, backgroundColor: theme.bg}}>  {/* ← NEW bg */}

        {/* ── Scrollable body ── */}
        <Animated.ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.isLoading}
              colors={[theme.accent]}          // ← was ['red','green','blue']
              tintColor={theme.accent}
              title={'Refreshing'}
              titleColor={theme.textSub}
            />
          }
          contentContainerStyle={{paddingTop: HEADER_MAX_HEIGHT}}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: this.state.scrollY}}}],
            {useNativeDriver: true},
          )}>

          <Separator mt={10} mb={0} />

          {/* ── Order ID + Cancel button row ── */}
          <View style={{
            flexDirection: 'row', marginTop: 10, marginLeft: 20,
            alignItems: 'center',
            marginBottom: this.state.OrderStatus === '1' ? 10 : 0,
          }}>
            <Text style={{
              flex: 1,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 20, color: theme.text,   // ← NEW
            }}>Order No : {this.state.OrderID}</Text>

            {this.state.OrderStatus === '1' ? (
              <TouchableOpacity
                style={{
                  backgroundColor: theme.pill,  // ← was 'black'
                  borderRadius: 15, height: 30,
                  alignItems: 'center', marginRight: 20,
                }}
                onPress={() => {
                  this.props.navigation.navigate('OrderCancelScreen', {
                    OrderID: this.state.OrderID,
                    Screen: 'OrderDetailsScreen',
                  });
                }}>
                <View style={{flex: 1, justifyContent: 'center'}}>
                  <Text style={{
                    color: theme.pillText,       // ← was 'white'
                    fontSize: 14,
                    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    paddingRight: 15, paddingLeft: 15,
                  }}>Cancel Order</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ── Order date ── */}
          <Text style={{
            flex: 1,
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 16, marginLeft: 20, marginTop: 2,
            color: theme.textMuted,              // ← was '#9c9c9c'
          }}>Order date : {this.state.InsertDate}</Text>

          {/* ── Quantity ── */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            marginTop: 2, marginLeft: 20, marginRight: 35,
          }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16, color: theme.textMuted,
            }}>Quantity :</Text>
            <Text style={{
              flex: 1,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 16, marginLeft: 10, color: theme.text,
            }}>{this.state.OrderItemList.length}</Text>
          </View>

          {/* ── Schedule Time ── */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            marginTop: 2, marginLeft: 20, marginRight: 35,
          }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16, color: theme.textMuted,
            }}>Schedule Time :</Text>
            <Text style={{
              flex: 1,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 16, marginLeft: 10, color: theme.text,
            }}>{this.state.ScheduleTime}</Text>
          </View>

          {/* ── Branch ── */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            marginTop: 2, marginLeft: 20, marginRight: 35,
          }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16, color: theme.textMuted,
            }}>Branch :</Text>
            <Text style={{
              flex: 1,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 16, marginLeft: 10, color: theme.text,
            }}>{this.state.BranchLocation}</Text>
          </View>

          <Separator mt={10} mb={15} />

          {/* ── Order Process header ── */}
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{
              flex: 1,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 18, marginLeft: 20, color: theme.text,  // ← NEW
            }}>Order Process</Text>
            <TouchableOpacity onPress={() => this.onShowlessPress()}>
              <Text style={{
                marginRight: 30,
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                color: theme.textMuted,          // ← was '#7a7a7a'
              }}>{this.state.isShowLess ? 'Show less' : 'Show more'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 14, marginLeft: 20, marginRight: 20,
            color: theme.textMuted,              // ← was '#9c9c9c'
            marginTop: 5,
          }}>
            If you would like to know more about any purchase order you have
            made, then allow order tracking forms to help you.
          </Text>

          <Separator mt={15} mb={20} />

          {/* ── Collapsible order process timeline ── */}
          <View style={{overflow: 'hidden', height: this.state.isShowLess ? null : 0}}>
            {!this.state.isLoading ? (
              <View style={{marginLeft: 30}}>
                <OrderProcess
                  ScheduleTime={this.state.ScheduleTime}
                  OrderID={this.state.OrderID}
                  OrderStatus={ORDERSTATUS}
                  StatusList={this.state.StatusList}
                  DineType={this.state.DineType}
                   theme={this.props.theme}    
  isDark={this.props.isDark}
                />
              </View>
            ) : null}
            <Separator mt={20} mb={20} />
          </View>

          {/* ── Order Items header ── */}
          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
            fontSize: 18, marginLeft: 20, color: theme.text,
          }}>Order Items</Text>
          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 14, marginLeft: 20, marginRight: 20,
            color: theme.textMuted, marginTop: 5,
          }}>
            The following information is included for each unit on your order summary
          </Text>

          <Separator mt={20} mb={20} />

          {/* ── Order items list ── */}
          {this.state.isLoading ? (
            <ActivityIndicator animating={true} color={theme.accent} />  // ← was 'black'
          ) : (
            <SafeAreaView style={{flex: 1}}>
              {this.renderCartItems(this.state.OrderItemList)}
            </SafeAreaView>
          )}

          <Separator mt={20} mb={20} />

          {/* ── Billing Information ── */}
          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
            fontSize: 18, marginLeft: 20, color: theme.text,
          }}>BILLING INFORMATION</Text>

          <Separator mt={20} mb={20} />

          {this.renderBillingRow('Sub Total',     this.state.SubTotal,       true)}
          {this.renderBillingRow('Tax',           this.state.Tax)}
          {this.state.Discount !== 0
            ? this.renderBillingRow('Discount',   this.state.Discount)
            : null}
          {this.state.DineType === 'Delivery'
            ? this.renderBillingRow('Delivery Charge', this.state.DeliveryCharge)
            : null}
          {(this.state.DineType === 'PickUp' || this.state.DineType === 'EatIn')
            ? this.renderBillingRow('Service Charge',  this.state.ServiceCharge)
            : null}
          {this.renderBillingRow('Net Total',     this.state.NetTotal)}

          <Separator mt={20} mb={20} />

          {/* ── Order Information ── */}
          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
            fontSize: 18, marginLeft: 20, color: theme.text,
          }}>ORDER INFORMATION</Text>
          <Text style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 14, marginLeft: 20, marginRight: 20,
            color: theme.textMuted, marginTop: 5,
          }}>
            The information presented here is included on your order like payment type, dine type, delivery address
          </Text>

          <Separator mt={20} mb={20} />

          {/* Payment Type */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            marginLeft: 20, marginRight: 20,
          }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 17, color: theme.textMuted,
            }}>Payment Type :</Text>
            <Text style={{
              flex: 1,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 17, textAlign: 'right', color: theme.text,
            }}>{this.state.PaymentType}</Text>
          </View>

          {/* Dine Type */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            marginTop: 3, marginLeft: 20, marginRight: 20,
          }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 17, color: theme.textMuted,
            }}>Dine Type :</Text>
            <Text style={{
              flex: 1,
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 17, textAlign: 'right', color: theme.text,
            }}>{this.state.DineType}</Text>
          </View>

          {/* Delivery Address */}
          {this.state.DineType === 'Delivery' ? (
            <View style={{
              flexDirection: 'row', marginTop: 3,
              marginLeft: 20, marginRight: 20,
            }}>
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 17, color: theme.textMuted,
              }}>Delivery Address :</Text>
              <Text style={{
                flex: 1,
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 17, textAlign: 'right', color: theme.text,
              }}>{this.state.DeliveryAddress}</Text>
            </View>
          ) : null}

          <Separator mt={20} mb={20} />

        </Animated.ScrollView>

        {/* ── Sticky image header ── */}
        <Animated.View style={[
          {
            height: HEADER_MAX_HEIGHT, width: '100%',
            position: 'absolute',
            backgroundColor: theme.surface,   // ← was '#F0F0F0'
            overflow: 'hidden',
          },
          {transform: [{translateY: headerTranslateY}]},
        ]}>
          {this.state.isLoading ? (
           <SkeletonPlaceholder
  backgroundColor={this.props.isDark ? '#252420' : '#e0e0e0'}
  highlightColor={this.props.isDark ? '#0F0E0C' : '#fafafa'}>
  <View style={{height: 200}} />
</SkeletonPlaceholder>
          ) : (
            <Animated.View style={[
              {opacity: imageOpacity, transform: [{translateY: imageTranslateY}]},
            ]}>
              <OrderImageSlider ImageList={this.state.ImageList} />
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Back button (absolute) ── */}
        <TouchableOpacity
          style={{top: Platform.OS === 'ios' ? 30 : 20, left: 20, position: 'absolute'}}
          onPress={() => this.onBackPress()}>
          <Animated.View style={[
            {
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: '#FFFFFF', 
              alignItems: 'center', justifyContent: 'center',
            },
            {transform: [{scale: buttonScale}, {translateY: buttonTranslateY}]},
          ]}>
            <Image source={require('../assets/left-arrow.png')} style={{width: 20, height: 20}} />
          </Animated.View>
        </TouchableOpacity>

        {/* ── ThemeToggle (absolute, top-right) ── */}
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 30 : 20,
          right: 16,
        }}>
          <ThemeToggle />                         
        </View>

        {/* ── Collapsed title (appears on scroll) ── */}
        <Animated.View style={[
          {position: 'absolute', top: 28, left: 100, width: '60%'},
          {opacity: titleOpacity},
          {transform: [{translateY: titleTranslateY}]},
        ]}>
          <Text numberOfLines={1} style={{
            fontSize: 20, textTransform: 'uppercase',
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            color: theme.text,                 // ← NEW
          }}>Order No : {this.state.OrderID}</Text>
        </Animated.View>

        {/* ── Cancel order RBSheet ── */}
        <RBSheet
          ref={ref => {this.RBSheet = ref;}}
          height={height}
          openDuration={850}
          onClose={() => this.onSheetClose()}
          closeOnDragDown={false}
          closeOnPressMask={true}
          keyboardAvoidingViewEnabled={false}
          customStyles={{
            wrapper: {backgroundColor: 'rgba(0,0,0,0.6)'},
            draggableIcon: {backgroundColor: theme.textMuted},  // ← was '#000'
            container: {
              borderTopLeftRadius: 15, borderTopRightRadius: 15,
              backgroundColor: theme.card,     // ← NEW
            },
          }}>
          <View style={{flex: 1}}>

            {/* Sheet header */}
            <View style={{
              flexDirection: 'row',
              marginLeft: 30, marginTop: 30, marginBottom: 20,
            }}>
              <TouchableOpacity onPress={() => this.RBSheet.close()}>
                <FontAwesome6 name="xmark" size={30} color={theme.text} solid />  {/* ← was 'black' */}
              </TouchableOpacity>
              <Text style={{
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 18, alignSelf: 'center', marginLeft: 30,
                color: theme.text,             // ← was 'black'
              }}>Add order cancel remark</Text>
            </View>

            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16, alignSelf: 'center',
              marginLeft: 30, marginRight: 30,
              textAlign: 'center', marginBottom: 10,
              color: theme.textSub,            // ← was 'black'
            }}>
              Cancelling the selected orders will disable them from being
              processed. If the sales channel is not notified, these orders
              can't be restored.
            </Text>

            {/* Cancel reason chips */}
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

            {/* Remark text input */}
            <TextInput
              style={{
                backgroundColor: theme.inputBg,   // ← was '#f0f0f0'
                height: 100, paddingLeft: 20,
                borderRadius: 5,
                borderColor: theme.inputBorder,   // ← was '#dbdbdb'
                borderWidth: 1, fontSize: 16,
                fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                justifyContent: 'center',
                color: theme.text,                // ← was 'black'
                textAlignVertical: 'top',
                marginLeft: 30, marginRight: 30,
              }}
              multiline={true}
              blurOnSubmit={true}
              keyboardType={'default'}
              placeholderTextColor={theme.textMuted}  // ← was '#7a7a7a'
              returnKeyType="done"
              onChangeText={remark => this.setState({CancelRemark: remark})}
            />

            {/* Submit button */}
            <TouchableOpacity
              style={{
                alignItems: 'center', justifyContent: 'flex-end',
                marginBottom: 10, marginRight: 5, marginLeft: 5, marginTop: 10,
              }}
              onPress={() => this.onCancelSubmitPress()}>
              <View style={{
                width: '92%', height: 45,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: theme.pill,      // ← was 'black'
                borderRadius: 5,
              }}>
                <Text style={{
                  color: theme.pillText,           // ← was 'white'
                  fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                  fontSize: 18,
                }}>Submit</Text>
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
      method: 'POST', cache: 'no-cache',
      headers: {'content-type': 'application/json', 'cache-control': 'no-cache'},
      body: JSON.stringify({MobileNo: Mobile, OrderId: this.state.OrderID}),
    })
      .then(res => res.json())
      .then(json => {
        const SList = [];
        const Images = [];
        const {
          NetTotal, DineType, PaymentType, DeliveryAddress,
          InsertDate, Tax, Discount, DeliveryCharge, ServiceCharge,
          SubTotal, OrderStatus, ScheduleTime, BranchLocation, Items,
        } = json;

        Items.forEach(element => {
          Images.push({ProductIMG: element.ProductIMG ? element.ProductIMG.trim() : ''});
        });

        if      (OrderStatus == '1') { SList.push('Processing'); }
        else if (OrderStatus == '2') { SList.push('Processing', 'Accept', 'Preparing'); }
        else if (OrderStatus == '3') { SList.push('Processing', 'Accept', 'Preparing', 'Delivering'); }
        else if (OrderStatus == '4') { SList.push('Processing', 'Cancel'); }
        else if (OrderStatus == '5') { SList.push('Processing', 'Accept', 'Preparing', 'Delivering', 'Finish'); }

        this.setState({
          InsertDate, NetTotal, DineType, PaymentType,
          DeliveryAddress, Tax, Discount, DeliveryCharge,
          ServiceCharge, SubTotal, OrderStatus,
          OrderItemList: Items,
          ImageList: Images,
          isLoading: false,
          StatusList: SList,
          ScheduleTime, BranchLocation,
          isShowLess: OrderStatus === '5' || OrderStatus === '4' ? false : true,
        });
      })
      .catch(er => {
        console.log('LoadOrderDetail', er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {text: 'Try Again', onPress: () => this.LoadOrderDetail()},
            {text: 'Close'},
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

// No Redux on this screen — withTheme alone is enough
export default withTheme(OrderDetailsScreen);