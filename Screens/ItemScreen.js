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
// import Ionicons from 'react-native-vector-icons/Ionicons';
import { APIURL } from '../Data/CloneData';
import { connect } from 'react-redux';
import CheckBox from '@react-native-community/checkbox';
import Star from 'react-native-star-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RadioGroup from 'react-native-radio-buttons-group';
import FastImage from 'react-native-fast-image';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { white } from 'react-native-paper/lib/typescript/styles/themes/v2/colors';

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
      .then(res => {
        return res.json();
      })
      .then(json => {
        this.setState({
          Shop_Status: json.CommonResult.Table[0].Shop_Status,
        });

        if (json.CommonResult.Table[0].Shop_Status == 'T') {
          Alert.alert(
            'Warning',
            'Currently Unavailable',
            [
              {
                text: 'Try Again',
                onPress: () => this.setState({ isLoading: false }),
              },
              {
                text: 'Close',
                onPress: () => this.setState({ isLoading: false }),
              },
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
      .then(res => {
        return res.json();
      })
      .then(json => {
        console.log(json.CommonResult.Table[0]);

        this.setState({
          ProductName: json.CommonResult.Table[0].Prod_Name,
          ProductDescription: json.CommonResult.Table[0].More_Descrip,
          ProductPrice: json.CommonResult.Table[0].Purchase_Price,
          ProductIMG: json.CommonResult.Table[0].ImagePath,
          Amount: json.CommonResult.Table[0].Purchase_Price,
        });

        console.log(this.state.ProductPrice);
      })
      .catch(er => {
        console.log(er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.LoadFoodDetails(this.state.ProductCode),
            },
            {
              text: 'Close',
              // onPress: () => BackHandler.exitApp()
            },
          ],
          { cancelable: false },
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
      .then(res => {
        return res.json();
      })
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

          if (json.CommonResult.Table.length === 0) {
            list.push();
          } else {
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
                const index = list.findIndex(
                  x => x.name === addlist[index].name,
                );
                list[index].checked = true;
                list[index].color = 'black';
              }
            } else {
              for (let i = 0; i < addlist.length; i++) {
                const index = list.findIndex(x => x.name === addlist[i].name);
                list[index].checked = true;
                list[index].color = 'black';
              }
            }
          }

          if (json.CommonResult.Table1.length === 0) {
            additionallist.push();
          } else {
            PMax_AdditionalAddons =
              json.CommonResult.Table1[0].product_max_extras;
            json.CommonResult.Table1.forEach((element, index) => {
              // additionallist.push({ id: index, extraId: element.extraId, name: element.name, price: parseInt(element.price), checked: false, qty: 1, amount: element.price })
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
                const index = additionallist.findIndex(
                  x => x.name === extralist[a].name,
                );
                additionallist[index].checked = true;
                additionallist[index].color = 'black';
              }
            } else {
              for (let z = 0; z < extralist.length; z++) {
                const index = additionallist.findIndex(
                  x => x.name == extralist[z].name,
                );
                additionallist[index].checked = true;
                additionallist[index].color = 'black';
              }
            }

            // for (let i = 0; i < extralist.length; i++) {
            //     const addindex = additionallist.findIndex(a => a.name == extralist[i].name);
            //     additionallist[addindex].checked = true
            //     additionallist[addindex].qty = extralist[i].qty;
            //     additionallist[addindex].amount = extralist[i].amount;
            // }
          }

          // if (json.CommonResult.Table2.length === 0) {
          //     RequiredItemList.push();
          // } else {
          //     json.CommonResult.Table2.forEach((element, index) => {

          //         if (SelectRItem.code === element.itemId) {
          //             RequiredItemList.push({ id: index, label: element.name, selected: true, value: { id: index, code: element.itemId, name: element.name }, labelStyle: { fontSize: 18, fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular' }, containerStyle: { width: (Dimensions.get('window').width) - 20, backgroundColor: '#ededed', margin: 5, borderRadius: 10, borderColor: 'white', borderWidth: 1, padding: 15 } })
          //         } else {
          //             RequiredItemList.push({ id: index, label: element.name, selected: false, value: { id: index, code: element.itemId, name: element.name }, labelStyle: { fontSize: 18, fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular' }, containerStyle: { width: (Dimensions.get('window').width) - 20, backgroundColor: '#ededed', margin: 5, borderRadius: 10, borderColor: 'white', borderWidth: 1, padding: 15 } })
          //         }
          //     });
          // }
          this.setState({
            SelectedRequiredItem: SelectRItem,
            list: list,
            Additionallist: additionallist,
            RequiredItemList: RequiredItemList,
            isLoading: false,
            itemQty: this.props.route.params.PQty,
            Amount: this.props.route.params.Amount,
            Max_Addons: PMax_Addons,
            Max_Additional_Addons: PMax_AdditionalAddons,
          });
          this.scrollView.scrollToEnd({ animated: true });
        } else {
          const list = [];
          const Additionallist = [];
          const RequiredItemList = [];
          var PMax_Addons = 0;
          var PMax_AdditionalAddons = 0;

          if (json.CommonResult.Table.length === 0) {
            list.push();
          } else {
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

          if (json.CommonResult.Table1.length === 0) {
            Additionallist.push();
          } else {
            PMax_AdditionalAddons =
              json.CommonResult.Table1[0].product_max_extras;
            json.CommonResult.Table1.forEach((element, index) => {
              // Additionallist.push({ id: index, extraId: element.extraId, name: element.name, price: parseInt(element.price), checked: false, qty: 1, amount: element.price })
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

          // if (json.CommonResult.Table2.length === 0) {
          //     RequiredItemList.push();
          // } else {
          //     json.CommonResult.Table2.forEach((element, index) => {
          //         RequiredItemList.push({ id: index, label: element.name, value: { id: index, code: element.itemId, name: element.name }, labelStyle: { fontSize: 18, fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular' }, containerStyle: { width: (Dimensions.get('window').width) - 20, backgroundColor: '#ededed', margin: 5, borderRadius: 10, borderColor: 'white', borderWidth: 1, padding: 15 } })
          //     });
          // }

          this.setState({
            list: list,
            Additionallist: Additionallist,
            RequiredItemList: RequiredItemList,
            Max_Addons: PMax_Addons,
            Max_Additional_Addons: PMax_AdditionalAddons,
            isLoading: false,
          });
        }
      })
      .catch(error => {
        console.log('LoadFoodAddons', error);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [
            {
              text: 'Try Again',
              onPress: () => this.LoadFoodAddons(this.state.ProductCode),
            },
            {
              text: 'Close',
              // onPress: () => BackHandler.exitApp()
            },
          ],
          { cancelable: false },
        );
      });
  }

  // renderAdditionalAddons() {
  //     return this.state.Additionallist.map((item, index) => {
  //         return (
  //             <View key={index} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ededed', margin: 5, borderRadius: 10, borderColor: 'white', borderWidth: 1, padding: 15 }}>
  //                 {/* {item.checked ? ( */}
  //                 <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: -40, width: item.checked ? 85 : 0, overflow: 'hidden' }}>
  //                     <TouchableOpacity onPress={this.onMinAdditional.bind(this, item.id)}>
  //                         <View style={{ width: 25, height: 25, borderRadius: 25 / 2, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }}>
  //                             <Ionicons name="remove-outline" size={20} color='white' />
  //                         </View>
  //                     </TouchableOpacity>
  //                     <Text style={{ color: 'black', fontSize: 18, width: '30%', textAlign: 'center', fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular' }}>{item.qty}</Text>
  //                     <TouchableOpacity onPress={this.onPlusAdditional.bind(this, item.id)}>
  //                         <View style={{ width: 25, height: 25, borderRadius: 25 / 2, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }}>
  //                             <Ionicons name="add-outline" size={20} color='white' />
  //                         </View>
  //                     </TouchableOpacity>
  //                 </View>
  //                 {/* )
  //                     :
  //                     ( */}
  //                 <TouchableOpacity style={{ marginLeft: 45, width: item.checked ? 0 : 50, overflow: 'hidden' }} onPress={this.onClickAdditional.bind(this, item.id)}>
  //                     <Ionicons name="add-circle-outline" size={30} color={"black"} />
  //                 </TouchableOpacity>
  //                 {/* )} */}
  //                 <Text style={{ flex: 1, fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular', fontSize: 18 }}>{item.name}</Text>
  //                 <View style={{ flex: 1 }}>
  //                     <NumericFormat
  //                         value={item.price}
  //                         displayType={'text'}
  //                         thousandSeparator={true}
  //                         fixedDecimalScale={true}
  //                         decimalScale={2}
  //                         prefix={'LKR '}
  //                         renderText={formattedValue => <Text style={{ fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular', fontSize: 18, textAlign: 'right', marginRight: 10 }}>{item.checked ? "" : "+"} {formattedValue}</Text>} // <--- Don't forget this!
  //                     />
  //                     {item.checked ? (
  //                         <NumericFormat
  //                             value={item.amount}
  //                             displayType={'text'}
  //                             thousandSeparator={true}
  //                             fixedDecimalScale={true}
  //                             decimalScale={2}
  //                             prefix={'LKR '}
  //                             renderText={formattedValue => <Text style={{ fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular', fontSize: 18, textAlign: 'right', marginRight: 10, color: "#5C5C5C" }}>+ {formattedValue}</Text>} // <--- Don't forget this!
  //                         />
  //                     )
  //                         : null}

  //                 </View>

  //             </View>
  //         )
  //     })
  // }

  // onClickAdditional(ItemID) {
  //     const list = this.state.Additionallist;
  //     const index = list.findIndex(x => x.id === ItemID);
  //     list[index].checked = !list[index].checked;
  //     if (list[index].checked) {
  //         this.setState({ Amount: this.state.Amount + list[index].price })
  //     } else {
  //         this.setState({ Amount: this.state.Amount - list[index].amount })
  //     }
  //     this.setState({ Additionallist: list })
  //     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  // }

  // onMinAdditional(ItemID) {
  //     const list = this.state.Additionallist;
  //     const index = list.findIndex(x => x.id === ItemID);
  //     if (list[index].qty > 1) {
  //         list[index].qty = list[index].qty - 1;
  //         list[index].amount = list[index].price * list[index].qty
  //         this.setState({ Amount: this.state.Amount - list[index].price })
  //     } else {
  //         list[index].checked = !list[index].checked;
  //         this.setState({ Amount: this.state.Amount - list[index].amount })
  //     }
  //     this.setState({ Additionallist: list })
  //     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  // }

  // onPlusAdditional(ItemID) {
  //     const list = this.state.Additionallist;
  //     const index = list.findIndex(x => x.id === ItemID);
  //     list[index].qty = list[index].qty + 1;
  //     list[index].amount = list[index].price * list[index].qty
  //     this.setState({ Additionallist: list, Amount: this.state.Amount + list[index].price })
  // }

  renderAdditionalAddons() {
    return this.state.Additionallist.map((item, key) => {
      return (
        <TouchableOpacity
          key={key}
          onPress={() => this.checkThisAdditionalBox(item.id)}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ededed',
              margin: 5,
              borderRadius: 10,
              borderColor: 'white',
              borderWidth: 1,
              padding: 15,
            }}
          >
            <CheckBox
              disabled={true}
              style={{ marginRight: 18, height: 25, width: 25 }}
              onCheckColor={'black'}
              onTintColor={'black'}
              tintColors={{ true: 'black', false: item.color }}
              onAnimationType={'fill'}
              value={item.checked}
            />
            {/* onValueChange={() => this.checkThisBox(item.id)}  */}
            <Text
              style={{
                flex: 1.2,
                fontSize: 18,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                color: item.color,
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
                    color: item.color,
                  }}
                >
                  + {formattedValue}
                </Text>
              )} // <--- Don't forget this!
            />
          </View>
        </TouchableOpacity>
      );
    });
  }

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

  renderAddons() {
    return this.state.list.map((item, key) => {
      return (
        <TouchableOpacity key={key} onPress={() => this.checkThisBox(item.id)}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ededed',
              margin: 5,
              borderRadius: 10,
              borderColor: 'white',
              borderWidth: 1,
              padding: 15,
            }}
          >
            <CheckBox
              disabled={true}
              style={{ marginRight: 18, height: 25, width: 25 }}
              onCheckColor={'black'}
              onTintColor={'black'}
              tintColors={{ true: 'black', false: item.color }}
              onAnimationType={'fill'}
              value={item.checked}
            />
            {/* onValueChange={() => this.checkThisBox(item.id)}  */}
            <Text
              style={{
                flex: 1.2,
                fontSize: 18,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                color: item.color,
              }}
            >
              {item.name}
            </Text>
          </View>
        </TouchableOpacity>
      );
    });
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
    let number = null;
    let OrderID = null;
    number = await AsyncStorage.getItem('phonenumber');
    OrderID = await AsyncStorage.getItem('OrderID');
    if (number === null) {
      this.setState({ userlog: number, OrderID: OrderID });
    } else {
      this.setState({ userlog: number, OrderID: OrderID });
    }
  };

  _retrieveData = async () => {
    const value = await AsyncStorage.getItem('LOCA');
    this.setState({ LocationDB: value });
  };

  onAddtoCart = () => {
    if (!this.touchableInactive) {
      this.touchableInactive = true;

      let CartItemID = this.generateID(5); // Generate unique key ID for save items in asyncstorage

      var itemcode = this.state.list.map(t => t.addonsId);
      var item = this.state.list.map(t => t.name);
      var itemprice = this.state.list.map(t => t.price);
      var checked = this.state.list.map(t => t.checked);
      let selected = [];
      for (let i = 0; i < checked.length; i++) {
        if (checked[i]) {
          selected.push({
            OrderID: this.state.OrderID,
            CartItemID: CartItemID,
            ProductCode: this.state.ProductCode,
            AddonsCode: itemcode[i],
            name: item[i],
            price: itemprice[i],
          });
        }
      }

      var itemcode = this.state.Additionallist.map(t => t.extrasId);
      var item = this.state.Additionallist.map(t => t.name);
      var itemprice = this.state.Additionallist.map(t => t.price);
      var additional_checked = this.state.Additionallist.map(t => t.checked);
      let Extralist = [];
      for (let y = 0; y < additional_checked.length; y++) {
        if (additional_checked[y]) {
          Extralist.push({
            OrderID: this.state.OrderID,
            CartItemID: CartItemID,
            ProductCode: this.state.ProductCode,
            ExtraCode: itemcode[y],
            name: item[y],
            price: itemprice[y],
          });
        }
      }

      /* Extras Can increase qty */
      // var AdditionalItemCode = this.state.Additionallist.map((t) => t.extraId);
      // var AdditionalItem = this.state.Additionallist.map((y) => y.name);
      // var AdditionalItemPrice = this.state.Additionallist.map((y) => y.amount);
      // var AdditionalItemQty = this.state.Additionallist.map((y) => y.qty);
      // var AdditionalChecked = this.state.Additionallist.map((y) => y.checked);
      // var Extralist = []
      // for (let y = 0; y < AdditionalChecked.length; y++) {
      //     if (AdditionalChecked[y]) {
      //         Extralist.push({ OrderID: this.state.OrderID, CartItemID: CartItemID, ProductCode: this.state.ProductCode, ExtraCode: AdditionalItemCode[y], name: AdditionalItem[y], amount: AdditionalItemPrice[y], qty: AdditionalItemQty[y] });
      //     }
      // }

      if (this.state.Location === 'Cart') {
        let CartItemID = this.props.route.params.CartItemID;

        let Product = {
          OrderID: this.state.OrderID,
          CartItemID: CartItemID,
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
        };

        if (this.state.userlog !== null) {
          AsyncStorage.setItem(CartItemID, JSON.stringify(Product));
          this.props.updateItemToCart(Product);
          this.props.navigation.goBack();
        } else {
          this.props.updateItemToCart(Product);
          this.props.navigation.goBack();
        }
      } else {
        let Product = {
          OrderID: this.state.OrderID,
          CartItemID: CartItemID,
          ProductCode: this.state.ProductCode,
          ProductName: this.state.ProductName,
          ProductDescription: this.state.ProductDescription,
          ProductIMG: this.state.ProductIMG,
          Price: this.state.ProductPrice,
          NetTotal: this.state.Amount * this.state.itemQty,
          Amount: this.state.Amount, // Because NumericFormate it show in productprice and to net-total use Amount set in (this.state.Amount * this.state.itemQty) to show Product Amount Price without Qty. That's why I send Amount into redux
          Qty: this.state.itemQty,
          Addons: selected,
          Extra: Extralist,
          LocationDB: this.state.LocationDB,
          isDiscounted: this.state.isDiscounted,
        };

        if (this.state.userlog !== null) {
          if (this.props.cartItems.length === 0) {
            // If Previous Cart Item Bottomsheet not popup , I have to clear previous items in asyncstorage
            this.onClearAsync();
          }
          AsyncStorage.setItem(CartItemID, JSON.stringify(Product)); // Because If app close redux state reset and previous add items not show. Thats why I save Product Json in asyncstorage
          this.props.addItemToCart(Product);
          this.props.navigation.goBack();
        } else {
          this.props.addItemToCart(Product);
          this.props.navigation.goBack();
        }
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
    } catch (error) {
      // Error retrieving data
    }
  };

  generateID = length => {
    var result = '';
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
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
      <View style={{ flex: 1 }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 30,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  }}
                >
                  {this.state.ProductName}
                </Text>
                <Text
                  style={{
                    textTransform: 'lowercase',
                    fontSize: 16,
                    color: '#5C5C5C',
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  }}
                >
                  @{this.state.ProductName}
                </Text>
                <View style={{ marginTop: 10 }}>
                  {/* <NumericFormat
                    value={this.state.ProductPrice}
                    displayType={'text'}
                    thousandSeparator={true}
                    fixedDecimalScale={true}
                    decimalScale={2}
                    prefix={'LKR '}
                    renderText={formattedValue => (
                      <Text
                        style={{
                          color: '#FF6900',
                          fontSize: 22,
                          fontFamily:
                            Platform.OS === 'ios'
                              ? 'Asap-Regular_Bold'
                              : 'AsapBold',
                        }}>
                        {formattedValue}
                      </Text>
                    )} // <--- Don't forget this!
                  /> */}
                </View>
              </View>

              <View
                style={{ marginRight: 20, alignItems: 'center', marginTop: 20 }}
              >
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 28,
                  }}
                >
                  4.7
                </Text>
                <Star score={4.7} style={{ width: 120, height: 25 }} />
                <Text
                  style={{
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 15,
                    color: '#5C5C5C',
                    marginTop: 5,
                  }}
                >
                  (35 Reviews)
                </Text>
              </View>
            </View>

            <View style={{ margin: 20 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                }}
              >
                Description
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  margin: 10,
                  color: '#5C5C5C',
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                }}
              >
                {this.state.ProductDescription === ''
                  ? 'No Description Available'
                  : this.state.ProductDescription}
              </Text>
              {/* <Text style={{ fontSize: 16, margin: 10, color: '#5C5C5C', fontFamily: Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular' }}>The flavor of your food is what most customers focus on when they are deciding what to eat. How you present the dishes on your menu can help build anticipation, and a good menu description could even convince a hesitant customer to try something new.</Text> */}
            </View>
          </View>

          {this.state.RequiredItemList.length !== 0 ? (
            <View>
              <Text
                style={{
                  fontSize: 20,
                  textAlign: 'center',
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  margin: 10,
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

          {this.state.list.length !== 0 ? (
            <>
              <View style={{ margin: 20, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 20,
                    textAlign: 'center',
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  }}
                >
                  {' '}
                  More topping,{'\n'} more delicious!
                </Text>
              </View>
              <View style={{ marginTop: 5 }}>{this.renderAddons()}</View>
            </>
          ) : null}

          {this.state.Additionallist.length !== 0 ? (
            <>
              <View style={{ marginTop: 5 }}>
                <Text
                  style={{
                    fontSize: 20,
                    textAlign: 'center',
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    margin: 10,
                  }}
                >
                  Extra additional
                </Text>
                {this.renderAdditionalAddons()}
              </View>
            </>
          ) : null}

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
                    color: 'black',
                    fontSize: 24,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  }}
                >
                  {formattedValue}
                </Text>
              )} // <--- Don't forget this!
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
              {/* <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}> */}
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
              {/* </View> */}
            </TouchableOpacity>
          ) : null}
        </Animated.ScrollView>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'black',
            borderRadius: 55 / 2,
            height: 55,
            alignItems: 'center',
            margin: 20,
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', left: 20 }}>
            <TouchableOpacity onPress={this.onMinPress.bind(this)}>
              {/* <Ionicons
                name="remove-outline"
                size={30}
                color="white"
                style={{ flex: 1, margin: 10 }}
              /> */}
              <FontAwesome6
  name="minus"
  size={25}
  color="white"
  style={{ flex: 1, margin: 10 }}
  solid
