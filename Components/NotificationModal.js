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
  StatusBar,
} from 'react-native';
import BannerImage from './BannerImage';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIURL } from '../Data/CloneData';

const { width, height } = Dimensions.get('window');

export default class NotificationModal extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      zoomIn: new Animated.Value(1),
      slideUp: new Animated.Value(height),
      fadeIn: new Animated.Value(0),
      scaleIn: new Animated.Value(0.9),
      hasCalledAPI: false,
    };
  }

  componentDidMount() {
    this.ButtonTimout = setInterval(() => {
      Animated.sequence([
        Animated.timing(this.state.zoomIn, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(this.state.zoomIn, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1600);
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible && !prevProps.visible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(this.state.fadeIn, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(this.state.scaleIn, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      if (
        this.props.image &&
        this.props.image !== '' &&
        !this.state.hasCalledAPI
      ) {
        console.log('[MODAL] Modal opened, calling NotificationVisit API');
        this.NotificationVisit();
        this.setState({ hasCalledAPI: true });
      }
    }

    if (!this.props.visible && prevProps.visible) {
      console.log('[MODAL] Modal closed, resetting API flag');
      this.setState({
        hasCalledAPI: false,
        fadeIn: new Animated.Value(0),
        scaleIn: new Animated.Value(0.9),
      });
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
      console.log(
        '[MODAL] Missing mobile number or notification ID, skipping API call',
      );
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
          <Modal
            animationType="none"
            visible={visible}
            transparent={true}
            statusBarTranslucent
            onRequestClose={onClosePress}
          >
            <StatusBar
              backgroundColor="rgba(0, 0, 0, 0.75)"
              barStyle="light-content"
            />
            <Animated.View
              style={[styles.overlay, { opacity: this.state.fadeIn }]}
            >
              <TouchableOpacity
                style={styles.overlayTouchable}
                activeOpacity={1}
                onPress={onClosePress}
              />

              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    opacity: this.state.fadeIn,
                    transform: [{ scale: this.state.scaleIn }],
                  },
                ]}
              >
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClosePress}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={[
                      styles.closeButtonInner,
                      { transform: [{ scale: this.state.fadeIn }] },
                    ]}
                  >
                    <Icon name="close" size={22} color={'#fff'} />
                  </Animated.View>
                </TouchableOpacity>

                {/* Content Card */}
                <View style={styles.contentCard}>
                  {/* Image Section with Gradient Overlay */}
                  <View style={styles.imageContainer}>
                    {image === undefined ? (
                      <ActivityIndicator
                        animating={true}
                        color="#000"
                        size={'large'}
                      />
                    ) : (
                      <>
                        <BannerImage
                          uri={image}
                          width={width - 48}
                          header_Description={description}
                        />
                        {/* Subtle gradient overlay for better text contrast */}
                        <View style={styles.imageGradient} />
                      </>
                    )}
                  </View>

                  {/* Description Section with Enhanced Styling */}
                  {more_description !== '' && (
                    <View style={styles.descriptionContainer}>
                      <View style={styles.decorativeLineContainer}>
                        <View style={styles.decorativeLine} />
                      </View>
                      <Text style={styles.descriptionText}>
                        {more_description}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons with Improved Layout */}
                  <View style={styles.actionsContainer}>
                    {type === 'item' && (
                      <TouchableOpacity
                        onPress={() => onItemPress(itemCode)}
                        activeOpacity={0.85}
                        style={styles.buttonWrapper}
                      >
                        <Animated.View
                          style={[
                            styles.actionButton,
                            styles.primaryButton,
                            { transform: [{ scale: this.state.zoomIn }] },
                          ]}
                        >
                          <View style={styles.buttonContent}>
                            <View style={styles.iconCircle}>
                              <Icon name="restaurant" size={18} color="#000" />
                            </View>
                            <Text style={styles.primaryButtonText}>
                              Have a taste
                            </Text>
                          </View>
                        </Animated.View>
                      </TouchableOpacity>
                    )}

                    {isMenuButtonVisible === 'true' && (
                      <TouchableOpacity
                        onPress={() => onMenuPress('Menu')}
                        activeOpacity={0.85}
                        style={styles.buttonWrapper}
                      >
                        <Animated.View
                          style={[
                            styles.actionButton,
                            type === 'item'
                              ? styles.secondaryButton
                              : styles.primaryButton,
                            { transform: [{ scale: this.state.zoomIn }] },
                          ]}
                        >
                          <View style={styles.buttonContent}>
                            {type !== 'item' && (
                              <View style={styles.iconCircle}>
                                <Icon name="menu" size={18} color="#000" />
                              </View>
                            )}
                            {type === 'item' && (
                              <Icon
                                name="menu"
                                size={20}
                                color="#000"
                                style={styles.buttonIcon}
                              />
                            )}
                            <Text
                              style={
                                type === 'item'
                                  ? styles.secondaryButtonText
                                  : styles.primaryButtonText
                              }
                            >
                              See Full Menu
                            </Text>
                          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: height * 0.9,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -12,
    right: -8,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  imageContainer: {
    width: '100%',
    minHeight: 280,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#fff',
  },
  decorativeLineContainer: {
    marginBottom: 16,
  },
  decorativeLine: {
    width: 50,
    height: 5,
    backgroundColor: '#000',
    borderRadius: 3,
  },
  descriptionText: {
    fontSize: 15.5,
    lineHeight: 24,
    color: '#2c2c2c',
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
    letterSpacing: 0.2,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 14,
  },
  buttonWrapper: {
    width: '100%',
  },
  actionButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: '#000',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: '#000',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
    letterSpacing: 0.3,
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
    letterSpacing: 0.3,
  },
});
