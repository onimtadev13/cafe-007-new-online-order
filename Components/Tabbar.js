import React from 'react';
import {
  Dimensions,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const WindowWidth = Dimensions.get('window').width;

export default class Tabbar extends React.PureComponent {
  _tabContainerMeasurements = {};
  _tabsMeasurements = [];

  constructor(props) {
    super(props);
  }

  componentDidUpdate(preprops) {
    if (this.props.currentIndex !== preprops.currentIndex) {
      this.scrollref.scrollTo({
        x: this.getScrollAmount(),
        animated: true,
      });
    }
  }

  getScrollAmount = () => {
    const {currentIndex} = this.props;
    const position = currentIndex;
    const pageOffset = 0;
    const containerWidth = WindowWidth;
    const tabWidth = this._tabsMeasurements[position].width;
    const nextTabMeasurements = this._tabsMeasurements[position + 1];
    const nextTabWidth =
      (nextTabMeasurements && nextTabMeasurements.width) || 0;
    const tabOffset = this._tabsMeasurements[position].left;
    const absolutePageOffset = pageOffset * tabWidth;
    let newScrollX = tabOffset + absolutePageOffset;

    newScrollX -=
      (containerWidth -
        (1 - pageOffset) * tabWidth -
        pageOffset * nextTabWidth) /
      2;
    newScrollX = newScrollX >= 0 ? newScrollX : 0;

    const rightBoundScroll = Math.max(
      this._tabContainerMeasurements.width - containerWidth,
      0,
    );

    newScrollX = newScrollX > rightBoundScroll ? rightBoundScroll : newScrollX;
    return newScrollX;
  };

  onTabContainerLayout = e => {
    this._tabContainerMeasurements = e.nativeEvent.layout;
  };

  onTabLayout = (key, e) => {
    const {x, width, height} = e.nativeEvent.layout;
    this._tabsMeasurements.push({
      key: key,
      left: x,
      right: x + width,
      width: width,
      height: height,
    });
    this._tabsMeasurements.sort((a, b) => a.key - b.key);
  };

  renderTab = (section, index) => {
    const {currentItem, onPressClick} = this.props;
    if (section.header)
      return (
        <TouchableOpacity
          onLayout={event => this.onTabLayout(index, event)}
          key={index}
          style={{flex: 1}}
          onPress={() => {
            onPressClick(index, section.headerindex);
          }}>
          <View
            style={[
              {
                margin: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderColor: 'black',
                borderRadius: 10,
                borderWidth: 1.2,
                padding: 9,
              },
              {
                backgroundColor:
                  currentItem == section.Prod_Name ? 'black' : '#F0F0F0',
              },
            ]}>
            <Text
              style={[
                {
                  fontSize: 16,
                  textAlign: 'center',
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                },
                {color: currentItem == section.Prod_Name ? 'white' : 'black'},
              ]}>
              {section.Prod_Name}
            </Text>
          </View>
        </TouchableOpacity>
      );
  };

  render() {
    const {sections} = this.props;

    return (
      <View style={[{width: WindowWidth}]}>
        <ScrollView
          ref={r => (this.scrollref = r)}
          showsHorizontalScrollIndicator={false}
          horizontal
          contentContainerStyle={{flexDirection: 'row'}}>
          <View
            onLayout={this.onTabContainerLayout}
            style={[{flexDirection: 'row'}]}>
            {sections.map(this.renderTab)}
          </View>
        </ScrollView>
      </View>
    );
  }
}
