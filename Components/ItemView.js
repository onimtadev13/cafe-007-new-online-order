import React from 'react';
import {
  ImageBackground,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import FoodQtyLabel from '../Components/Food&QtyLabel';
import RatingStarIcon from '../Components/RatingStarIcon';

export default class ItemView extends React.PureComponent {
  render() {
    const { item, navigation, qtycount } = this.props;

    return (
      <TouchableOpacity
        disabled={item.isSoldOut ? true : false}
        onPress={() =>
          navigation.navigate('ItemScreen', {
            Location: 'Home',
            PCode: item.Prod_Code,
            PName: item.Prod_Name,
            PDescription: item.More_Descrip,
            PPrice: item.NconvertPrice,
            IMG: item.ImagePath,
            isDiscounted: item.isDiscounted,
          })
        }
      >
        <View style={{ width: '100%', height: 170 }}>
          <View style={{ flex: 1, flexDirection: 'row', margin: 10 }}>
            <View
              style={{
                width: 160,
                height: 160,
                backgroundColor: 'white',
                borderRadius: 10,
              }}
            >
              <FastImage
                source={
                  item.ImagePath === ''
                    ? require('../assets/image-placeholder.png')
                    : {
                        uri: item.ImagePath,
                        priority: FastImage.priority.normal,
                      }
                }
                style={{ width: 150, height: 150, margin: 5 }}
                resizeMode={FastImage.resizeMode.cover}
              />

              <FoodQtyLabel
                isBestseller={item.BestSeller}
                isOffer={item.Offer}
                qty={qtycount}
              />
            </View>

            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                marginTop: 20,
                marginBottom: 10,
                marginLeft: 10,
                marginRight: 10,
              }}
            >
              <Text
                numberOfLines={2}
                style={{
                  fontSize: 18,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                }}
              >
                {item.Prod_Name}
              </Text>
              {/* <Text numberOfLines={1} style={{ textTransform: 'lowercase', marginBottom: 5, color: '#5C5C5C', fontSize: 14, fontFamily: "AsapRegular" }}>@{item.Prod_Name}</Text> */}
              <RatingStarIcon rate={4.7} isSoldOut={item.isSoldOut} />
              <Text
                numberOfLines={2}
                style={{
                  marginRight: 8,
                  fontSize: 15,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                }}
              >
                {item.More_Descrip}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={{
                    flex: 1,
                    color: '#FF6900',
                    fontSize: 18,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                  }}
                >
                  LKR {item.Selling_Price}
                </Text>
                {item.isDiscounted && (
                  <Text
                    style={{
                      backgroundColor: '#194dadd3',
                      color: 'white',
                      fontSize: 12,
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
                {/* <NumericFormat
                                value={item.Selling_Price}
                                displayType={'text'}
                                thousandSeparator={true}
                                fixedDecimalScale={true}
                                decimalScale={2}
                                prefix={'LKR '}
                                renderText={formattedValue => <Text style={{ flex: 1, color: '#FF6900', fontSize: 18, fontFamily: "AsapMedium" }}>{formattedValue}</Text>} // <--- Don't forget this!
                            /> */}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}
