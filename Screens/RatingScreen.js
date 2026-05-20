import React from 'react';
import {
  Animated,
  Dimensions,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Rating } from 'react-native-ratings';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { withTheme } from '../Context/ThemeContext';

const screenwidth = Dimensions.get('window').width;

class RatingScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      circleTwowidth: new Animated.Value(0),
      lineOnewidth: new Animated.Value(0),
      circleThreewidth: new Animated.Value(0),
      lineTwowidth: new Animated.Value(0),
      foodstarCount: 0,
      riderstarCount: 0,
      isAddLine: false,
      comment: '',
      pageIndex: 1,
    };
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  onFoodStarRatingPress(rating) {
    this.setState({ foodstarCount: rating });
  }

  onRiderStarRatingPress(rating) {
    this.setState({ riderstarCount: rating });
  }

  renderComment = count => {
    const { theme } = this.props;
    const style = {
      fontFamily:
        Platform.OS === 'ios' ? 'Asap-Regular_SemiBold' : 'AsapSemiBold',
      fontSize: 18,
      color: theme.text,
    };

    const labels = {
      0.5: 'Terrible',
      1: 'Bad',
      1.5: 'Meh',
      2: 'OK',
      2.5: 'Good',
      3: 'Hmm...',
      3.5: 'Very Good',
      4: 'Wow',
      4.5: 'Amazing',
      5: 'Unbelievable',
    };

    return labels[count] ? <Text style={style}>{labels[count]}</Text> : null;
  };

  onBackPress = () => {
    switch (this.state.pageIndex) {
      case 1:
        this.props.navigation.goBack();
        break;
      case 2:
        this.setState({ pageIndex: this.state.pageIndex - 1 }, () => {
          Animated.parallel([
            Animated.spring(this.state.circleTwowidth, {
              toValue: 0,
              useNativeDriver: false,
            }),
            Animated.spring(this.state.lineOnewidth, {
              toValue: 0,
              delay: 250,
              useNativeDriver: false,
            }),
          ]).start();
          this.scrollref.scrollTo({ x: -screenwidth, animated: true });
        });
        break;
      case 3:
        this.setState({ pageIndex: this.state.pageIndex - 1 }, () => {
          Animated.parallel([
            Animated.spring(this.state.circleThreewidth, {
              toValue: 0,
              useNativeDriver: false,
            }),
            Animated.spring(this.state.lineTwowidth, {
              toValue: 0,
              delay: 250,
              useNativeDriver: false,
            }),
          ]).start();
          this.scrollref.scrollTo({
            x: screenwidth * 2 - screenwidth,
            animated: true,
          });
        });
        break;
      default:
        break;
    }
  };

  onAddPress = () => {
    this.setState({ isAddLine: true });
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  onContinuePress = () => {
    if (this.state.pageIndex <= 3) {
      this.setState({ pageIndex: this.state.pageIndex + 1 }, () => {
        if (this.state.pageIndex === 2) {
          Animated.parallel([
            Animated.spring(this.state.lineOnewidth, {
              toValue: 40,
              useNativeDriver: false,
            }),
            Animated.spring(this.state.circleTwowidth, {
              toValue: 30,
              delay: 250,
              useNativeDriver: false,
            }),
          ]).start();
          this.scrollref.scrollTo({ x: screenwidth, animated: true });
        } else if (this.state.pageIndex === 3) {
          Animated.parallel([
            Animated.spring(this.state.lineTwowidth, {
              toValue: 40,
              useNativeDriver: false,
            }),
            Animated.spring(this.state.circleThreewidth, {
              toValue: 30,
              delay: 250,
              useNativeDriver: false,
            }),
          ]).start();
          this.scrollref.scrollTo({ x: screenwidth * 2, animated: true });
        } else if (this.state.pageIndex === 4) {
          this.props.navigation.goBack();
        }
      });
    }
  };

  render() {
    const { theme, isDark } = this.props;

    // ── Step indicator colors ─────────────────────────────────────────────────
    const activeCircleBg = theme.text; // filled circle
    const inactiveCircleBg = theme.surface; // unfilled circle bg
    const activeCircleText = theme.bg; // number inside filled circle
    const inactiveText = theme.textMuted; // number inside unfilled circle
    const lineColor = theme.text; // progress line color
    const lineBgColor = theme.separator; // inactive line color

    const renderFoodRate = () => (
      <View>
        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <Image
            source={require('../assets/4.png')}
            style={{ width: 130, height: 130, borderRadius: 65 }}
          />
        </View>
        <View
          style={{
            alignItems: 'center',
            marginLeft: 30,
            marginRight: 30,
            marginTop: 10,
          }}
        >
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 24,
              color: theme.text,
              textAlign: 'center',
            }}
          >
            How was the your last meal
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16,
              marginTop: 10,
              color: theme.textSub,
              textAlign: 'center',
            }}
          >
            Your feedback will helps the resturant improve
          </Text>

          <View style={{ marginTop: 20 }}>
            <Rating
              type="star"
              ratingCount={5}
              imageSize={60}
              showRating
              ratingTextColor={theme.text}
              tintColor={theme.bg} // ← background behind stars
              onFinishRating={rating => this.onFoodStarRatingPress(rating)}
            />
          </View>

          <View style={{ margin: 10 }}>
            {this.renderComment(this.state.foodstarCount)}
          </View>

          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <TouchableOpacity
              style={{ width: 120 }}
              onPress={() => this.onAddPress()}
            >
              <Text
                style={{
                  height: this.state.isAddLine ? 0 : null,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 16,
                  alignSelf: 'center',
                  color: theme.accent,
                }}
              >
                Anything to add?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ width: '95%' }}
            onPress={() => this.RBSheet.open()}
          >
            <View
              style={{
                height: this.state.isAddLine ? 100 : 0,
                backgroundColor: theme.surface,
                borderRadius: 5,
                borderColor: theme.inputBorder,
                borderWidth: this.state.isAddLine ? 1 : 0,
                overflow: 'hidden',
              }}
            >
              <ScrollView>
                <Text
                  style={{
                    padding: 10,
                    fontFamily:
                      Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                    fontSize: 16,
                    color: theme.text,
                  }}
                >
                  {this.state.comment}
                </Text>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );

    const renderRider = () => (
      <View>
        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <Image
            source={require('../assets/rider.png')}
            style={{ width: 130, height: 130, borderRadius: 65 }}
          />
        </View>
        <View
          style={{
            alignItems: 'center',
            marginLeft: 30,
            marginRight: 30,
            marginTop: 40,
          }}
        >
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 24,
              color: theme.text,
              textAlign: 'center',
            }}
          >
            How was our delivery service
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16,
              marginTop: 10,
              color: theme.textSub,
              textAlign: 'center',
            }}
          >
            Your feedback will help improve the delivery service
          </Text>

          <View style={{ marginTop: 20 }}>
            <Rating
              type="star"
              ratingCount={5}
              imageSize={60}
              showRating
              ratingTextColor={theme.text}
              tintColor={theme.bg} // ← background behind stars
              onFinishRating={rating => this.onRiderStarRatingPress(rating)}
            />
          </View>

          <View style={{ margin: 10 }}>
            {this.renderComment(this.state.riderstarCount)}
          </View>
        </View>
      </View>
    );

    const renderFinal = () => (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ marginLeft: 30, marginRight: 30 }}>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 24,
              textAlign: 'center',
              marginBottom: 70,
              color: theme.text,
            }}
          >
            Thank you for your feedback
          </Text>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 17,
              textAlign: 'center',
              color: theme.textSub,
              marginBottom: 80,
            }}
          >
            Thank you so much for your kind words, We really appreciate you
            taking the time out to share your experience with us — and we agree,
            You're truly a gem to have on our team! We count ourselves lucky for
            customers like you. Cheers !!
          </Text>

          <View>
            <Text
              style={{
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                fontSize: 17,
                textAlign: 'center',
                marginBottom: 20,
                color: theme.text,
              }}
            >
              FOLLOW US
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 5,
              }}
            >
              <TouchableOpacity style={{ marginRight: 10 }}>
                <FontAwesome6
                  name="facebook"
                  size={25}
                  color={theme.text}
                  brand
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 10 }}>
                <FontAwesome6
                  name="instagram"
                  size={25}
                  color={theme.text}
                  brand
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 10 }}>
                <FontAwesome6
                  name="google"
                  size={25}
                  color={theme.text}
                  brand
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );

    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          {/* ── Header row ── */}
          <View
            style={{
              marginLeft: 20,
              marginTop: 30,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              style={{ width: 40, height: 40, borderRadius: 20 }}
              onPress={() => this.onBackPress()}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.surface,
                }}
              >
                <FontAwesome6
                  name={this.state.pageIndex === 1 ? 'xmark' : 'chevron-left'}
                  size={20}
                  color={theme.text}
                  solid
                />
              </View>
            </TouchableOpacity>

            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                marginRight: 60,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 20,
                color: theme.text,
              }}
            >
              Rate your meal and deliver
            </Text>
          </View>

          {/* ── Step indicator ── */}
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Step 1 — always active */}
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: activeCircleBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: activeCircleText,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                  }}
                >
                  1
                </Text>
              </View>

              {/* Line 1 */}
              <View
                style={{ width: 40, height: 2, backgroundColor: lineBgColor }}
              />
              <Animated.View
                style={{
                  width: this.state.lineOnewidth,
                  height: 2,
                  backgroundColor: lineColor,
                  position: 'absolute',
                  marginLeft: 30,
                }}
              />

              {/* Step 2 circle fill animation */}
              <Animated.View
                style={{
                  width: this.state.circleTwowidth,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: activeCircleBg,
                  position: 'absolute',
                  marginLeft: 70,
                }}
              />
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor:
                    this.state.pageIndex > 1 ? 'transparent' : inactiveCircleBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color:
                      this.state.pageIndex > 1
                        ? activeCircleText
                        : inactiveText,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                  }}
                >
                  2
                </Text>
              </View>

              {/* Line 2 */}
              <View
                style={{ width: 40, height: 2, backgroundColor: lineBgColor }}
              />
              <Animated.View
                style={{
                  width: this.state.lineTwowidth,
                  height: 2,
                  backgroundColor: lineColor,
                  position: 'absolute',
                  marginLeft: 100,
                }}
              />

              {/* Step 3 circle fill animation */}
              <Animated.View
                style={{
                  width: this.state.circleThreewidth,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: activeCircleBg,
                  position: 'absolute',
                  marginLeft: 140,
                }}
              />
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor:
                    this.state.pageIndex > 2 ? 'transparent' : inactiveCircleBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color:
                      this.state.pageIndex > 2
                        ? activeCircleText
                        : inactiveText,
                    fontFamily:
                      Platform.OS === 'ios'
                        ? 'Asap-Regular_Medium'
                        : 'AsapMedium',
                  }}
                >
                  3
                </Text>
              </View>
            </View>
          </View>

          {/* ── Scrollable pages ── */}
          <ScrollView
            ref={ref => {
              this.scrollref = ref;
            }}
            scrollEnabled={false}
            pagingEnabled={true}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
          >
            <View style={{ width: screenwidth }}>{renderFoodRate()}</View>
            <View style={{ width: screenwidth }}>{renderRider()}</View>
            <View style={{ width: screenwidth }}>{renderFinal()}</View>
          </ScrollView>

          {/* ── Continue / Done button ── */}
          <TouchableOpacity
            style={{ margin: 10 }}
            onPress={() => this.onContinuePress()}
          >
            <View
              style={{
                backgroundColor: theme.pill,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_SemiBold'
                      : 'AsapSemiBold',
                  fontSize: 20,
                  color: theme.pillText,
                  padding: 10,
                }}
              >
                {this.state.pageIndex === 3 ? 'Done' : 'Continue'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── Comment bottom sheet ── */}
          <RBSheet
            ref={ref => {
              this.RBSheet = ref;
            }}
            height={240}
            openDuration={850}
            closeOnDragDown={true}
            closeOnPressMask={true}
            customStyles={{
              wrapper: { backgroundColor: 'transparent' },
              draggableIcon: { backgroundColor: theme.textMuted },
              container: { backgroundColor: theme.card },
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  margin: 10,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 18,
                  color: theme.text,
                  alignSelf: 'center',
                }}
              >
                Add comment
              </Text>

              <TextInput
                style={{
                  backgroundColor: theme.inputBg,
                  height: 100,
                  paddingLeft: 20,
                  borderRadius: 5,
                  borderColor: theme.inputBorder,
                  borderWidth: 1,
                  fontSize: 19,
                  fontFamily:
                    Platform.OS === 'ios'
                      ? 'Asap-Regular_Medium'
                      : 'AsapMedium',
                  justifyContent: 'center',
                  color: theme.text,
                  textAlignVertical: 'top',
                  marginLeft: 20,
                  marginRight: 20,
                  marginBottom: 10,
                }}
                value={this.state.comment}
                multiline={true}
                blurOnSubmit={true}
                keyboardType={'default'}
                placeholderTextColor={theme.placeholder}
                placeholder="Write your comment..."
                onChangeText={comment => this.setState({ comment })}
              />

              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 5,
                }}
                onPress={() => this.RBSheet.close()}
              >
                <View
                  style={{
                    width: '92%',
                    height: 45,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.pill,
                    borderRadius: 5,
                  }}
                >
                  <Text
                    style={{
                      color: theme.pillText,
                      fontFamily:
                        Platform.OS === 'ios'
                          ? 'Asap-Regular_Medium'
                          : 'AsapMedium',
                      fontSize: 18,
                    }}
                  >
                    Done
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </RBSheet>
        </View>
      </View>
    );
  }
}

export default withTheme(RatingScreen);
