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
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useTheme } from '../Context/ThemeContext';
import { showNetworkError } from '../Utils/networkError';

const HEADER_MAX_HEIGHT = Platform.OS === 'ios' ? 320 : 340;
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
        require('../assets/banner1.jpg'),
        require('../assets/banner1.jpg'),
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
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener(
      'focus',
      async () => {
        this.fadeIn();
      },
    );
    this._unsubscribeBlur = this.props.navigation.addListener(
      'blur',
      async () => {
        this.fadeOut();
      },
    );

    this._retrieveData();
    this.LoadHeaderImage();
  }

  _retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('LOCA');
      if (value !== null) {
        this.setState({ Location: value });
      }
      this.LoadProducts(value);
    } catch (error) {
      console.log(error);
    }
  };

  componentWillUnmount() {
    if (this._unsubscribeFocus) this._unsubscribeFocus();
    if (this._unsubscribeBlur) this._unsubscribeBlur();
  }

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

  sliderUp() {
    Animated.timing(this.state.sliderUp, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }

  numberWithCommas = x => {
    let convertX = x.toString().replace(/\B(?=(\d{1000})+(?!\d))/g, ',');
    return parseFloat(convertX).toFixed(2);
  };

  singlerenderItem = ({ item, index }) => {
    const countTypes = this.props.cartItems.filter(
      product => product.ProductName === item.Prod_Name,
    );
    let qtycount = 0;
    countTypes.forEach(element => {
      qtycount += element.Qty;
    });

    if (item.header) {
      return <HeaderView key={index} item={item} />;
    }
    return (
      <ItemView
        key={index}
        item={item}
        navigation={this.props.navigation}
        qtycount={qtycount}
      />
    );
  };

  onScroll = e => {
    var pageNum = Math.floor(e.nativeEvent.contentOffset.y / 170);
    if (pageNum <= 0 || position === pageNum) return;
    position = pageNum;
    if (this.blockUpdateIndex) {
      this.blockUpdateIndex = false;
    } else {
      this.setState({
        select: this.state.Productlist[pageNum].Dept_Name,
        anchor: this.state.Productlist[pageNum].headerindex,
      });
    }
  };

  getItemLayout(data, index) {
    return { length: 170, offset: 170 * index, index };
  }

  render() {
    const { theme, isDark } = this.props;

    const keyExtractor = (item, index) => index.toString();

    // ── Scroll-driven animations ────────────────────
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

    // ── Empty list ─────────────────────────────────────────────────────────────
    const EmptyListComponent = () => (
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
            color: theme.text,
          }}
        >
          No Items are available
        </Text>
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 15,
            color: theme.textSub,
          }}
        >
          If product item available it will appear here
        </Text>
      </View>
    );

    return (
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: theme.bg },
          { opacity: this.state.fadeAnim },
        ]}
      >
        <StatusBar
          barStyle={theme.statusBar}
          backgroundColor={theme.bg}
          translucent={false}
        />

        {/* ── Tab bar ── */}
        <Animated.View style={{ opacity: listOpacity }}>
          <View style={{ height: Platform.OS === 'android' ? 50 : 60 }} />
          <Tabbar
            currentIndex={this.state.anchor}
            currentItem={this.state.select}
            sections={this.state.Productlist}
            onPressClick={(index, headerindex) => {
              this.ref.scrollToIndex({
                animated: false,
                index,
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

        {/* ── Sticky collapsing header ── */}
        <Animated.View
          style={[
            styles.header,
            { transform: [{ translateY: headerTranslateY }] },
          ]}
        >
          {/* Background image */}
          <Animated.View
            style={[
              styles.headerBackground,
              { backgroundColor: theme.bg },
              { opacity: imageOpacity },
            ]}
          >
            {this.state.isLoading ? (
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: 'rgba(0,0,0,0.3)' },
                ]}
              />
            ) : (
              <HeaderImage ImageURl={this.state.HeaderImage} />
            )}
          </Animated.View>

          {/* ── Back button row ── */}
          <Animated.View
            style={[
              { marginLeft: 30, marginTop: 20, marginRight: 20 },
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
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {/* Circle background — white in light, semi-transparent in dark */}
                <Animated.View
                  style={[
                    {
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(255,255,255,0.9)',
                    },
                    { opacity: buttonopacity },
                  ]}
                />

                {/* Icon over image — dark in light mode, white in dark mode */}
                <Animated.View
                  style={[
                    { position: 'absolute' },
                    { opacity: buttonopacity }, // ← fades with circle (over image)
                  ]}
                >
                  <FontAwesome6
                    name="chevron-left"
                    size={22}
                    color={isDark ? 'white' : 'black'} // ← correct contrast in both modes
                    solid
                  />
                </Animated.View>

                {/* Icon when header is collapsed — always uses theme.text */}
                <Animated.View
                  style={[
                    { position: 'absolute' },
                    {
                      opacity: buttonopacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0],
                      }),
                    },
                  ]}
                >
                  <FontAwesome6
                    name="chevron-left"
                    size={22}
                    color={theme.text}
                    solid
                  />
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Restaurant / category title ── */}
          <Animated.View
            style={[
              { marginLeft: 40, marginTop: 40 },
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
                  {/* Title over image */}
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

                {/* Collapsed title */}
                <Animated.Text
                  style={[
                    {
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Bold'
                          : 'AsapBold',
                      fontSize: 30,
                      position: 'absolute',
                      color: theme.text,
                    },
                    { opacity: headerTextOpacity },
                  ]}
                >
                  {this.state.Header}
                </Animated.Text>
              </>
            ) : null}
          </Animated.View>

          {/* ── Description subtitle ── */}
          <Animated.View
            style={[
              { marginLeft: 40, opacity: subheader },
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
          </Animated.View>
        </Animated.View>

        {/* ── Product list ── */}
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
              color={theme.accent}
            />
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: this.state.sliderUp }}>
            <Animated.FlatList
              overScrollMode="never"
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
            />
          </Animated.View>
        )}
      </Animated.View>
    );
  }

  // ── Data loaders ────────────────────────────────────────────
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
      .then(res => res.json())
      .then(json => {
        var Header = '',
          Description = '',
          Image = '';
        if (json.CommonResult.Table.length !== 0) {
          Header = json.CommonResult.Table[0].Header;
          Description = json.CommonResult.Table[0].Descrip;
          Image = json.CommonResult.Table[0].imageUrlMenu;
        }
        this.setState({ Header, Description, HeaderImage: Image });
      });
  }

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
      .then(res => res.json())
      .then(json => {
        const Productlist = [];
        let SelectedItem = '';

        if (json.CommonResult.Table.length !== 0) {
          SelectedItem = json.CommonResult.Table[0].Dept_Name;

          const deptMap = new Map();

          json.CommonResult.Table.forEach(element => {
            const deptName = element.Dept_Name;
            const dd =
              element.Dept_Content != null
                ? element.Dept_Content.toString().replace(/\r\n/g, ' ')
                : '';

            if (!deptMap.has(deptName)) {
              deptMap.set(deptName, {
                deptInfo: {
                  Prod_Code: element.Prod_Code,
                  Dept_Name: deptName,
                  ImagePath: element.ImagePath,
                  More_Descrip: element.More_Descrip,
                  Dept_Content: dd,
                  Selling_Price: this.numberWithCommas(element.Selling_Price),
                  NconvertPrice: element.Selling_Price,
                  BestSeller: element.isBestSeller,
                  Offer: element.isOffer,
                  isSoldOut: element.isSoldOut,
                  isDiscounted: element.isDiscounted,
                },
                products: [],
              });
            }

            // Add product to its department group
            deptMap.get(deptName).products.push({
              Prod_Code: element.Prod_Code,
              Prod_Name: element.Prod_Name,
              Dept_Name: deptName,
              ImagePath: element.ImagePath,
              More_Descrip: element.More_Descrip,
              Dept_Content: dd,
              Selling_Price: this.numberWithCommas(element.Selling_Price),
              NconvertPrice: element.Selling_Price,
              BestSeller: element.isBestSeller,
              Offer: element.isOffer,
              isSoldOut: element.isSoldOut,
              isDiscounted: element.isDiscounted,
            });
          });

          let headerIndex = 0;
          const arr = [];

          deptMap.forEach((group, deptName) => {
            // Push header
            arr.push(Productlist.length); // record index before pushing header
            Productlist.push({
              ...group.deptInfo,
              Prod_Name: deptName,
              header: true,
              headerindex: headerIndex,
            });

            // Push all products under this department
            group.products.forEach(product => {
              Productlist.push({
                ...product,
                header: false,
                headerindex: headerIndex,
              });
            });

            headerIndex += 1;
          });

          console.log(
            'Final Productlist:',
            JSON.stringify(
              Productlist.map(p => ({
                Prod_Name: p.Prod_Name,
                Dept_Name: p.Dept_Name,
                header: p.header,
                headerindex: p.headerindex,
              })),
              null,
              2,
            ),
          );

          this.setState({
            Productlist,
            stickyHeaderIndices: arr,
            select: SelectedItem,
            isLoading: false,
          });
        }
      })
      .catch(er => {
        console.log(er);
        showNetworkError(
          er,
          () => this.LoadProducts(this.state.Location),
          null,
        );
      })
      .finally(() => {
        this.sliderUp();
      });
  }
}

// ── Redux ─────────────────────────────────────────────────────────────────────
const mapStateToProps = state => ({ cartItems: state });

// ── Theme wrapper (same pattern as SearchScreen & CartScreen) ─────────────────
function HomeScreenWrapper(props) {
  const { theme, isDark, toggleTheme } = useTheme();
  return (
    <HomeScreen
      {...props}
      theme={theme}
      isDark={isDark}
      toggleTheme={toggleTheme}
    />
  );
}

export default connect(mapStateToProps, null)(HomeScreenWrapper);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
});
