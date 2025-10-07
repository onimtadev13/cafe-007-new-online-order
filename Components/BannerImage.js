import React from 'react';
import {ActivityIndicator, Image, Platform, Text, View} from 'react-native';
import FastImage from 'react-native-fast-image';

export default class BannerImage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      source: this.props.uri,
      height: 0,
      width: 0,
      loading: true,
    };
  }

  componentDidMount() {
    Image.getSize(this.props.uri, (width, height) => {
      if (this.props.width && !this.props.height) {
        this.setState({
          width: this.props.width,
          height: height * (this.props.width / width),
        });
      } else if (!this.props.width && this.props.height) {
        this.setState({
          width: width * (this.props.height / height),
          height: this.props.height,
        });
      } else {
        this.setState({width: width, height: height});
      }
    });
  }

  render() {
    const {header_Description} = this.props;
    return (
      <View
        style={{
          height: this.state.height,
          width: this.state.width,
          backgroundColor: 'white',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}>
        <Text
          numberOfLines={4}
          style={{
            paddingLeft: header_Description === '' ? 0 : 10,
            paddingTop: header_Description === '' ? 0 : 10,
            margin: header_Description === '' ? 0 : 10,
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
          }}>
          {header_Description}
        </Text>
        <FastImage
          resizeMode={FastImage.resizeMode.contain}
          source={{
            uri: this.state.source,
            cache: FastImage.cacheControl.immutable,
            priority: FastImage.priority.high,
          }}
          style={{
            height: this.state.height,
            width: this.state.width - 20,
            justifyContent: 'center',
            marginLeft: 10,
          }}
          onLoadStart={() => {
            this.setState({loading: true});
          }}
          onLoadEnd={() => {
            this.setState({loading: false});
          }}>
          <ActivityIndicator
            animating={this.state.loading}
            size={'large'}
            color={'black'}
          />
        </FastImage>
      </View>
    );
  }
}
