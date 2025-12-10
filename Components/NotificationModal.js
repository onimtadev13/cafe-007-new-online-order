import React from 'react';
import {
  Modal,
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';
import BannerImage from './BannerImage';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {APIURL} from '../Data/CloneData';

const {width, height} = Dimensions.get('window');

export default class NotificationModal extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      zoomIn: new Animated.Value(1),
      slideUp: new Animated.Value(0), 
      fadeIn: new Animated.Value(1),  
      hasCalledAPI: false,
    };
  }

  componentDidMount() {
    this.ButtonTimout = setInterval(() => {
      Animated.timing(this.state.zoomIn, {
        toValue: 1.05,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(this.state.zoomIn, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 1600);
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.visible &&
      !prevProps.visible &&
      this.props.image &&
      this.props.image !== '' &&
      !this.state.hasCalledAPI
    ) {
      console.log('[MODAL] Modal opened, calling NotificationVisit API');
      this.NotificationVisit();
      this.setState({hasCalledAPI: true});
    }

    if (!this.props.visible && prevProps.visible) {
      console.log('[MODAL] Modal closed, resetting API flag');
      this.setState({hasCalledAPI: false});
    }
  }

  componentWillUnmount() {
    clearInterval(this.ButtonTimout);
  }

  NotificationVisit = async () => {
    console.log('[MODAL] NotificationVisit called');

    var mobilenumber = await AsyncStorage.getItem('phonenumber');
    var NotificationId = await AsyncStorage.getItem('NID');

    console.log('[MODAL] Mobile number:', mobilenumber);
    console.log('[MODAL] Notification ID:', NotificationId);

    if (!mobilenumber || !NotificationId) {
      console.log('[MODAL] Missing mobile number or notification ID, skipping API call');
      return;
    }

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
            Para_Data: '118',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: mobilenumber,
            Para_Direction: 'Input',
            Para_Lenth: 100,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: NotificationId,
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
      .then(res => {
        return res.json();
      })
      .then(json => {
        console.log('[MODAL] NotificationVisit API success:', json);
      })
      .catch(er => {
        console.error('[MODAL] NotificationVisit API error:', er);
      });
  };

  render() {
    const {
      type,
      description,
      more_description,
      isMenuButtonVisible,
      image,
      visible,
      onClosePress,
      onItemPress,
      itemCode,
      onMenuPress,
    } = this.props;

    return (
      <>
        {image !== '' ? (
          <Modal animationType="fade" visible={visible} transparent={true}>
            <Animated.View
              style={[
                styles.overlay,
              ]}>
              <TouchableOpacity
                style={styles.overlayTouchable}
                activeOpacity={1}
                onPress={onClosePress}
              />

              <Animated.View
                style={[
                  styles.modalContainer,
                ]}>
                {/* Close Button - Repositioned */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClosePress}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <View style={styles.closeButtonInner}>
                    <Icon name="close" size={24} color={'#fff'} />
                  </View>
                </TouchableOpacity>

                {/* Content Card */}
                <View style={styles.contentCard}>
                  {/* Image Section */}
                  <View style={styles.imageContainer}>
                    {image === undefined ? (
                      <ActivityIndicator
                        animating={true}
                        color="#000"
                        size={'large'}
                      />
                    ) : (
                      <BannerImage
                        uri={image}
                        width={width - 48}
                        header_Description={description}
                      />
                    )}
                  </View>

                  {/* Description Section */}
                  {more_description !== '' && (
                    <View style={styles.descriptionContainer}>
                      <View style={styles.decorativeLine} />
                      <Text style={styles.descriptionText}>
                        {more_description}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionsContainer}>
                    {type === 'item' && (
                      <TouchableOpacity
                        onPress={() => onItemPress(itemCode)}
                        activeOpacity={0.8}>
                        <Animated.View
                          style={[
                            styles.actionButton,
                            styles.primaryButton,
                            {transform: [{scale: this.state.zoomIn}]},
                          ]}>
                          <Icon
                            name="restaurant"
                            size={20}
                            color="#fff"
                            style={styles.buttonIcon}
                          />
                          <Text style={styles.primaryButtonText}>
                            Have a taste
                          </Text>
                        </Animated.View>
                      </TouchableOpacity>
                    )}

                    {isMenuButtonVisible === 'true' && (
                      <TouchableOpacity
                        onPress={() => onMenuPress('Menu')}
                        activeOpacity={0.8}>
                        <Animated.View
                          style={[
                            styles.actionButton,
                            type === 'item'
                              ? styles.secondaryButton
                              : styles.primaryButton,
                            {transform: [{scale: this.state.zoomIn}]},
                          ]}>
                          <Icon
                            name="menu"
                            size={20}
                            color={type === 'item' ? '#000' : '#fff'}
                            style={styles.buttonIcon}
                          />
                          <Text
                            style={
                              type === 'item'
                                ? styles.secondaryButtonText
                                : styles.primaryButtonText
                            }>
                            See Menu
                          </Text>
                        </Animated.View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </Modal>
        ) : null}
      </>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: width - 48,
    maxHeight: height * 0.85,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -15,
    right: -5,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  imageContainer: {
    width: '100%',
    minHeight: 250,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  decorativeLine: {
    width: 40,
    height: 4,
    backgroundColor: '#000',
    borderRadius: 2,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#000',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
  },
});