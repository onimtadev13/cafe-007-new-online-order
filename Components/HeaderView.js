import React from 'react';
import {Dimensions, Platform, Text, View} from 'react-native';
import {isTablet} from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import {useTheme} from '../Context/ThemeContext';

const screenwidth = Dimensions.get('screen').width;

class HeaderView extends React.PureComponent {
  render() {
    const {item, theme} = this.props;

    return (
      <View style={{
        width: '100%',
        height: 170,
        backgroundColor: theme.bg,  // ← was '#F0F0F0'
      }}>
        <FastImage
          source={
            isTablet()
              ? require('../assets/section_tablet_img.png')
              : require('../assets/section_img.png')
          }
          style={{width: screenwidth, height: '100%', position: 'absolute'}}
          resizeMode={FastImage.resizeMode.stretch}
        />
        <View style={{flex: 1, margin: 10, justifyContent: 'center'}}>
          <Text
            style={{
              fontSize: 18,
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              color: theme.text,  // ← was no colour (inherited black)
            }}>
            {item.Prod_Name}
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              color: theme.textSub,  // ← was no colour
            }}
            numberOfLines={5}>
            {item.Dept_Content}
          </Text>
        </View>
      </View>
    );
  }
}

// Wrapper to inject theme — same pattern used across the app
function HeaderViewWrapper(props) {
  const {theme, isDark} = useTheme();
  return <HeaderView {...props} theme={theme} isDark={isDark} />;
}

export default HeaderViewWrapper;