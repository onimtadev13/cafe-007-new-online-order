import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { APIURL } from '../Data/CloneData';
import { connect } from 'react-redux';
import Tabbar from '../Components/Tabbar';
import HeaderView from '../Components/HeaderView';
import ItemView from '../Components/ItemView';
import HeaderImage from '../Components/HeaderImage';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const HEADER_MAX_HEIGHT = Platform.OS == 'ios' ? 320 : 340;
const HEADER_MIN_HEIGHT = 45;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const height = Dimensions.get('window').height;
var position = 0;

class HomeScreen extends React.PureComponent {
  blockUpdateIndex = false;

  constructor(props) {
    super(props);
    this.state = {
      images: [
        // "https://source.unsplash.com/1024x768/?nature",
        // "https://source.unsplash.com/1024x768/?water",
        // "https://source.unsplash.com/1024x768/?girl",
        // "https://source.unsplash.com/1024x768/?tree", // Network image
        require('../assets/banner1.jpg'),
        require('../assets/banner1.jpg'), // Local image
      ],
      fadeAnim: new Animated.Value(0),
      scrollY: new Animated.Value(0),
      Productlist: [],
      DepartmentList: [],
      stickyHeaderIndices: [],
      isLoading: true,
      pageNum: new Animated.Value(0),
      select: '',
      Padding: 80,
      anchor: 0,
      isClick: false,
      width: 0,
      sliderUp: new Animated.Value(0),
      isEnableScroll: false,
      Header: '',
      Description: '',
      HeaderImage: '',
      Location: '',
    };
    // this.handleViewableItemsChanged = this.handleViewableItemsChanged.bind(this)
    // this.viewabilityConfig = {
    //     minimumViewTime: 10,
    //     waitForInteraction: true,
    //     itemVisiblePercentThreshold: 10
    // }
  }

  componentDidMount() {
    this._unsubscribe = this.props.navigation.addListener('focus', async () => {
      this.fadeIn();
    });

    this._unsubscribe = this.props.navigation.addListener('blur', async () => {
      this.fadeOut();
    });

    this._retrieveData();

    this.LoadHeaderImage();
  }

  _retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('LOCA');
      if (value !== null) {
        // We have data!!
        this.setState({ Location: value });
      }

