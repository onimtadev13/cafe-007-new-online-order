import React from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  ImageBackground,
  Keyboard,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import ItemView from '../Components/ItemView';
import { APIURL } from '../Data/CloneData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import ThemeToggle from '../Components/ThemeToggle';
import { withTheme } from '../Context/ThemeContext';

const width  = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

class SearchScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fadeAnim:          new Animated.Value(0),
      slideUp:           new Animated.Value(height + 550),
      slideDown:         new Animated.Value(0),
      catlistOpacity:    new Animated.Value(1),
      searchBarWidth:    new Animated.Value(width - 90),  // ← shorter default
      Productlist:       [],
      Categorylist:      [],
      SearchList:        [],
      ItemList:          [],
      isLoading:         true,
      isTextInputPress:  false,
      isFetching:        false,
      Location:          '',
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  componentDidMount() {
    this.backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );

    this.focusSubscription = this.props.navigation.addListener('focus', async () => {
      this.fadeIn();
      this._retrieveData();
    });

    this.blurSubscription = this.props.navigation.addListener('blur', async () => {
      this.fadeOut();
    });
  }

  componentWillUnmount() {
    if (this.focusSubscription)       this.focusSubscription();
    if (this.blurSubscription)        this.blurSubscription();
    if (this.backHandlerSubscription) this.backHandlerSubscription.remove();
  }

  _retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('LOCA');
      if (value !== null) this.setState({ Location: value });
      this.setState({ isLoading: true }, () => {
        this.LoadProducts(this.state.Location);
      });
    } catch (error) {
      console.log(error);
    }
  };

  handleBackButtonClick() {
    if (this.state.isTextInputPress) {
      this.onSearchBackPress();
      return true;
    }
    return false;
  }

  fadeIn = () => {
    Animated.timing(this.state.fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };

  fadeOut = () => {
    Animated.timing(this.state.fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  };

  numberWithCommas = x => {
    let convertX = x.toString().replace(/\B(?=(\d{1000})+(?!\d))/g, ',');
    return parseFloat(convertX).toFixed(2);
  };

  onRefresh() {
    this.setState({ isFetching: true }, () => {
      this.LoadProducts(this.state.Location);
    });
  }

  onSearchBackPress = () => {
    if (this.state.isTextInputPress) {
      this.setState({ isTextInputPress: false, SearchList: [] });
      this.textinputRef.clear();
      this.textinputRef.blur();
      Keyboard.dismiss();

      // Shrink bar back
      Animated.spring(this.state.searchBarWidth, {
        toValue: width - 90,
        useNativeDriver: false,
      }).start();

      Animated.parallel([
        Animated.spring(this.state.slideUp,   { toValue: height + 550, useNativeDriver: true }),
        Animated.spring(this.state.slideDown, { toValue: 0,            useNativeDriver: true }),
      ]).start();
    }
  };

  onSerachPress = () => {
    // Expand bar to full width
    Animated.spring(this.state.searchBarWidth, {
      toValue: width - 30,
      useNativeDriver: false,
    }).start();

    Animated.parallel([
      Animated.spring(this.state.slideDown, { toValue: height + 550, useNativeDriver: true }),
      Animated.spring(this.state.slideUp,   { toValue: 0,            useNativeDriver: true }),
    ]).start(() => {
      this.setState({ isTextInputPress: true });
    });
  };

  onSearch = SearchItem => {
    if (SearchItem === '') {
      this.setState({ SearchList: [] });
    } else {
      this.setState({
        SearchList: this.state.ItemList.filter(i =>
          i.Prod_Name.toLowerCase().includes(SearchItem.toLowerCase()),
        ),
      });
    }
  };

  onCategoryPress = Category => {
    const FilterList = this.state.Productlist.filter(
      i => i.Dept_Name === Category && i.Prod_Name !== Category,
    );
    this.props.navigation.navigate('ProductListScreen', {
      ItemList: FilterList,
      Title:    Category,
    });
  };

  onrenderCategory = ({ item, index }) => {
    const { theme } = this.props;

    if (item.empty === true) {
      return <View style={{ backgroundColor: 'transparent' }} />;
    }
    return (
      <TouchableOpacity
        key={index}
        style={{
          flex: 1,
          height: 100,
          backgroundColor: theme.surface,
          margin: 5,
        }}
        onPress={() => this.onCategoryPress(item)}
      >
        <ImageBackground
          resizeMode="cover"
          source={require('../assets/category-placeholder.png')}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.1)' }]} />
          <Text
            style={{
              fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              color: theme.text,
              padding: 10,
              fontSize: 18,
              textAlign: 'center',
            }}
          >
            {item}
          </Text>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  onrenderItem = ({ item, index }) => {
    const countTypes = this.props.cartItems.filter(
      product => product.ProductName === item.Prod_Name,
    );
    let qtycount = 0;
    countTypes.forEach(element => { qtycount += element.Qty; });

    return (
      <ItemView
        key={index}
        item={item}
        navigation={this.props.navigation}
        qtycount={qtycount}
      />
    );
  };

  render() {
    const { theme } = this.props;
    const { isTextInputPress } = this.state;

    return (
      <Animated.View
        style={[
          { flex: 1, backgroundColor: theme.bg },
          { opacity: isTextInputPress ? 1 : this.state.fadeAnim },
        ]}
      >
        {/* ── Header row: search bar + ThemeToggle outside ── */}
        <View
          style={{
            flexDirection:  'row',
            alignItems:     'center',
            marginHorizontal: 15,
            marginTop:      20,
            marginBottom:   5,
          }}
        >
          {/* Animated search bar — shrinks to leave room for ThemeToggle */}
          <Animated.View
            style={{
              width:           this.state.searchBarWidth,
              flexDirection:   'row',
              alignItems:      'center',
              backgroundColor: theme.surface,
              borderRadius:    50,
            }}
          >
            <TouchableOpacity onPress={this.onSearchBackPress}>
              <FontAwesome6
                name={isTextInputPress ? 'arrow-left' : 'magnifying-glass'}
                size={22}
                color={theme.text}
                style={{ marginLeft: 18 }}
              />
            </TouchableOpacity>

            <TextInput
              ref={ref => { this.textinputRef = ref; }}
              style={{
                flex:          1,
                fontSize:      17,
                fontFamily:    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                paddingTop:    10,
                paddingBottom: 10,
                paddingLeft:   15,
                marginRight:   18,
                color:         theme.text,
              }}
              placeholder="Search delicious food"
              placeholderTextColor={theme.textMuted}
              onChangeText={text => this.onSearch(text)}
              keyboardType="default"
              onPressIn={this.onSerachPress}
            />
          </Animated.View>

          {/* ThemeToggle — always outside the search bar */}
          {!isTextInputPress && (
            <View style={{ marginLeft: 10 }}>
              <ThemeToggle />
            </View>
          )}
        </View>

        {/* ── Rest of the screen — unchanged ── */}
        <Animated.View
          style={{
            justifyContent: 'center',
            flex:           1,
            marginLeft:     15,
            marginRight:    15,
          }}
        >
          {/* Search results list — slides up into view */}
          <Animated.View
            style={[
              {
                flex:         1,
                marginBottom: 10,
                position:     isTextInputPress ? 'relative' : 'absolute',
              },
              { transform: [{ translateY: this.state.slideUp }] },
            ]}
          >
            <FlatList
              showsVerticalScrollIndicator={false}
              data={this.state.SearchList}
              renderItem={this.onrenderItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </Animated.View>

          {/* Category grid — slides down out of view during search */}
          <Animated.View
            style={[
              {
                flex:         1,
                marginBottom: 10,
                position:     isTextInputPress ? 'absolute' : 'relative',
              },
              { transform: [{ translateY: this.state.slideDown }] },
            ]}
          >
            <FlatList
              refreshing={this.state.isFetching}
              onRefresh={() => this.onRefresh()}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isLoading}
                  colors={[theme.accent]}
                  title="Refreshing"
                  titleColor={theme.textSub}
                />
              }
              showsVerticalScrollIndicator={false}
              data={this.state.Categorylist}
              style={styles.gridView}
              renderItem={this.onrenderCategory}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              ListHeaderComponent={
                <Text
                  style={{
                    fontFamily:   Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize:     22,
                    marginLeft:   15,
                    marginRight:  15,
                    marginBottom: 15,
                    color:        theme.text,
                  }}
                >
                  Categories
                </Text>
              }
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    );
  }

  LoadProducts(Loca) {
    fetch(APIURL, {
      method: 'POST',
      cache:  'no-cache',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify({
        HasReturnData: 'T',
        Parameters: [
          { Para_Data: '115', Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
          { Para_Data: Loca,  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    })
      .then(res => res.json())
      .then(json => {
        const Productlist  = [];
        const Categorylist = [];
        let Department = json.CommonResult.Table[0].Dept_Name;

        const mapItem = (element, header) => ({
          Prod_Code:     element.Prod_Code,
          Prod_Name:     header ? element.Dept_Name : element.Prod_Name,
          header,
          Dept_Name:     element.Dept_Name,
          ImagePath:     element.ImagePath,
          More_Descrip:  element.More_Descrip,
          Selling_Price: this.numberWithCommas(element.Selling_Price),
          NconvertPrice: element.Selling_Price,
          BestSeller:    element.isBestSeller,
          Offer:         element.isOffer,
          isSoldOut:     element.isSoldOut,
          isPopuler:     element.Popular,
          isDiscounted:  element.isDiscounted,
        });

        Productlist.push(mapItem(json.CommonResult.Table[0], true));

        json.CommonResult.Table.forEach(element => {
          if (Department === element.Dept_Name) {
            Productlist.push(mapItem(element, false));
          } else {
            Productlist.push(mapItem(element, true));
            Productlist.push(mapItem(element, false));
            Department = element.Dept_Name;
          }
        });

        Productlist.forEach(obj => {
          if (obj.header) Categorylist.push(obj.Prod_Name);
        });

        this.setState({
          ItemList:   Productlist.filter(i => !i.header),
          Productlist,
          Categorylist,
          isLoading:  false,
          isFetching: false,
        });
      })
      .catch(er => {
        console.log(er);
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [{ text: 'Try Again', onPress: () => this.LoadProducts(this.state.Location) }],
          { cancelable: false },
        );
      });
  }
}

const mapStateToProps = state => ({ cartItems: state });

const styles = StyleSheet.create({
  gridView: { marginTop: 10, flex: 1 },
});

export default connect(mapStateToProps, null)(withTheme(SearchScreen));