/>

            </TouchableOpacity>
            <Text
              style={{
                margin: 10,
                color: 'white',
                fontSize: 22,
                width: '18%',
                textAlign: 'center',
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              }}
            >
              {this.state.itemQty}
            </Text>
            <TouchableOpacity onPress={this.onPlusPress.bind(this)}>
              {/* <Ionicons
                name="add-outline"
                size={30}
                color="white"
                style={{ flex: 1, margin: 10 }}
              /> */}
              <FontAwesome6
  name="plus"
  size={25}
  color="white"
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
                  color: 'white',
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                }}
              >
                {this.state.Location === 'Cart' ? 'UPDATE CART' : 'ADD TO CART'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.header,
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
            {/* <View style={[styles.headerImage,{backgroundColor:'rgba(0,0,0,0.4)'}]}/> */}
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
                color={'black'}
                size={'large'}
                style={{ marginTop: 100 }}
              />
            </FastImage>
          </Animated.View>
        </Animated.View>

        <TouchableOpacity
          style={{ top: 20, left: 20, position: 'absolute' }}
          onPress={() => this.props.navigation.goBack()}
        >
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

        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 28,
              left: 100,
              width: '60%',
            },
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
            }}
          >
            {this.state.ProductName}
          </Text>
        </Animated.View>

        {this.state.isLoading ? (
          <View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: 'white',
                borderRadius: 7,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator size={30} color="#c7c7c7" animating={true} />
              <Text
                style={{
                  color: 'black',
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 15,
                  marginTop: 10,
                }}
              >
                {this.state.Location === 'Cart' ? 'Updating' : 'Adding'}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addItemToCart: product =>
      dispatch({ type: 'ADD_TO_CART', payload: product }),
    updateItemToCart: product =>
      dispatch({ type: 'UPDATE_FROM_CART', payload: product }),
    removeItemFromCart: product =>
      dispatch({ type: 'REMOVE_FROM_CART', payload: product }),
  };
};

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ItemScreen);

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
