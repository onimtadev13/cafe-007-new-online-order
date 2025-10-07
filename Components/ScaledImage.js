import React from 'react';
import {ActivityIndicator, Image} from 'react-native';
import FastImage from 'react-native-fast-image';

export default class ScaledImage extends React.PureComponent {
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
    return (
      <FastImage
        resizeMode={FastImage.resizeMode.contain}
        source={{
          uri: this.state.source,
          cache: FastImage.cacheControl.web,
          priority: FastImage.priority.high,
        }}
        style={{
          height: this.state.height,
          width: this.state.width,
          justifyContent: 'center',
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
    );
  }
}
