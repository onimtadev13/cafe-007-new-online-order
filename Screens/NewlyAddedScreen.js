import React from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import LottieView from 'lottie-react-native';
import { APIURL } from '../Data/CloneData';
import ItemView from '../Components/ItemView';

const { width } = Dimensions.get('window');

class NewlyAddedScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      productList: [],
      isLoading: true,
      Location: '',
    };
  }

  async componentDidMount() {
    const location = await AsyncStorage.getItem('LOCA');
    this.setState({ Location: location || '' }, () => {
      this.LoadProducts(location);
    });
  }

  numberWithCommas = x => {
    let convertX = x.toString().replace(/\B(?=(\d{1000})+(?!\d))/g, ',');
    let xFloat = parseFloat(convertX).toFixed(2);
    return xFloat;
  };

  LoadProducts(Loca) {
    this.setState({ isLoading: true });
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
            Para_Data: '132',
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
        const productList = [];
        for (let i = 0; i < json.CommonResult.Table.length; i++) {
          productList.push({
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
            isPopuler: json.CommonResult.Table[i].isPopuler,
            isDiscounted: json.CommonResult.Table[i].isDiscounted,
          });
        }
        this.setState({ productList, isLoading: false });
      })
      .catch(() => {
        this.setState({ isLoading: false });
        Alert.alert(
          'Warning',
          "The operation couldn't be completed.",
          [{ text: 'Try Again', onPress: () => this.LoadProducts(this.state.Location) }],
          { cancelable: false },
        );
      });
  }

  renderItem = ({ item, index }) => {
    const countTypes = this.props.cartItems.filter(
      product => product.ProductName === item.Prod_Name,
    );
    let qtycount = 0;
    countTypes.forEach(element => {
      qtycount = qtycount + element.Qty;
    });

    return (
      <View
        style={{
          marginHorizontal: 15,
          marginBottom: 12,
          backgroundColor: 'white',
          borderRadius: 16,
          overflow: 'hidden',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
        }}
      >
        <ItemView
          item={item}
          navigation={this.props.navigation}
          qtycount={qtycount}
        />
        {item.isSoldOut ? (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: 'red',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 12,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              }}
            >
              Sold Out
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

//   renderHeader = () => (
//     <View
//       style={{
//         alignItems: 'center',
//         paddingVertical: 20,
//         paddingHorizontal: 20,
//       }}
//     >
//       <View
//         style={{
//           width: 80,
//           height: 80,
//           borderRadius: 20,
//           backgroundColor: 'white',
//           justifyContent: 'center',
//           alignItems: 'center',
//           elevation: 6,
//           shadowColor: '#000',
//           shadowOffset: { width: 0, height: 2 },
//           shadowOpacity: 0.1,
//           shadowRadius: 4,
//           marginBottom: 10,
//         }}
//       >
//         <LottieView
//           source={require('../assets/lottiejson/new-arrivals.json')}
//           autoPlay
//           loop
//           style={{ width: 52, height: 52 }}
//         />
//       </View>
//       <Text
//         style={{
//           fontFamily:
//             Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
//           fontSize: 14,
//           color: '#5C5C5C',
//           textAlign: 'center',
//           marginTop: 4,
//         }}
//       >
//         Fresh additions to our menu
//       </Text>
//       <View
//         style={{
//           height: 0.9,
//           width: '100%',
//           backgroundColor: '#5C5C5C',
//           marginTop: 20,
//         }}
//       />
//     </View>
//   );

  renderEmpty = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
      <Text
        style={{
          fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
          fontSize: 16,
          color: '#5C5C5C',
        }}
      >
        No new items available
      </Text>
    </View>
  );

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#F0F0F0' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F0F0" />

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 54 : 16,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: '#F0F0F0',
          }}
        >
          <TouchableOpacity
            onPress={() => this.props.navigation.goBack()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'white',
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 3,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.12,
              shadowRadius: 3,
            }}
          >
            <FontAwesome6 name="arrow-left" size={16} color="#1a1a1a" />
          </TouchableOpacity>

          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 20,
              color: '#1a1a1a',
              marginRight: 38,
            }}
          >
            Newly Added
          </Text>
        </View>

        {/* Content */}
        {this.state.isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#1a1a1a" />
          </View>
        ) : (
          <FlatList
            data={this.state.productList}
            renderItem={this.renderItem}
            keyExtractor={(item, index) => index.toString()}
            ListHeaderComponent={this.renderHeader}
            ListEmptyComponent={this.renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </View>
    );
  }
}

const mapStateToProps = state => ({ cartItems: state });
const mapDispatchToProps = dispatch => ({
  addItemToCart: product => dispatch({ type: 'ADD_TO_CART', payload: product }),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewlyAddedScreen);