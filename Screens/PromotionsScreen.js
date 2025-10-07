import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import {APIURL} from '../Data/CloneData';
import FastImage from 'react-native-fast-image';

const PromotionsScreen = ({navigation}) => {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 Animated value for scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_SCROLL_DISTANCE = 150;

  // 🔹 Interpolations
  const buttonScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1, 0.9],
    extrapolate: 'clamp',
  });

  const buttonTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -15, -15],
    extrapolate: 'clamp',
  });

  //Fetch promotions
  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = () => {
    fetch(APIURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        HasReturnData: 'T',
        Parameters: [
          {
            Para_Data: '123',
            Para_Direction: 'Input',
            Para_Lenth: 30,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: '',
            Para_Direction: 'Input',
            Para_Lenth: 5000,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: '',
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text2',
            Para_Type: 'varchar',
          },
        ],
        SpName: 'sp_Android_Common_API',
        con: '1',
      }),
    })
      .then(res => res.json())
      .then(json => {
        const result = json?.CommonResult?.Table;

        if (Array.isArray(result)) {
          const formatted = result.map(item => ({
            BannerId: item.Prod_Code,
            BannerName: item.Prod_Name,
            imageUrl: item.ImagePath,
            oldPrice: parseFloat(item.marked_price),
            newPrice: parseFloat(item.selling_price),
            discountPercentage: parseFloat(item.discount_percentage),
          }));

          setPromotions(formatted);
        } else {
          console.warn('⚠️ No valid promotion data found.');
        }
      })
      .catch(err => {
        console.error('❌ API Error:', err);
        Alert.alert('Error', 'Failed to load promotions.');
      })
      .finally(() => setIsLoading(false));
  };

  // 🔹 Render each promotion
  const renderPromotion = ({item}) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate('ItemScreen', {
          PCode: item.BannerId,
          PName: item.BannerName,
          PDescription: '',
          PPrice: item.newPrice,
          IMG: item.imageUrl,
          Location: 'Promotion',
        })
      }>
      <View style={styles.card}>
        {/* Details */}
        <View style={styles.detailsWrapper}>
          <Text numberOfLines={2} style={styles.title}>
            {item.BannerName}
          </Text>
          <Text style={styles.description}>Code: {item.BannerId}</Text>

          <View style={styles.priceColumn}> 
            <View style={styles.percentageRow}>
              <Text style={styles.percentage}>{item.discountPercentage}%</Text>
              <Text style={styles.oldPrice}>
                LKR {item.oldPrice.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.newPrice}>LKR {item.newPrice.toFixed(2)}</Text>
          </View>
        </View>

        {/* Image */}
        <View style={styles.imageWrapper}>
          <FastImage
            source={{uri: item.imageUrl}}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Animated.FlatList
          data={promotions}
          renderItem={renderPromotion}
          keyExtractor={item => item.BannerId.toString()}
          contentContainerStyle={styles.list}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {useNativeDriver: true},
          )}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              {/* 🔹 Animated Back Button */}
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Animated.View
                  style={[
                    {
                      width: 40,
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                    {
                      transform: [
                        {scale: buttonScale},
                        {translateY: buttonTranslateY},
                      ],
                    },
                  ]}>
                  <FastImage
                    source={require('../assets/left-arrow.png')}
                    style={{width: 20, height: 20}}
                  />
                </Animated.View>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Available Promotions</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center', // ✅ keeps arrow & text aligned vertically
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
    fontSize: 18,
    marginLeft: 10, // spacing from back arrow
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    margin: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsWrapper: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 15,
    marginLeft: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
  },
  description: {
    fontSize: 14,
    color: '#5C5C5C',
    marginVertical: 5,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
  },
  priceColumn: {
    flexDirection: 'column',
    marginTop: 5,
  },
  newPrice: {
    fontSize: 18,
    color: 'black',
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
  },
  oldPrice: {
    fontSize: 15,
    color: 'red',
    textDecorationLine: 'line-through',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  percentage: {
    fontWeight: 'bold',
    fontSize: 15,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    color: '#2E7D32',
    alignSelf: 'flex-start',
    marginRight: 8,
  },
});

export default PromotionsScreen;
