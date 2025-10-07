import React from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Image,
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
import {FlatList} from 'react-native-gesture-handler';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import ItemView from '../Components/ItemView';
import {APIURL} from '../Data/CloneData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

class SearchScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      fadeAnim: new Animated.Value(0),
      slideUp: new Animated.Value(height + 550),
      slideDown: new Animated.Value(0),
      catlistOpacity: new Animated.Value(1),
      Productlist: [],
      Categorylist: [],
      SearchList: [],
      ItemList: [],
      isLoading: true,
      isTextInputPress: false,
      isFetching: false,
      Location: '',
    };
    this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
  }

  componentDidMount() {
    //Store the subscription
    this.backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );

    //Store both navigation subscriptions separately
    this.focusSubscription = this.props.navigation.addListener('focus', async () => {
      this.fadeIn();
      this._retrieveData();
    });

    this.blurSubscription = this.props.navigation.addListener('blur', async () => {
      this.fadeOut();
    });
  }
  _retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('LOCA');
      if (value !== null) {
        // We have data!!
        this.setState({Location: value});
      }
      this.setState({isLoading: true}, () => {
        this.LoadProducts(this.state.Location);
      });
    } catch (error) {
      console.log(error);
    }
  };

  componentWillUnmount() {
    //Clean up navigation subscriptions
    if (this.focusSubscription) {
      this.focusSubscription();
    }
    if (this.blurSubscription) {
      this.blurSubscription();
    }
    
    //Use subscription.remove() instead of removeEventListener
    if (this.backHandlerSubscription) {
      this.backHandlerSubscription.remove();
    }
  }

  handleBackButtonClick() {
    var Type;
    if (this.state.isTextInputPress) {
      Type = true;
      this.setState({isTextInputPress: false, SearchList: []});
      this.textinputRef.clear();
      this.textinputRef.blur();
      Animated.parallel([
        Animated.spring(this.state.slideUp, {
          toValue: height + 550,
          useNativeDriver: true,
        }),
        Animated.spring(this.state.slideDown, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Type = false;
    }
    return Type;
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

  numberWithCommas = x => {
    let convertX = x.toString().replace(/\B(?=(\d{1000})+(?!\d))/g, ',');
    let xFloat = parseFloat(convertX).toFixed(2);
    return xFloat;
  };

  onRefresh() {
    this.setState({isFetching: true}, () => {
      this.LoadProducts(this.state.Location);
    });
  }

  onSearchBackPress = () => {
    if (this.state.isTextInputPress) {
      this.setState({isTextInputPress: false, SearchList: []});
      this.textinputRef.clear();
      this.textinputRef.blur();
      Keyboard.dismiss();
      Animated.parallel([
        Animated.spring(this.state.slideUp, {
          toValue: height + 550,
          useNativeDriver: true,
        }),
        Animated.spring(this.state.slideDown, {
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  onSerachPress = () => {
    Animated.parallel([
      Animated.spring(this.state.slideDown, {
        toValue: height + 550,
        useNativeDriver: true,
      }),
      Animated.spring(this.state.slideUp, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      this.setState({isTextInputPress: true});
    });
  };

  onSearch = SearchItem => {
    if (SearchItem === '') {
      this.setState({SearchList: []});
    } else {
      this.setState({
        SearchList: this.state.ItemList.filter(i =>
          i.Prod_Name.toLowerCase().includes(SearchItem.toLowerCase()),
        ),
      });
    }
  };

  formatData = (data, numColumns) => {
    const numberOfFullRows = Math.floor(data.length / numColumns);

    let numberOfElementsLastRow = data.length - numberOfFullRows * numColumns;
    while (
      numberOfElementsLastRow !== numColumns &&
      numberOfElementsLastRow !== 0
    ) {
      data.push({key: `blank-${numberOfElementsLastRow}`, empty: true}); 
      numberOfElementsLastRow = numberOfElementsLastRow + 1;
    }

    return data;
  };

  onCategoryPress = Category => {
    const FilterList = this.state.Productlist.filter(
      i => i.Dept_Name === Category && i.Prod_Name !== Category,
    );
    this.props.navigation.navigate('ProductListScreen', {
      ItemList: FilterList,
      Title: Category,
    });
  };

  onrenderCategory = ({item, index}) => {
    if (item.empty === true) {
      return <View style={{backgroundColor: 'transparent'}} />;
    }
    return (
      <TouchableOpacity
        key={index}
        style={{
          flex: 1,
          height: 100,
          backgroundColor: '#f0f0f0',
          margin: 5,
        }}
        onPress={() => this.onCategoryPress(item)}>
        <ImageBackground
          resizeMode="cover"
          source={require('../assets/category-placeholder.png')}
          style={[{flex: 1, justifyContent: 'center'}]}>
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {backgroundColor: 'rgba(0,0,0,0.1)'},
            ]}
          />
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              color: 'black',
              padding: 10,
              fontSize: 18,
              textAlign: 'center',
            }}>
            {item}
          </Text>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  onrenderItem = ({item, index}) => {
    const countTypes = this.props.cartItems.filter(
      product => product.ProductName === item.Prod_Name,
    );
    let qtycount = 0;
    countTypes.forEach(element => {
      qtycount = qtycount + element.Qty;
    });
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
    return (
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: '#F0F0F0',
          },
          {opacity: this.state.isTextInputPress ? 1 : this.state.fadeAnim},
        ]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#e0e0e0',
            borderRadius: 50,
            margin: 15,
            marginTop: 20,
          }}>
          <TouchableOpacity onPress={() => this.onSearchBackPress()}>
            <IonicIcon
              name={this.state.isTextInputPress ? 'arrow-back' : 'search'}
              size={25}
              color="black"
              style={{marginLeft: 20}}
            />
          </TouchableOpacity>
          <TextInput
            ref={ref => {
              this.textinputRef = ref;
            }}
            style={{
              flex: 1,
              fontSize: 17,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 15,
              marginRight: 20,
              color: 'black',
            }}
            placeholder={'Search delicious food'}
            placeholderTextColor={'black'}
            onChangeText={text => this.onSearch(text)}
            keyboardType={'default'}
            onPressIn={() => {
              this.onSerachPress();
            }}
          />
        </View>

        {/* {this.state.isTextInputPress ?
                    null :
                    (
                        <Text style={{ fontFamily: 'AsapBold', fontSize: 22, margin: 15 }}>Categories</Text>
                    )} */}

        <Animated.View
          style={[
            {
              justifyContent: 'center',
              flex: 1,
              marginLeft: 15,
              marginRight: 15,
            },
          ]}>
          {/* {this.state.isTextInputPress ? ( */}
          <Animated.View
            style={[
              {
                flex: 1,
                marginBottom: 10,
                position: this.state.isTextInputPress ? 'relative' : 'absolute',
              },
              {transform: [{translateY: this.state.slideUp}]},
            ]}>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={this.state.SearchList}
              renderItem={this.onrenderItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </Animated.View>
          {/* )
                        :
                        ( */}
          <Animated.View
            style={[
              {
                flex: 1,
                marginBottom: 10,
                position: this.state.isTextInputPress ? 'absolute' : 'relative',
              },
              {transform: [{translateY: this.state.slideDown}]},
            ]}>
            <FlatList
              refreshing={this.state.isFetching}
              onRefresh={() => this.onRefresh()}
              refreshControl={
                <RefreshControl
                  refreshing={this.state.isLoading}
                  colors={['red', 'green', 'blue']}
                  title={'Refreshing'}
                  titleColor={'black'}
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
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                    fontSize: 22,
                    marginLeft: 15,
                    marginRight: 15,
                    marginBottom: 15,
                  }}>
                  Categories
                </Text>
              }
            />
          </Animated.View>
          {/* )} */}
        </Animated.View>
      </Animated.View>
    );
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
        const Productlist = [];
        var Categorylist = [];
        var Department = json.CommonResult.Table[0].Dept_Name;
        Productlist.push({
          Prod_Code: json.CommonResult.Table[0].Prod_Code,
          Prod_Name: Department,
          header: true,
          Dept_Name: Department,
          ImagePath: json.CommonResult.Table[0].ImagePath,
          More_Descrip: json.CommonResult.Table[0].More_Descrip,
          Selling_Price: this.numberWithCommas(
            json.CommonResult.Table[0].Selling_Price,
          ),
          NconvertPrice: json.CommonResult.Table[0].Selling_Price,
          BestSeller: json.CommonResult.Table[0].isBestSeller,
          Offer: json.CommonResult.Table[0].isOffer,
          isSoldOut: json.CommonResult.Table[0].isSoldOut,
        });

        json.CommonResult.Table.forEach(element => {
          if (Department == element.Dept_Name) {
            Productlist.push({
              Prod_Code: element.Prod_Code,
              Prod_Name: element.Prod_Name,
              header: false,
              Dept_Name: element.Dept_Name,
              ImagePath: element.ImagePath,
              More_Descrip: element.More_Descrip,
              Selling_Price: this.numberWithCommas(element.Selling_Price),
              NconvertPrice: element.Selling_Price,
              BestSeller: element.isBestSeller,
              Offer: element.isOffer,
              isSoldOut: element.isSoldOut,
            });
          } else {
            Productlist.push({
              Prod_Code: element.Prod_Code,
              Prod_Name: element.Dept_Name,
              header: true,
              Dept_Name: element.Dept_Name,
              ImagePath: element.ImagePath,
              More_Descrip: element.More_Descrip,
              Selling_Price: this.numberWithCommas(element.Selling_Price),
              NconvertPrice: element.Selling_Price,
              BestSeller: element.isBestSeller,
              Offer: element.isOffer,
              isSoldOut: element.isSoldOut,
            });
            Productlist.push({
              Prod_Code: element.Prod_Code,
              Prod_Name: element.Prod_Name,
              header: false,
              Dept_Name: element.Dept_Name,
              ImagePath: element.ImagePath,
              More_Descrip: element.More_Descrip,
              Selling_Price: this.numberWithCommas(element.Selling_Price),
              NconvertPrice: element.Selling_Price,
              BestSeller: element.isBestSeller,
              Offer: element.isOffer,
              isSoldOut: element.isSoldOut,
            });
            Department = element.Dept_Name;
          }
        });

        Productlist.forEach(obj => {
          if (obj.header) {
            Categorylist.push(obj.Prod_Name);
          }
        });

        this.setState({
          ItemList: Productlist.filter(i => i.header === false),
          Productlist: Productlist,
          Categorylist: Categorylist,
          isLoading: false,
          isFetching: false,
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
          {cancelable: false},
        );
      });
  }
}

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

const styles = StyleSheet.create({
  gridView: {
    marginTop: 10,
    flex: 1,
  },
  itemContainer: {
    justifyContent: 'flex-end',
    borderRadius: 5,
    padding: 10,
    height: 150,
  },
  itemName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  itemCode: {
    fontWeight: '600',
    fontSize: 12,
    color: '#fff',
  },
});

export default connect(mapStateToProps, null)(SearchScreen);
