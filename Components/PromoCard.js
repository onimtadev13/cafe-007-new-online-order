import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import Slider from '../Components/Slider';

const {width, height} = Dimensions.get('window');

export default function PromoCard({visible = false, onDismiss, onMoreOptions}) {
  const slideAnim = useRef(new Animated.Value(height)).current;

  const cardWidth = width * 0.9;
  const cardHeight = 420;

  useEffect(() => {
    if (visible) {
      // Slide up to the top
      Animated.spring(slideAnim, {
        toValue: 50,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    } else {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleMoreOptions = () => {
    console.log('Clicked More Options...');
    onDismiss(); // Close the modal
    if (onMoreOptions) {
      onMoreOptions(); // Call the onMoreOptions callback
    } else {
      console.warn('onMoreOptions is not provided');
    }
  };
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}>
      <View style={styles.wrapper}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: width * 0.05,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <View
            style={[
              styles.cardContainer,
              {width: cardWidth, minHeight: cardHeight},
            ]}>
            <View style={styles.content}>
              <View style={styles.sliderWrapper}>
                <Slider />
              </View>

              <Text style={styles.title}>Enjoy 50% off (up to LKR 400)</Text>
              <Text style={styles.description}>
                LKR 100 minimum order (excluding promotions) • Delivery orders
                only • Some merchants excluded • This promotion does not apply
                to already...
              </Text>

              <View style={styles.dashedLine} />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.dismissButton]}
                  onPress={onDismiss}>
                  <Text style={styles.dismissText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.moreButton]}
                  onPress={onMoreOptions}>
                  <Text style={styles.moreText}>More Options</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardContainer: {
    backgroundColor: '#5f5d5dec',
    borderRadius: 12,
    padding: 20,
    paddingBottom: 25,
    alignItems: 'center',
    elevation: 5,
  },
  content: {width: '100%', alignItems: 'center'},
  sliderWrapper: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 16,
  },
  dashedLine: {
    borderBottomWidth: 2,
    borderColor: 'grey',
    borderStyle: 'dashed',
    width: '100%',
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  dismissButton: {backgroundColor: '#3a3535ff'},
  moreButton: {backgroundColor: '#28a745'},
  dismissText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
  },
  moreText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
  },
});
