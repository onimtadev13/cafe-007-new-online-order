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
import {Rating} from 'react-native-ratings';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const screenwidth = Dimensions.get('window').width;

export default class RatingScreen extends React.PureComponent {
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
    this.setState({
      foodstarCount: rating,
    });
  }

  onRiderStarRatingPress(rating) {
    this.setState({
      riderstarCount: rating,
    });
  }

  renderComment = count => {
    if (count === 0.5) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>Terrible</Text>
      );
    } else if (count === 1) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>Bad</Text>
      );
    } else if (count === 1.5) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>Meh</Text>
      );
    } else if (count === 2) {
      return <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>OK</Text>;
    } else if (count === 2.5) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>Good</Text>
      );
    } else if (count === 3) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>Hmm...</Text>
      );
    } else if (count === 3.5) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>
          Very Good
        </Text>
      );
    } else if (count === 4) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>Wow</Text>
      );
    } else if (count === 4.5) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>Amazing</Text>
      );
    } else if (count === 5) {
      return (
        <Text style={{fontFamily: 'AsapSemiBold', fontSize: 18}}>
          Unbelievable
        </Text>
      );
    }
  };

  onBackPress = () => {
    switch (this.state.pageIndex) {
      case 1:
        this.props.navigation.goBack();
        break;
      case 2:
        this.setState({pageIndex: this.state.pageIndex - 1}, () => {
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
          this.scrollref.scrollTo({x: -screenwidth, animated: true});
        });
        break;
      case 3:
        this.setState({pageIndex: this.state.pageIndex - 1}, () => {
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
    this.setState({isAddLine: true});
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  onContinuePress = () => {
    if (this.state.pageIndex <= 3) {
      this.setState({pageIndex: this.state.pageIndex + 1}, () => {
        if (this.state.pageIndex == 2) {
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
          this.scrollref.scrollTo({x: screenwidth, animated: true});
        } else if (this.state.pageIndex == 3) {
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
          this.scrollref.scrollTo({x: screenwidth * 2, animated: true});
        } else if (this.state.pageIndex == 4) {
          this.props.navigation.goBack();
        }
      });
    }
  };

  render() {
    const renderFoodRate = () => {
      return (
        <View>
          <View style={{alignItems: 'center', marginTop: 30}}>
            <Image
              source={require('../assets/4.png')}
              style={{width: 130, height: 130, borderRadius: 130 / 2}}
            />
          </View>
          <View
            style={{
              alignItems: 'center',
              marginLeft: 30,
              marginRight: 30,
              marginTop: 10,
            }}>
            <Text style={{fontFamily: 'AsapBold', fontSize: 24}}>
              How was the your last meal
            </Text>
            <Text
              style={{
                fontFamily: 'AsapRegular',
                fontSize: 16,
                marginTop: 10,
                color: '#5C5C5C',
              }}>
              Your feedback will helps the resturant improve{' '}
            </Text>
            <View style={{marginTop: 20}}>
              <Rating
                type="star"
                ratingCount={5}
                imageSize={60}
                showRating
                onFinishRating={rating => this.onFoodStarRatingPress(rating)}
              />
            </View>
            <View style={{margin: 10}}>
              {this.renderComment(this.state.foodstarCount)}
            </View>

            <View style={{marginTop: 10, alignItems: 'center'}}>
              <TouchableOpacity
                style={{width: 120}}
                onPress={() => this.onAddPress()}>
                <Text
                  style={{
                    height: this.state.isAddLine ? 0 : null,
                    fontFamily: 'AsapRegular',
                    fontSize: 16,
                    alignSelf: 'center',
                  }}>
                  Anything to add?
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{width: '95%'}}
              onPress={() => this.RBSheet.open()}>
              <View
                style={{
                  height: this.state.isAddLine ? 100 : 0,
                  backgroundColor: '#e8e8e8',
                  borderRadius: 5,
                  borderColor: '#dbdbdb',
                  borderWidth: this.state.isAddLine ? 1 : 0,
                  overflow: 'hidden',
                }}>
                <ScrollView>
                  <Text
                    style={{
                      padding: 10,
                      fontFamily: 'AsapRegular',
                      fontSize: 16,
                    }}>
                    {this.state.comment}
                  </Text>
                </ScrollView>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    const renderRider = () => {
      return (
        <View>
          <View style={{alignItems: 'center', marginTop: 30}}>
            <Image
              source={require('../assets/rider.png')}
              style={{width: 130, height: 130, borderRadius: 130 / 2}}
            />
          </View>
          <View
            style={{
              alignItems: 'center',
              marginLeft: 30,
              marginRight: 30,
              marginTop: 40,
            }}>
            <Text style={{fontFamily: 'AsapBold', fontSize: 24}}>
              How was our delivery service{' '}
            </Text>
            <Text
              style={{
                fontFamily: 'AsapRegular',
                fontSize: 16,
                marginTop: 10,
                color: '#5C5C5C',
                textAlign: 'center',
              }}>
              Your feedback will help improve the delivery service{' '}
            </Text>
            <View style={{marginTop: 20}}>
              <Rating
                type="star"
                ratingCount={5}
                imageSize={60}
                showRating
                onFinishRating={rating => this.onRiderStarRatingPress(rating)}
              />
            </View>
            <View style={{margin: 10}}>
              {this.renderComment(this.state.riderstarCount)}
            </View>
          </View>
        </View>
      );
    };

    const renderFinal = () => {
      return (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <View style={{marginLeft: 30, marginRight: 30}}>
            <Text
              style={{
                fontFamily: 'AsapBold',
                fontSize: 24,
                textAlign: 'center',
                marginBottom: 70,
              }}>
              Thank you for your feedback
            </Text>
            <Text
              style={{
                fontFamily: 'AsapRegular',
                fontSize: 17,
                textAlign: 'center',
                color: '#5C5C5C',
                marginBottom: 80,
              }}>
              Thank you so much for your kind words, We really appreciate you
              taking the time out to share your experience with us — and we
              agree, You're truly a gem to have on our team! We count ourselves
              lucky for customers like you. Cheers !!
            </Text>
            <View>
              <Text
                style={{
                  fontFamily: 'AsapBold',
                  fontSize: 17,
                  textAlign: 'center',
                  marginBottom: 20,
                }}>
                FOLLOW US
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 5,
                }}>
                <TouchableOpacity style={{marginRight: 10}}>
                  <FontAwesome6 name="facebook" size={25} brand />
                </TouchableOpacity>
                <TouchableOpacity style={{marginRight: 10}}>
                  <FontAwesome6 name="instagram" size={25} brand />
                </TouchableOpacity>
                <TouchableOpacity style={{marginRight: 10}}>
                  <FontAwesome6 name="google" size={25} brand />
                </TouchableOpacity>
                {/* <TouchableOpacity style={{ marginRight: 10 }}>
                                    <IonicIcon name="logo-linkedin" size={25} />
                                </TouchableOpacity> */}
              </View>
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={{flex: 1}}>
        <View
          style={{
            marginLeft: 20,
            marginTop: 30,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            style={{width: 40, height: 40, borderRadius: 40 / 2}}
            onPress={() => this.onBackPress()}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 40 / 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {/* <IonicIcon
                name={
                  this.state.pageIndex === 1
                    ? 'close-outline'
                    : 'chevron-back-outline'
                }
                size={30}
                color={'black'}
                style={{marginRight: 3}}
              /> */}
              <FontAwesome6
  name={this.state.pageIndex === 1 ? 'xmark' : 'chevron-left'}
  size={30}
  color="black"
  style={{ marginRight: 3 }}
  solid
/>
            </View>
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              marginRight: 60,
              fontFamily: 'AsapMedium',
              fontSize: 20,
            }}>
            Rate your meal and deliver
          </Text>
        </View>

        <View style={{alignItems: 'center', marginTop: 40}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 30 / 2,
                backgroundColor: 'black',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{color: 'white', fontFamily: 'AsapMedium'}}>1</Text>
            </View>

            <Animated.View
              style={{width: 40, height: 2, backgroundColor: 'white'}}
            />
            <Animated.View
              style={{
                width: this.state.lineOnewidth,
                height: 2,
                backgroundColor: 'black',
                position: 'absolute',
                marginLeft: 30,
              }}
            />

            <Animated.View
              style={{
                width: this.state.circleTwowidth,
                height: 30,
                borderRadius: 30 / 2,
                backgroundColor: 'black',
                position: 'absolute',
                marginLeft: 70,
              }}
            />
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 30 / 2,
                backgroundColor:
                  this.state.pageIndex > 1 ? 'transparent' : 'white',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: this.state.pageIndex > 1 ? 'white' : 'black',
                  fontFamily: 'AsapMedium',
                }}>
                2
              </Text>
            </View>

            <View style={{width: 40, height: 2, backgroundColor: 'white'}} />
            <Animated.View
              style={{
                width: this.state.lineTwowidth,
                height: 2,
                backgroundColor: 'black',
                position: 'absolute',
                marginLeft: 100,
              }}
            />

            <Animated.View
              style={{
                width: this.state.circleThreewidth,
                height: 30,
                borderRadius: 30 / 2,
                backgroundColor: 'black',
                position: 'absolute',
                marginLeft: 140,
              }}
            />
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 30 / 2,
                backgroundColor:
                  this.state.pageIndex > 2 ? 'transparent' : 'white',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: this.state.pageIndex > 2 ? 'white' : 'black',
                  fontFamily: 'AsapMedium',
                }}>
                3
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={ref => {
            this.scrollref = ref;
          }}
          scrollEnabled={false}
          pagingEnabled={true}
          horizontal={true}
          showsHorizontalScrollIndicator={false}>
          <View style={{width: screenwidth}}>{renderFoodRate()}</View>

          <View style={{width: screenwidth}}>{renderRider()}</View>

          <View style={{width: screenwidth}}>{renderFinal()}</View>
        </ScrollView>

        <TouchableOpacity
          style={{margin: 10}}
          onPress={() => this.onContinuePress()}>
          <View
            style={{
              backgroundColor: 'black',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                fontFamily: 'AsapSemiBold',
                fontSize: 20,
                color: 'white',
                padding: 10,
              }}>
              {this.state.pageIndex === 3 ? 'Done' : 'Continue'}
            </Text>
          </View>
        </TouchableOpacity>

        <RBSheet
          ref={ref => {
            this.RBSheet = ref;
          }}
          height={240}
          openDuration={850}
          closeOnDragDown={true}
          closeOnPressMask={true}
          customStyles={{
            wrapper: {
              backgroundColor: 'transparent',
            },
            draggableIcon: {
              backgroundColor: '#000',
            },
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                margin: 10,
                fontFamily: 'AsapBold',
                fontSize: 18,
                color: 'black',
                alignSelf: 'center',
              }}>
              Add comment
            </Text>
            <TextInput
              style={{
                backgroundColor: '#e8e8e8',
                height: 100,
                paddingLeft: 20,
                borderRadius: 5,
                borderColor: '#dbdbdb',
                borderWidth: 1,
                fontSize: 19,
                fontFamily: 'AsapMedium',
                justifyContent: 'center',
                color: 'black',
                textAlignVertical: 'top',
                marginLeft: 20,
                marginRight: 20,
                marginBottom: 10,
              }}
              value={this.state.comment}
              multiline={true}
              blurOnSubmit={true}
              keyboardType={'default'}
              placeholderTextColor={'#7a7a7a'}
              onChangeText={comment => this.setState({comment: comment})}
            />
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                margin: 5,
              }}
              onPress={() => this.RBSheet.close()}>
              <View
                style={{
                  width: '92%',
                  height: 45,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'black',
                  borderRadius: 5,
                }}>
                <Text
                  style={{
                    color: 'white',
                    fontFamily: 'AsapMedium',
                    fontSize: 18,
                  }}>
                  Done
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </RBSheet>
      </View>
    );
  }
}
