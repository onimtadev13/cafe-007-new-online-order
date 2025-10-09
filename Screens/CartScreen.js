import AsyncStorage from '@react-native-async-storage/async-storage';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import React from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { NumericFormat } from 'react-number-format';
import { connect } from 'react-redux';
import AppContext from '../Components/Context';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Swipeable } from 'react-native-gesture-handler';

let prevOpenedRow;

class CartScreen extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(0),
      Amount: 0.0,
    };
    this.row = [];
  }

  componentDidMount() {
    this._unsubscribe = this.props.navigation.addListener('focus', async () => {
      this.CaculateAmount();
      this.fadeIn();
    });
    this._unsubscribe = this.props.navigation.addListener('blur', async () => {
      this.fadeOut();
    });
  }

  componentWillUnmount() {
    this._unsubscribe();
    clearTimeout(this.CalculateTime);
  }

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

  CaculateAmount = () => {
    this.CalculateTime = setTimeout(() => {
      let price = 0;
      this.props.cartItems.forEach(element => {
        price = price + element.NetTotal;
      });
      this.setState({ Amount: price });
    }, 100);
  };

  // onRemoveCartItem = (index, CartItemID) => {
  //   AsyncStorage.removeItem(CartItemID);
  //   this.props.removeItemFromCart({index: index});
  //   this.row[index].close();
  //   this.CaculateAmount();
  // };

  onRemoveCartItem = async (index, CartItemID) => {
    await AsyncStorage.removeItem(`cart:${CartItemID}`);
    this.props.removeItemFromCart({ index: index });
    this.row[index].close();
    this.CaculateAmount();
  };

  rightSwipeActions = (progress, id, CartItemID) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={{
          backgroundColor: '#ff2b2b',
          margin: 5,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => this.onRemoveCartItem(id, CartItemID)}
      >
        <Animated.View
          style={[
            {
              transform: [
                {
                  scale: scale,
                },
              ],
            },
          ]}
        >
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}
          >
            <Text
              style={{
                color: 'white',
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 16,
                paddingHorizontal: 30,
              }}
            >
              Delete
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  closeRow = index => {
    if (prevOpenedRow && prevOpenedRow !== this.row[index]) {
      prevOpenedRow.close();
    }
    prevOpenedRow = this.row[index];
  };

  renderCartItems = ({ item, index }) => {
    //     if (!Array.isArray(item) || item.length === 0) {
    //       console.log("No items...");
    //   return null;
    // }
    return (
      <Swipeable
        key={index}
        ref={ref => {
          this.row[index] = ref;
        }}
        friction={2}
        rightThreshold={40}
        renderRightActions={progress =>
          this.rightSwipeActions(progress, index, item.CartItemID)
        }
      >
        <TouchableOpacity
          onPressIn={() => this.closeRow(index)}
          activeOpacity={1}
          onPress={() =>
            this.props.navigation.navigate('ItemScreen', {
              Location: 'Cart',
              PCode: item.ProductCode,
              PName: item.ProductName,
              PDescription: item.ProductDescription,
              PPrice: item.Price,
              IMG: item.ProductIMG,
              isDiscounted: item.isDiscounted,
              PQty: item.Qty,
              Amount: item.Amount,
              index: index,
              Addons: item.Addons,
              Extra: item.Extra,
              RequiredItem: item.RequiredItem,
              CartItemID: item.CartItemID,
            })
          }
        >
          <View
            style={{
              flex: 1,
              margin: 5,
              marginLeft: 10,
              backgroundColor: '#F0F0F0',
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: '#e0e0e0',
                  alignItems: 'center',
                  margin: 10,
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
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}
                >
                  {item.Qty}
                </Text>
              </View>
              <Text
                style={{
                  marginTop: 6,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  fontSize: 18,
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
                        marginTop: 6,
                        textAlignVertical: 'top',
                        marginLeft: 15,
                        fontFamily:
                          Platform.OS === 'ios'
                            ? 'Asap-Regular'
                            : 'AsapRegular',
                        fontSize: 20,
                      }}
                    >
                      {formattedValue}
                    </Text>
                  )} // <--- Don't forget this!
                />
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
            <View style={{ marginBottom: 10 }}>
              {/* {item.RequiredItem.name !== undefined ? (
                                <View style={{ marginLeft: 60 }}>
                                    <Text style={{ fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Medium' : 'AsapMedium', fontSize: 17, color: '#969696', marginRight: 5 }}>{item.RequiredItem.name}</Text>
                                </View>
                            )
                                :
                                null
                            } */}
              {this.renderAddons(item.Addons)}
              {this.renderExtra(item.Extra)}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  renderAddons(Addons) {
    console.log('====================================');
    console.log(Addons);
    console.log('====================================');

    if (!Array.isArray(Addons) || Addons.length === 0) {
      return null; // or return a <Text>No Addons</Text>
    }

    return Addons.map((item, key) => {
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
          {/* <NumericFormat
                        value={item.price}
                        displayType={'text'}
                        thousandSeparator={true}
                        fixedDecimalScale={true}
                        decimalScale={2}
                        prefix={'LKR '}
                        renderText={formattedValue => <Text style={{ fontFamily: Platform.OS === "ios" ? 'Asap-Regular_Medium' : 'AsapMedium', fontSize: 17, color: '#969696' }}>({formattedValue})</Text>} // <--- Don't forget this!
                    /> */}
        </View>
      );
    });
  }

  renderExtra(Extra) {
    if (!Extra || !Array.isArray(Extra) || Extra.length === 0) {
      return null; // nothing to render
    }
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
        </View>
      );
    });
  }

  checkUserLogin = async () => {
    let number = null;
    number = await AsyncStorage.getItem('phonenumber');
    if (this.state.Amount === 0.0) {
      Alert.alert('Alert', 'No Item Add in Cart');
    } else if (number === null) {
      this.context.CheckSign();
      // Promise.all([
      //     this.props.navigation.dispatch(
      //         CommonActions.reset({
      //             index: 0,
      //             routes: [{ name: "Home" }],
      //         })
      //     )
      // ]).then(() => this.context.CheckSign())
    } else {
      this.props.navigation.navigate('CheckoutScreen', {
        Total: this.state.Amount,
      });
    }
  };

  resetCart = async () => {
    let number = null;
    number = await AsyncStorage.getItem('phonenumber');
    if (number === null) {
      this.props.resetCart();
      this.RBSheet.close();
      this.CaculateAmount();
    } else {
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
          'PUSH',
          'NID',
        ].forEach(p => keys.splice(keys.indexOf(p), 1));

        await AsyncStorage.multiRemove(keys).then(() => {
          this.props.resetCart();
          this.RBSheet.close();
          this.CaculateAmount();
        });
      } catch (error) {
        // Error retrieving data
      }
    }
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

    return (
      <Animated.View style={[{ flex: 1 }, { opacity: this.state.fadeAnim }]}>
        <View style={{ marginLeft: 40, marginTop: 20, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 40,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 26,
              }}
            >
              Cart
            </Text>

            {this.props.cartItems.length <= 0 ? null : (
              <View>
                <TouchableOpacity onPress={() => this.RBSheet.open()}>
                  <FontAwesome6 name="align-right" size={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {this.props.cartItems.length <= 0 ? (
            <View>
              <View style={{ alignItems: 'center', marginTop: 130 }}>
                <Image
                  source={require('../assets/cart.png')}
                  style={{
                    width: 150,
                    height: 150,
                    resizeMode: 'contain',
                  }}
                />
              </View>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  fontSize: 18,
                  marginLeft: -30,
                  textAlign: 'center',
                  marginTop: 30,
                }}
              >
                Is it just me or does this meal look more scrumptious because
                I’m on a diet
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
                    backgroundColor: 'black',
                    borderRadius: 50,
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
                    Find Food
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={{ flex: 1, backgroundColor: '#F0F0F0' }}>
          <FlatList
            data={this.props.cartItems}
            keyExtractor={(item, index) => index.toString()}
            renderItem={this.renderCartItems}
            ItemSeparatorComponent={ItemSeperator}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {this.props.cartItems.length <= 0 ? null : (
          <View
            style={{
              height: 60,
              justifyContent: 'center',
              borderTopColor: 'black',
              borderTopWidth: 0.4,
              margin: 20,
              flexDirection: 'row',
            }}
          >
            <View style={{ top: 8, flex: 1 }}>
              <Text
                style={{
                  top: 5,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 16,
                  color: '#a8a8a8',
                }}
              >
                Total
              </Text>
              <NumericFormat
                value={this.state.Amount}
                displayType={'text'}
                thousandSeparator={true}
                fixedDecimalScale={true}
                decimalScale={2}
                prefix={'LKR '}
                renderText={formattedValue => (
                  <Text
                    // allowFontScaling={false}
                    style={{
                      top: 6,
                      color: 'black',
                      fontSize: 24,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                    }}
                  >
                    {formattedValue}
                  </Text>
                )} // <--- Don't forget this!
              />
            </View>
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                top: 10,
              }}
              onPress={() => this.checkUserLogin()}
            >
              <View
                style={{
                  width: 150,
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
                  Checkout
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <RBSheet
          animationType={'slide'}
          ref={ref => {
            this.RBSheet = ref;
          }}
          height={175}
          openDuration={700}
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
              Clear Cart?
            </Text>
            <Text
              style={{
                marginBottom: 20,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                fontSize: 18,
                color: 'black',
                alignSelf: 'center',
              }}
            >
              Do you want to clear items in the cart?
            </Text>
            <View
              style={{ flexDirection: 'row', marginLeft: 10, marginRight: 10 }}
            >
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => this.resetCart()}
                >
                  <View
                    style={{
                      width: '95%',
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
                      Clear
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => this.RBSheet.close()}
                >
                  <View
                    style={{
                      width: '95%',
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
                      Cancel
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </RBSheet>
      </Animated.View>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    removeItemFromCart: product =>
      dispatch({ type: 'REMOVE_FROM_CART', payload: product }),
    resetCart: () => dispatch({ type: 'RESET_CART' }),
  };
};

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CartScreen);