      console.log('lOADING PRODUCTS');
      this.LoadProducts(value);
    } catch (error) {
      console.log(error);
    }
  };

  componentWillUnmount() {
    this._unsubscribe();
  }

  fadeIn = () => {
    // Will change fadeAnim value to 1 in 5 seconds
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 600,
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

  sliderUp() {
    // Will change sliderUp value to 0 in 3 seconds
    Animated.timing(this.state.sliderUp, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }

  numberWithCommas = x => {
    let convertX = x.toString().replace(/\B(?=(\d{1000})+(?!\d))/g, ',');
    let xFloat = parseFloat(convertX).toFixed(2);
    return xFloat;
  };

  singlerenderItem = ({ item, index }) => {
    const countTypes = this.props.cartItems.filter(
      product => product.ProductName === item.Prod_Name,
    );
    let qtycount = 0;
    countTypes.forEach(element => {
      qtycount = qtycount + element.Qty;
    });

    if (item.header) {
      return <HeaderView key={index} item={item} />;
    } else if (!item.header) {
      return (
        <ItemView
          key={index}
          item={item}
          navigation={this.props.navigation}
          qtycount={qtycount}
        />
      );
    }
  };

  onScroll = e => {
    var pageNum = Math.floor(e.nativeEvent.contentOffset.y / 170);

    if (pageNum <= 0 || position === pageNum) {
    } else {
      position = pageNum;
      if (this.blockUpdateIndex) {
        this.blockUpdateIndex = false;
      } else {
        this.setState({
          select: this.state.Productlist[pageNum].Dept_Name,
          anchor: this.state.Productlist[pageNum].headerindex,
        });
      }
    }
  };

  getItemLayout(data, index) {
    return { length: 170, offset: 170 * index, index };
  }

  // handleViewableItemsChanged(info) {
  //     if (position === info.changed[0].index) {

  //     } else {
  //         position = info.changed[0].index;
  //         if (this.blockUpdateIndex) {
  //             this.blockUpdateIndex = false;
  //             this.setState({ select: this.state.Productlist[info.changed[0].index].Dept_Name });
  //         } else {
  //             this.setState({ select: this.state.Productlist[info.changed[0].index].Dept_Name, anchor: this.state.Productlist[info.changed[0].index].headerindex });
  //         }
  //     }
  // }

  render() {
    const keyExtractor = (item, index) => index.toString();

    const headerTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, -100, -150],
      extrapolate: 'clamp',
    });

    const titleTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 40, Platform.OS === 'android' ? 74 : 103],
      extrapolate: 'clamp',
    });

    const titleTranslateX = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, -10, -10],
      extrapolate: 'clamp',
    });

    const titleScale = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 0.7, 0.7],
      extrapolate: 'clamp',
    });

    const buttonTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 100, Platform.OS === 'android' ? 134 : 150],
      extrapolate: 'clamp',
    });

    const buttonTranslateX = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, -5, -10],
      extrapolate: 'clamp',
    });

    const buttonopacity = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [1, 0.2, 0],
      extrapolate: 'clamp',
    });

    const headerTextOpacity = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      outputRange: [0, 0.2, 1],
      extrapolate: 'clamp',
    });

    const subheader = this.state.scrollY.interpolate({
      inputRange: [0, 40],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const imageOpacity = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE, HEADER_SCROLL_DISTANCE + 5],
      outputRange: [1, 0, 0],
      extrapolate: 'clamp',
    });

    const listOpacity = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE, HEADER_SCROLL_DISTANCE + 5],
      outputRange: [0, 0, 1],
      extrapolate: 'clamp',
    });

    const listTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, HEADER_SCROLL_DISTANCE],
      outputRange: [Platform.OS === 'android' ? 95 : 75, 0],
      extrapolate: 'clamp',
    });

    const EmptyListComponent = () => {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '50%',
          }}
        >
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 20,
            }}
          >
            No Items are available
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 15,
            }}
          >
            If product item available it will appear here
          </Text>
        </View>
      );
    };

    // const prepareSections = this.state.Productlist.map((item, index) => ({ ...item, index }));

    return (
      <Animated.View
        style={[
          styles.container,
          {
            // Bind opacity to animated value
            opacity: this.state.fadeAnim,
          },
        ]}
      >
        <Animated.View style={[{ opacity: listOpacity }]}>
          <View style={{ height: Platform.OS === 'android' ? 50 : 60 }} />
          <Tabbar
            currentIndex={this.state.anchor}
            currentItem={this.state.select}
            sections={this.state.Productlist}
            onPressClick={(index, headerindex) => {
              this.ref.scrollToIndex({
                animated: false,
                index: index,
                viewOffset: -1,
              });
              this.setState({
                select: this.state.Productlist[index].Dept_Name,
                anchor: headerindex,
              });
              this.blockUpdateIndex = true;
            }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.header,
            { transform: [{ translateY: headerTranslateY }] },
          ]}
        >
          <Animated.View
            style={[styles.headerBackground, { opacity: imageOpacity }]}
          >
            {this.state.isLoading ? (
              <>
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: 'rgba(0,0,0,0.3)' },
                  ]}
                />
              </>
            ) : (
              <>
                <HeaderImage ImageURl={this.state.HeaderImage} />
              </>
            )}
          </Animated.View>

          <Animated.View
            style={[
              {
                marginLeft: 30,
                marginTop: 20,
                marginRight: 30,
              },
              {
                transform: [
                  { translateY: buttonTranslateY },
                  { translateX: buttonTranslateX },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={{ width: 40 }}
              onPress={() => this.props.navigation.goBack()}
            >
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Animated.View
                  style={[
                    {
                      width: 40,
                      height: 40,
                      borderRadius: 40 / 2,
                      backgroundColor: 'white',
                    },
                    { opacity: buttonopacity },
                  ]}
                />
                {/* <IonicIcon
                  name="chevron-back-outline"
                  size={30}
                  style={{position: 'absolute'}}
                /> */}
                <FontAwesome6
                  name="chevron-left"
                  size={30}
                  style={{ position: 'absolute' }}
                  solid
                />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              {
                marginLeft: 40,
                marginTop: 40,
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
            {this.state.Header !== null && this.state.Header !== '' ? (
              <>
                <View style={{ flexDirection: 'row', alignContent: 'center' }}>
                  <Text
                    style={{
                      color: 'white',
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      fontSize: 30,
                    }}
                  >
                    {this.state.Header}
                  </Text>
                  <ActivityIndicator
                    animating={this.state.isLoading}
                    size="small"
                    color="white"
                    style={{ marginLeft: 15, marginTop: 10 }}
                  />
                </View>

                <Animated.Text
                  style={[
                    {
                      color: 'black',
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      fontSize: 30,
                      position: 'absolute',
                    },
                    { opacity: headerTextOpacity },
                  ]}
                >
                  {this.state.Header}
                </Animated.Text>
              </>
            ) : null}
          </Animated.View>

          <Animated.View
            style={[
              {
                marginLeft: 40,
                opacity: subheader,
              },
              {
                transform: [
                  { translateX: titleTranslateX },
                  { translateY: titleTranslateY },
                ],
              },
            ]}
          >
            <Text
              style={{
                width:
                  (this.state.Header === null) | (this.state.Header === '')
                    ? '50%'
                    : '60%',
                color: 'white',
              }}
            >
              {this.state.Description}
            </Text>
            {/* <Text style={{ color: 'white' }}>Live, love, eat.</Text> */}
          </Animated.View>
        </Animated.View>

        {this.state.isLoading ? (
          <Animated.View
            style={[
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
              },
              { opacity: this.state.fadeAnim },
            ]}
          >
            <ActivityIndicator
              animating={this.state.isLoading}
              size="large"
              color="black"
            />
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: this.state.sliderUp }}>
            <Animated.FlatList
              // scrollEnabled={this.state.isEnableScroll}
              overScrollMode={'never'}
              style={[
                { transform: [{ translateY: listTranslateY }] },
                { marginBottom: 120 },
              ]}
              scrollEventThrottle={16}
              ref={r => (this.ref = r)}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
                {
                  useNativeDriver: true,
                  listener: event => this.onScroll(event),
                },
              )}
              data={this.state.Productlist}
              renderItem={this.singlerenderItem}
              keyExtractor={keyExtractor}
              stickyHeaderIndices={this.state.stickyHeaderIndices}
              getItemLayout={this.getItemLayout.bind(this)}
              initialNumToRender={10}
              maxToRenderPerBatch={5}
              windowSize={2}
              removeClippedSubviews={true}
              updateCellsBatchingPeriod={8}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={EmptyListComponent}
              // onViewableItemsChanged={this.handleViewableItemsChanged}
              // viewabilityConfig={this.viewabilityConfig}
            />
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  LoadHeaderImage() {
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
            Para_Data: '108',
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
        var Header = '';
        var Description = '';
        var Image = '';

        if (json.CommonResult.Table.length !== 0) {
          Header = json.CommonResult.Table[0].Header;
          Description = json.CommonResult.Table[0].Descrip;
          Image = json.CommonResult.Table[0].imageUrlMenu;
        } else {
        }

        this.setState({
          Header: Header,
          Description: Description,
          HeaderImage: Image,
        });
      });
  }

  /**
   * author shivanka dilshan
   * Loading product data location wice old iid was 75 new iid is 115
   * */
  LoadProducts(Loca) {
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
            Para_Data: '115',
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
        const DepaertmentList = [];
        const Productlist = [];
        var SelectedItem = '';

        if (json.CommonResult.Table.length !== 0) {
          var dd = '';
          var i = 0;
          var Department = json.CommonResult.Table[0].Dept_Name;
          SelectedItem = json.CommonResult.Table[0].Dept_Name;
          Productlist.push({
            Prod_Code: json.CommonResult.Table[0].Prod_Code,
            Prod_Name: Department,
            header: true,
            Dept_Name: Department,
            ImagePath: json.CommonResult.Table[0].ImagePath,
            More_Descrip: json.CommonResult.Table[0].More_Descrip,
            Dept_Content:
              json.CommonResult.Table[0].Dept_Content.toString().replace(
                /\r\n/g,
                ' ',
              ),
            Selling_Price: this.numberWithCommas(
              json.CommonResult.Table[0].Selling_Price,
            ),
            headerindex: i,
            NconvertPrice: json.CommonResult.Table[0].Selling_Price,
            BestSeller: json.CommonResult.Table[0].isBestSeller,
            Offer: json.CommonResult.Table[0].isOffer,
            isSoldOut: json.CommonResult.Table[0].isSoldOut,
            isDiscounted: json.CommonResult.Table[0].isDiscounted,
          });

          json.CommonResult.Table.forEach(element => {
            if (element.Dept_Content != null) {
              dd = element.Dept_Content.toString().replace(/\r\n/g, ' ');
            } else {
              dd = '';
            }

            if (Department == element.Dept_Name) {
              Productlist.push({
                Prod_Code: element.Prod_Code,
                Prod_Name: element.Prod_Name,
                header: false,
                Dept_Name: element.Dept_Name,
                ImagePath: element.ImagePath,
                More_Descrip: element.More_Descrip,
                Dept_Content: dd,
                Selling_Price: this.numberWithCommas(element.Selling_Price),
                headerindex: i,
                NconvertPrice: element.Selling_Price,
                BestSeller: element.isBestSeller,
                Offer: element.isOffer,
                isSoldOut: element.isSoldOut,
                isDiscounted: element.isDiscounted,
              });
            } else {
              i = i + 1;
              Productlist.push({
                Prod_Code: element.Prod_Code,
                Prod_Name: element.Dept_Name,
                header: true,
                Dept_Name: element.Dept_Name,
                ImagePath: element.ImagePath,
                More_Descrip: element.More_Descrip,
                Dept_Content: dd,
                Selling_Price: this.numberWithCommas(element.Selling_Price),
                headerindex: i,
                NconvertPrice: element.Selling_Price,
                BestSeller: element.isBestSeller,
                Offer: element.isOffer,
                isSoldOut: element.isSoldOut,
                isDiscounted: element.isDiscounted,
              });
              Productlist.push({
                Prod_Code: element.Prod_Code,
                Prod_Name: element.Prod_Name,
                header: false,
                Dept_Name: element.Dept_Name,
                ImagePath: element.ImagePath,
                More_Descrip: element.More_Descrip,
                Dept_Content: dd,
                Selling_Price: this.numberWithCommas(element.Selling_Price),
                headerindex: i,
                NconvertPrice: element.Selling_Price,
                BestSeller: element.isBestSeller,
                Offer: element.isOffer,
                isSoldOut: element.isSoldOut,
                isDiscounted: element.isDiscounted,
              });
              Department = element.Dept_Name;
            }
          });

          // var lsit = [];
          // var Mainlist = [];
          // var Dep = json.CommonResult.Table[0].Dept_Name;
          // json.CommonResult.Table.forEach(element => {
          //     if (Dep === element.Dept_Name) {
          //         lsit.push({ Prod_Code: element.Prod_Code, Prod_Name: element.Prod_Name, header: false, Dept_Name: element.Dept_Name, ImagePath: element.ImagePath, More_Descrip: element.More_Descrip, Selling_Price: element.Selling_Price })
          //     } else {
          //         Mainlist.push({ title: Dep, data: lsit });
          //         Dep = element.Dept_Name;
          //         lsit = [];
          //         lsit.push({ Prod_Code: element.Prod_Code, Prod_Name: element.Prod_Name, header: false, Dept_Name: element.Dept_Name, ImagePath: element.ImagePath, More_Descrip: element.More_Descrip, Selling_Price: element.Selling_Price })
          //     }
          // });

          var arr = [];
          Productlist.forEach(obj => {
            if (obj.header) {
              arr.push(Productlist.indexOf(obj));
            }
          });
          // arr.push(0);
        }

        this.setState({
          Productlist: Productlist,
          stickyHeaderIndices: arr,
          select: SelectedItem,
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
        this.sliderUp();
      });
  }
}

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

export default connect(mapStateToProps, null)(HomeScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    height: Platform.OS === 'android' ? 200 : 220,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: null,
    height: 200,
    backgroundColor: '#F0F0F0',
  },
});
