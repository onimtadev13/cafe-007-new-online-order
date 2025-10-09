import {firebase} from '@react-native-firebase/messaging';
import moment from 'moment';
import React from 'react';
import {Animated, Platform, Text, View} from 'react-native';
import {WaveIndicator} from 'react-native-indicators';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import {APIURL} from '../Data/CloneData';
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";

export default class OrderProcess extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      orderStatus: this.props.OrderStatus,
      statusList: this.props.StatusList,
      dineType: this.props.DineType,
      orderID: this.props.OrderID,
      ScheduleTime: this.props.ScheduleTime,
      ReminderTime: '',
      processAnimate: new Animated.Value(0),
      acceptAnimate: new Animated.Value(0),
      prepairAnimate: new Animated.Value(0),
      deliveryAnimate: new Animated.Value(0),
      completeAnimate: new Animated.Value(0),
    };
  }

  componentDidMount() {
    this.localNotification();
    this.GetReminderTime();

    // console.log(this.state.statusList);
    if (this.state.statusList.length === 2) {
      this.ProcessAnimate();
      this.AcceptAnimate();
    } else if (this.state.statusList.length === 3) {
      this.ProcessAnimate();
      this.AcceptAnimate();
    } else if (this.state.statusList.length === 4) {
      this.ProcessAnimate();
      this.AcceptAnimate();
      this.PrepairAnimate();
    } else if (this.state.statusList.length === 5) {
      this.ProcessAnimate();
      this.AcceptAnimate();
      this.PrepairAnimate();
      this.DeliveryAnimate();
    }

    // if (this.state.dineType === "Delivery") {
    //     if (this.state.statusList.length === 3) {
    //         this.ProcessAnimate();
    //         this.AcceptAnimate();
    //     } else if (this.state.statusList.length === 4) {
    //         this.ProcessAnimate();
    //         this.AcceptAnimate();
    //         this.PrepairAnimate();
    //     } else if (this.state.statusList.length === 5) {
    //         this.ProcessAnimate();
    //         this.AcceptAnimate();
    //         this.PrepairAnimate();
    //         this.DeliveryAnimate();
    //     }
    // } else {
    //     if (this.state.statusList.length === 2) {
    //         this.ProcessAnimate();
    //     } else if (this.state.statusList.length === 3) {
    //         this.ProcessAnimate();
    //         this.AcceptAnimate();
    //     } else if (this.state.statusList.length === 4) {
    //         this.ProcessAnimate();
    //         this.AcceptAnimate();
    //         this.PrepairAnimate();
    //         this.DeliveryAnimate();
    //     }
    // }
  }

  componentWillUnmount() {
    this.messageListner();
  }

  ProcessAnimate = () => {
    Animated.spring(this.state.processAnimate, {
      toValue: 1,
      delay: 300,
      useNativeDriver: true,
    }).start();
  };

  AcceptAnimate = () => {
    Animated.spring(this.state.acceptAnimate, {
      toValue: 1,
      delay: 300,
      useNativeDriver: true,
    }).start();
  };

  PrepairAnimate = () => {
    Animated.spring(this.state.prepairAnimate, {
      toValue: 1,
      delay: 300,
      useNativeDriver: true,
    }).start();
  };

  DeliveryAnimate = () => {
    Animated.spring(this.state.deliveryAnimate, {
      toValue: 1,
      delay: 300,
      useNativeDriver: true,
    }).start();
  };

  localNotification = () => {
    var list = [];
    this.messageListner = firebase
      .messaging()
      .onMessage(async remoteMessage => {
        // console.log(JSON.stringify(remoteMessage.data.Status));
        if (remoteMessage.data.OrderID === this.state.orderID) {
          this.setState({orderStatus: remoteMessage.data.Status});

          list = this.state.statusList;
          var index = list.findIndex(i => i === remoteMessage.data.Status);
          if (index === -1) {
            list.push(remoteMessage.data.Status);
            this.setState({statusList: list});
          }

          // if (this.state.dineType === "Delivery") {
          //     if (remoteMessage.data.Status === "Preparing") {
          //         this.ProcessAnimate();
          //         this.AcceptAnimate();
          //     } else if (remoteMessage.data.Status === "Delivering") {
          //         this.PrepairAnimate();
          //     } else if (remoteMessage.data.Status === "Complete") {
          //         this.DeliveryAnimate();
          //     }
          // } else {
          //     if (remoteMessage.data.Status === "Preparing") {
          //         this.ProcessAnimate();
          //         this.AcceptAnimate();
          //     } else if (remoteMessage.data.Status === "Complete") {
          //         this.PrepairAnimate();
          //         this.DeliveryAnimate();
          //     }
          // }

          if (remoteMessage.data.Status === 'Preparing') {
            list.push('Accept');
            this.setState({statusList: list});
            this.ProcessAnimate();
            this.AcceptAnimate();
            this.GetReminderTime();
          } else if (remoteMessage.data.Status === 'Cancel') {
            list.push('Cancel');
            this.setState({statusList: list});
            this.ProcessAnimate();
            this.AcceptAnimate();
          } else if (remoteMessage.data.Status === 'Delivering') {
            this.PrepairAnimate();
          } else if (remoteMessage.data.Status === 'Finish') {
            this.DeliveryAnimate();
          }

          // console.log(this.state.statusList);
        }
      });
  };

  render() {
    const OrderProcessing = () => {
      if (this.state.orderStatus === 'Processing') {
        return (
          <>
            <View style={{marginRight: 25, marginLeft: -5}}>
              <WaveIndicator
                animating={true}
                interaction={true}
                size={30}
                color="black"
              />
            </View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 18,
                }}>
                Order Processed
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                }}>
                We are processing your tasty order
              </Text>
            </View>
          </>
        );
      } else {
        return (
          <>
            <Animated.View
              style={[
                {
                  width: 25,
                  height: 25,
                  borderRadius: 25 / 2,
                  backgroundColor: 'black',
                  marginRight: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                {transform: [{scale: this.state.processAnimate}]},
              ]}>
              {/* <Ionicons name={'checkmark'} size={18} color={'white'} /> */}
              <FontAwesome6 name="check" size={18} color="white" solid />
            </Animated.View>
            <View>
              <Text
                style={{
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  marginRight: 15,
                }}>
                Order Processed
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                }}>
                We are processing your tasty order
              </Text>
            </View>
          </>
        );
      }
    };

    const OrderAccepting = () => {
      if (
        this.state.orderStatus === 'Preparing' ||
        this.state.orderStatus === 'Cancel'
      ) {
        return (
          <>
            <Animated.View
              style={[
                {
                  width: 25,
                  height: 25,
                  borderRadius: 25 / 2,
                  backgroundColor:
                    this.state.orderStatus === 'Cancel' ? 'red' : 'black',
                  marginRight: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                {transform: [{scale: this.state.acceptAnimate}]},
              ]}>
              {/* <Ionicons name={'checkmark'} size={18} color={'white'} /> */}
              <FontAwesome6 name="check" size={18} color="white" solid />
            </Animated.View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: this.state.orderStatus === 'Cancel' ? 'red' : 'black',
                }}>
                {this.state.orderStatus === 'Cancel'
                  ? 'Order Canceled'
                  : 'Order Accepted'}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: this.state.orderStatus === 'Cancel' ? 'red' : 'black',
                }}>
                {this.state.orderStatus === 'Cancel'
                  ? 'Your order has been canceled'
                  : 'Awiating accepting...'}
              </Text>
            </View>
          </>
        );
      } else if (
        this.state.statusList.some(i => i === 'Accept') ||
        this.state.statusList.some(i => i === 'Cancel')
      ) {
        return (
          <>
            <Animated.View
              style={[
                {
                  width: 25,
                  height: 25,
                  borderRadius: 25 / 2,
                  backgroundColor: 'black',
                  marginRight: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                {transform: [{scale: this.state.acceptAnimate}]},
              ]}>
              {/* <Ionicons name={'checkmark'} size={18} color={'white'} /> */}
              <FontAwesome6 name="check" size={18} color="white" solid />
            </Animated.View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: 'black',
                }}>
                Order Accepted
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: 'black',
                }}>
                Awiating accepting...
              </Text>
            </View>
          </>
        );
      } else {
        return (
          <>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 20 / 2,
                borderWidth: 2,
                borderColor: '#9c9c9c',
                marginRight: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 12 / 2,
                  backgroundColor: '#9c9c9c',
                }}
              />
            </View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: '#9c9c9c',
                }}>
                Order Accepted
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: '#9c9c9c',
                }}>
                Awiating accepting...
              </Text>
            </View>
          </>
        );
      }
    };

    const OrderPrepairing = () => {
      if (this.state.orderStatus === 'Preparing') {
        return (
          <>
            <View style={{marginRight: 25, marginLeft: -5}}>
              <WaveIndicator
                animating={true}
                interaction={true}
                size={30}
                color="black"
              />
            </View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 18,
                  color: 'black',
                }}>
                Order Prepairing
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: 'black',
                }}>
                We are prepairing your tasty order
              </Text>
            </View>
          </>
        );
      } else if (this.state.statusList.some(i => i === 'Preparing')) {
        return (
          <>
            <Animated.View
              style={[
                {
                  width: 25,
                  height: 25,
                  borderRadius: 25 / 2,
                  backgroundColor: 'black',
                  marginRight: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                {transform: [{scale: this.state.prepairAnimate}]},
              ]}>
              {/* <Ionicons name={'checkmark'} size={18} color={'white'} /> */}
              <FontAwesome6 name="check" size={18} color="white" solid />
            </Animated.View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: 'black',
                }}>
                Order Prepairing
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: 'black',
                }}>
                We are prepairing your tasty order
              </Text>
            </View>
          </>
        );
      } else {
        return (
          <>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 20 / 2,
                borderWidth: 2,
                borderColor: '#9c9c9c',
                marginRight: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 12 / 2,
                  backgroundColor: '#9c9c9c',
                }}
              />
            </View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: '#9c9c9c',
                }}>
                Order Prepairing
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: '#9c9c9c',
                }}>
                We are prepairing your tasty order
              </Text>
            </View>
          </>
        );
      }
    };

    const OrderDelivering = () => {
      var DineType = '';
      var Message = '';

      switch (this.state.dineType) {
        case 'EatIn':
          DineType = 'Order Dine In';
          Message = 'Awaiting dine in your tasty order';
          break;

        case 'PickUp':
          DineType = 'Order Pick Up';
          Message = 'Awaiting pick up your tasty order';
          break;

        case 'Delivery':
          DineType = 'Order Delivering';
          Message = 'Awaiting deliver your tasty order';
          break;

        default:
          break;
      }

      if (this.state.orderStatus === 'Delivering') {
        return (
          <>
            <View style={{marginRight: 25, marginLeft: -5}}>
              <WaveIndicator
                animating={true}
                interaction={true}
                size={30}
                color="black"
              />
            </View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
                  fontSize: 18,
                  color: 'black',
                }}>
                {DineType}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: 'black',
                }}>
                {Message}
              </Text>
            </View>
          </>
        );
      } else if (this.state.statusList.some(i => i === 'Delivering')) {
        return (
          <>
            <Animated.View
              style={[
                {
                  width: 25,
                  height: 25,
                  borderRadius: 25 / 2,
                  backgroundColor: 'black',
                  marginRight: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                {transform: [{scale: this.state.deliveryAnimate}]},
              ]}>
              {/* <Ionicons name={'checkmark'} size={18} color={'white'} /> */}
              <FontAwesome6 name="check" size={18} color="white" solid />
            </Animated.View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: 'black',
                }}>
                {DineType}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: 'black',
                }}>
                {Message}
              </Text>
            </View>
          </>
        );
      } else {
        return (
          <>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 20 / 2,
                borderWidth: 2,
                borderColor: '#9c9c9c',
                marginRight: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 12 / 2,
                  backgroundColor: '#9c9c9c',
                }}
              />
            </View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: '#9c9c9c',
                }}>
                {DineType}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: '#9c9c9c',
                }}>
                {Message}
              </Text>
            </View>
          </>
        );
      }
    };

    const OrderComplete = () => {
      if (this.state.orderStatus === 'Finish') {
        return (
          <>
            <Animated.View
              style={[
                {
                  width: 25,
                  height: 25,
                  borderRadius: 25 / 2,
                  backgroundColor: 'black',
                  marginRight: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                {transform: [{scale: this.state.deliveryAnimate}]},
              ]}>
              {/* <Ionicons name={'checkmark'} size={18} color={'white'} /> */}
              <FontAwesome6 name="check" size={18} color="white" solid />
            </Animated.View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: 'black',
                }}>
                Order Complete
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: 'black',
                }}>
                We completed your order
              </Text>
            </View>
          </>
        );
      } else {
        return (
          <>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 20 / 2,
                borderWidth: 2,
                borderColor: '#9c9c9c',
                marginRight: 30,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 12 / 2,
                  backgroundColor: '#9c9c9c',
                }}
              />
            </View>

            <View>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 18,
                  color: '#9c9c9c',
                }}>
                Order Complete
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  fontSize: 14,
                  color: '#9c9c9c',
                }}>
                We completed your order
              </Text>
            </View>
          </>
        );
      }
    };

    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            marginBottom: 10,
            alignItems: 'center',
          }}>
          {OrderProcessing()}
        </View>

        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center'}}>
          <View
            style={{
              width: 1,
              height: 40,
              backgroundColor: '#9c9c9c',
              marginLeft: 9,
            }}
          />
          {this.state.ReminderTime !== '' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 45,
              }}>
              {/* <Ionicons name="notifications" size={20} color={'red'} /> */}
              <FontAwesome6 name="bell" size={20} color="red" solid />
              <Text
                style={{
                  marginLeft: 10,
                  fontFamily:
                    Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                  color: 'red',
                }}>
                {moment
                  .utc(this.state.ReminderTime, 'HH:mm:ss Z')
                  .format('hh:mm:ss a')}
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginBottom: 10,
            marginTop: 10,
            alignItems: 'center',
          }}>
          {OrderAccepting()}
        </View>

        <View
          style={{
            width: 1,
            height: 40,
            backgroundColor: '#9c9c9c',
            marginLeft: 9,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            marginBottom: 10,
            marginTop: 10,
            alignItems: 'center',
          }}>
          {OrderPrepairing()}
        </View>

        <View
          style={{
            width: 1,
            height: 40,
            backgroundColor: '#9c9c9c',
            marginLeft: 9,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            marginBottom: 10,
            marginTop: 10,
            alignItems: 'center',
          }}>
          {OrderDelivering()}
        </View>

        <View
          style={{
            width: 1,
            height: 40,
            backgroundColor: '#9c9c9c',
            marginLeft: 9,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            marginBottom: 10,
            marginTop: 10,
            alignItems: 'center',
          }}>
          {OrderComplete()}
        </View>
      </View>
    );
  }

  GetReminderTime() {
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
            Para_Data: '106',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: this.state.orderID,
            Para_Direction: 'Input',
            Para_Lenth: 50000,
            Para_Name: '@Text1',
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
        if (json.CommonResult.Table.length !== 0) {
          const Time = json.CommonResult.Table[0].Time;
          this.setState({ReminderTime: Time});
        } else {
          this.setState({ReminderTime: ''});
        }
      });
  }
}
