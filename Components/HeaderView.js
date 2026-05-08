import React from 'react';
import {Dimensions, Platform, Text, View} from 'react-native';
import {isTablet} from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import {useTheme} from '../Context/ThemeContext';

const screenwidth = Dimensions.get('screen').width;

class HeaderView extends React.PureComponent {
  render() {
    const {item, theme, isDark} = this.props;

    const imageSource = isTablet()
      ? require('../assets/section_tablet_img.png')
      : isDark
        ? require('../assets/section_img_dark.png')  // ← dark mode image
        : require('../assets/section_img.png');       // ← light mode image

    return (
      <View
        style={{
          width: '100%',
          height: 170,
          backgroundColor: theme.bg,
        }}>

        {/* Background section image — switches based on theme */}
        <FastImage
          source={imageSource}
          style={{width: screenwidth, height: '100%', position: 'absolute'}}
          resizeMode={FastImage.resizeMode.stretch}
        />

        {/* Text content */}
        <View style={{flex: 1, margin: 10, justifyContent: 'center'}}>
          <Text
            style={{
              fontSize: 18,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              color: theme.text,
            }}>
            {item.Prod_Name}
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              color: theme.textSub,
            }}
            numberOfLines={5}>
            {item.Dept_Content}
          </Text>
        </View>
      </View>
    );
  }
}

function HeaderViewWrapper(props) {
  const {theme, isDark} = useTheme();
  return <HeaderView {...props} theme={theme} isDark={isDark} />;
}

export default HeaderViewWrapper;