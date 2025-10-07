import React from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

const width = Dimensions.get('screen').width;
const height = 200;

export default class OrderImageSlider extends React.PureComponent {
  _direction = '';

  state = {
    active: 0,
    BannerList: this.props.ImageList,
    isLoading: true,
    offset: 0,
    direction: '',
  };

  componentDidMount() {
    this.loopBanners(-1);
  }

  componentWillUnmount() {
    clearInterval(this.myInterval);
  }

  loopBanners = number => {
    var ll = this.state.BannerList.length;
    var i = number;
    this.myInterval = setInterval(() => {
      if (i === ll - 1 && i < ll) {
        i = 0;
      } else {
        i = i + 1;
      }
      this.flatref.scrollToIndex({index: i, animated: true, viewOffset: 0});
    }, 3000);
  };

  change = ({nativeEvent}) => {
    const slide = Math.ceil(
      nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width,
    );
    if (slide !== this.state.active) {
      this.setState({active: slide});
    }
    var currentOffset = nativeEvent.contentOffset.x;
    var direction = currentOffset > this.state.offset ? 'down' : 'up';
    this.setState({
      offset: currentOffset,
    }),
      this.setState({
        direction: direction,
      });
    this._direction = direction;
  };

  onImagePressIn = index => {
    clearInterval(this.myInterval);
    // this.loopBanners(index)
  };

  onContinueloop = index => {
    if (this._direction === 'down') {
      console.log('down');
      this.loopBanners(index - 1);
    } else {
      this.loopBanners(index + 1);
    }
  };

  singleRenderImage = ({item, index}) => {
    return (
      <TouchableOpacity
        key={index}
        activeOpacity={1}
        onPressIn={() => this.onImagePressIn(index)}
        onPressOut={() => this.onContinueloop(index)}
        onPress={() => this.onImagePressIn(index)}>
        <View
          key={index}
          style={{
            width: width,
            height: 200,
            marginRight: 3,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <FastImage
            source={
              item.ProductIMG === ''
                ? require('../assets/image-placeholder.png')
                : {uri: item.ProductIMG, priority: FastImage.priority.high}
            }
            style={{width: width, height: 200}}
            resizeMode={FastImage.resizeMode.contain}
          />
        </View>
      </TouchableOpacity>
    );
  };

  render() {
    return (
      <View>
        <FlatList
          ref={ref => {
            this.flatref = ref;
          }}
          pagingEnabled={true}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          data={this.state.BannerList}
          renderItem={this.singleRenderImage}
          keyExtractor={(item, index) => index.toString()}
          onScroll={this.change}
          removeClippedSubviews={true}
        />

        {/* <View style={{ top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'flex-end', flexDirection: 'row', position: 'absolute', marginBottom: 10 }}>
                    {this.state.BannerList.map((i, k) => (
                        <Text key={k} style={{ marginRight: 3, fontSize: Platform.OS === "ios" ? 8 : 12, color: this.state.active === k ? 'black' : 'white' }}>⬤</Text>
                    ))}
                </View> */}
      </View>
    );
  }
}
