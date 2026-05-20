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
import { APIURL } from '../Data/CloneData';
import ItemView from '../Components/ItemView';
import { withTheme } from '../Context/ThemeContext';
import { showNetworkError } from '../Utils/networkError';

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
      .catch(er => {
        this.setState({ isLoading: false });
        showNetworkError(
          er,
          () => this.LoadProducts(this.state.Location),
          null,
        );
      });
  }

  renderItem = ({ item }) => {
    const { theme } = this.props;

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
          backgroundColor: theme.card,
          borderRadius: 16,
          overflow: 'hidden',
          elevation: 4,
          shadowColor: theme.shadow.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.shadow.shadowOpacity,
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

  renderEmpty = () => {
    const { theme } = this.props;
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 80,
        }}
      >
        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 16,
            color: theme.textSub,
          }}
        >
          No new items available
        </Text>
      </View>
    );
  };

  render() {
    const { theme } = this.props;

    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <StatusBar
          barStyle={theme.statusBar}
          backgroundColor={theme.bg}
          translucent={false}
        />

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: Platform.OS === 'ios' ? 54 : 16,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: theme.bg,
          }}
        >
          <TouchableOpacity
            onPress={() => this.props.navigation.goBack()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: theme.card,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 3,
              shadowColor: theme.shadow.shadowColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: theme.shadow.shadowOpacity,
              shadowRadius: 3,
            }}
          >
            <FontAwesome6 name="arrow-left" size={16} color={theme.text} />
          </TouchableOpacity>

          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 20,
              color: theme.text,
              marginRight: 38,
            }}
          >
            Newly Added
          </Text>
        </View>

        {/* Content */}
        {this.state.isLoading ? (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : (
          <FlatList
            data={this.state.productList}
            renderItem={this.renderItem}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={this.renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30, paddingTop: 8 }}
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

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTheme(NewlyAddedScreen));
