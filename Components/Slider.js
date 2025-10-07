import React from 'react';
import {
  View,
  Dimensions,
  Animated,
  FlatList,
  ImageBackground,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {BarIndicator} from 'react-native-indicators';
import {APIURL} from '../Data/CloneData';

const {width} = Dimensions.get('window');
const height = 240;
const SPACING = 10;

export default class FullWidthSlider extends React.PureComponent {
  state = {
    BannerList: [],
    isLoading: true,
  };

  scrollX = new Animated.Value(0);
  flatRef = null;
  myInterval = null;

  componentDidMount() {
    this.loadBanners();
  }

  componentWillUnmount() {
    clearInterval(this.myInterval);
  }

  loopBanners = () => {
    const ll = this.state.BannerList.length;
    let i = 0;
    this.myInterval = setInterval(() => {
      if (ll > 0) {
        this.flatRef.scrollToIndex({index: i, animated: true});
        i = (i + 1) % ll;
      }
    }, 7000);
  };

  renderItem = ({item, index}) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = this.scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    const translateY = this.scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: 'clamp',
    });

    const opacity = this.scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={{
          width, // full screen width
          height,
          transform: [{scale}, {translateY}],
          opacity,
          borderRadius: 16,
          overflow: 'hidden',
        }}>
        <FastImage
          source={{uri: item.imageUrl}}
          style={{width: '100%', height: '100%'}}
          resizeMode={FastImage.resizeMode.cover}
        />
      </Animated.View>
    );
  };

  render() {
    return (
      <View>
        {this.state.isLoading ? (
          <View>
            <ImageBackground
              source={require('../assets/image-placeholder.png')}
              style={{
                width,
                height,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {/* <BarIndicator count={6} size={30} color="#FF7B54" /> */}
              <BarIndicator count={6} size={30} color="black" />
            </ImageBackground>
          </View>
        ) : (
          <Animated.FlatList
            ref={ref => (this.flatRef = ref)}
            data={this.state.BannerList}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            decelerationRate="fast"
            onScroll={Animated.event(
              [{nativeEvent: {contentOffset: {x: this.scrollX}}}],
              {useNativeDriver: true},
            )}
            scrollEventThrottle={16}
            renderItem={this.renderItem}
          />
        )}

        {/* Dots Indicator */}
        <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 12}}>
          {this.state.BannerList.map((_, i) => {
            const opacity = this.scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const scale = this.scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={{
                  height: 8,
                  width: 8,
                  borderRadius: 4,
                  margin: 4,
                  backgroundColor: '#383636ff',
                  opacity,
                  transform: [{scale}],
                }}
              />
            );
          })}
        </View>
      </View>
    );
  }

  loadBanners() {
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
            Para_Data: '104',
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
        const BList = json.CommonResult.Table.map(el => ({
          BannerId: el.BannerId,
          BannerName: el.BannerName,
          imageUrl: el.imageUrl,
        }));
        this.setState({BannerList: BList, isLoading: false}, this.loopBanners);
      });
  }
}
