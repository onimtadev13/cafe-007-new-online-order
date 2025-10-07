import React from 'react';
import {Platform, Text, TouchableOpacity, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import ItemView from '../Components/ItemView';

class ProductListScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      ItemList: this.props.route.params.ItemList,
      Title: this.props.route.params.Title,
    };
  }

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
      <View style={{flex: 1}}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: 'white',
            alignItems: 'center',
          }}>
          <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
            <IonicIcon
              name={'arrow-back'}
              size={25}
              color="black"
              style={{
                marginLeft: 15,
                marginRight: 15,
                marginTop: Platform.OS === 'ios' ? 30 : 20,
                marginBottom: 15,
              }}
            />
          </TouchableOpacity>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 18,
              marginTop: Platform.OS === 'ios' ? 30 : 20,
              marginBottom: 15,
            }}>
            {this.state.Title}
          </Text>
        </View>
        <FlatList
          style={{marginBottom: 10}}
          data={this.state.ItemList}
          renderItem={this.onrenderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    );
  }
}

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

export default connect(mapStateToProps, null)(ProductListScreen);
