import React from 'react';
import {
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { connect } from 'react-redux';
import ItemView from '../Components/ItemView';
import { withTheme } from '../Context/ThemeContext';

class ProductListScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      ItemList: this.props.route.params.ItemList,
      Title: this.props.route.params.Title,
    };
  }

  onrenderItem = ({ item, index }) => {
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
          key={index}
          item={item}
          navigation={this.props.navigation}
          qtycount={qtycount}
        />
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
            borderBottomWidth: 0.6,
            borderBottomColor: theme.separator,
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
              marginRight: 38, // balances the back button
            }}
          >
            {this.state.Title}
          </Text>
        </View>

        {/* Product list */}
        <FlatList
          data={this.state.ItemList}
          renderItem={this.onrenderItem}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 30 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <FontAwesome6
                name="bowl-food"
                size={44}
                color={theme.textMuted}
              />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: theme.textSub,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                }}
              >
                No items in this category
              </Text>
            </View>
          }
        />
      </View>
    );
  }
}

const mapStateToProps = state => ({ cartItems: state });

export default connect(mapStateToProps, null)(withTheme(ProductListScreen));
