import React from 'react';
import {
  Animated,
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  KeyboardAvoidingView,
  Alert,
  BackHandler,
  ToastAndroid,
} from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
import {APIURL, CancelReason} from '../Data/CloneData';
// import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

export default class OrderCancelScreen extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      OrderID: this.props.route.params.OrderID,
      CancelReason: CancelReason,
      flatID: 0,
    };
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);

    if (this.state.PreScreen === 'OrderScreen') {
      this.setState({backStatus: '1'});
      console.log('1');
    } else {
      this.setState({backStatus: '0'});
      console.log('2');
    }

    console.log('33');
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
  }

  handleBackButton() {
    //       ToastAndroid.show("POPO",ToastAndroid.SHORT)
    return true;
  }

  renderReason = ({item}) => {
    return (
      <TouchableOpacity
        style={{flex: 1, margin: 5, justifyContent: 'space-between'}}
        onPress={() => this.onReasonClick(item.id)}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: item.isSelected ? 'black' : '#bfbfbf',
            borderWidth: 1,
            backgroundColor: item.isSelected ? 'black' : null,
            borderRadius: 5,
          }}>
          <Text
            style={{
              paddingLeft: 10,
              paddingRight: 10,
              paddingBottom: 5,
              paddingTop: 5,
              textAlign: 'center',
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
              fontSize: 16,
              color: item.isSelected ? 'white' : '#7d7d7d',
            }}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  onReasonClick = ReasonID => {
    const list = this.state.CancelReason;
    const index = list.findIndex(i => i.id === ReasonID);
    list[index].isSelected = !list[index].isSelected;

    if (list[5].isSelected) {
      this.setState({isClickAddReason: true});
    } else {
      this.setState({isClickAddReason: false});
    }

    this.setState({CancelReason: list, flatID: this.state.flatID + 1});
  };

  render() {
    return (
      <View style={{flex: 1}}>
        <View
          style={{
            flexDirection: 'row',
            marginLeft: 30,
            marginTop: 30,
            marginBottom: 20,
          }}>
          {/*<TouchableOpacity onPress={() => this.RBSheet.close()}>*/}
          <TouchableOpacity
            onPress={() =>
              this.props.navigation.navigate('OrderDetailsScreen', {
                OrderID: this.state.OrderID,
                Screen: 'OrderScreen',
              })
            }>
            {/* <Ionicons name={'close-outline'} size={30} color={'black'} /> */}
            <FontAwesome6 name="xmark" size={30} color="black" solid />

          </TouchableOpacity>
          <Text
            style={{
              fontFamily:
                Platform.OS === 'ios' ? 'Asap-Regular_Bold' : 'AsapBold',
              fontSize: 18,
              color: 'black',
              alignSelf: 'center',
              marginLeft: 30,
            }}>
            Add order cancel remark
          </Text>
        </View>

        <Text
          style={{
            fontFamily: Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
            fontSize: 16,
            color: 'black',
            alignSelf: 'center',
            marginLeft: 30,
            marginRight: 30,
            textAlign: 'center',
            marginBottom: 10,
          }}>
          Cancelling the seleted orders will ber disable them from being
          processed. If the sales channel is not notified, these orders can't be
          restored.{' '}
        </Text>

        <View style={{marginLeft: 30, marginRight: 30, marginBottom: 10}}>
          <FlatList
            key={this.state.flatID}
            extraData={this.state}
            data={this.state.CancelReason}
            keyExtractor={(item, index) => index.toString()}
            renderItem={this.renderReason}
            numColumns={2}
          />
        </View>

        <KeyboardAvoidingView
          key={this.state.flatID}
          behavior={this.state.isClickAddReason ? 'position' : 'padding'}
          keyboardVerticalOffset={25}
          contentContainerStyle={{
            flex: 1,
            backgroundColor: 'white',
          }}
          style={{flex: 1}}>
          {this.state.isClickAddReason ? (
            <TextInput
              ref={ref => {
                this.textinputRef = ref;
              }}
              style={{
                backgroundColor: '#f0f0f0',
                height: 100,
                paddingLeft: 20,
                borderRadius: 5,
                borderColor: '#dbdbdb',
                borderWidth: 1,
                fontSize: 16,
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular' : 'AsapRegular',
                justifyContent: 'center',
                color: 'black',
                textAlignVertical: 'top',
                marginLeft: 30,
                marginRight: 30,
              }}
              onPressOut={() => this.textinputRef.focus()}
              multiline={true}
              blurOnSubmit={true}
              keyboardType={'default'}
              placeholderTextColor={'#7a7a7a'}
              returnKeyType="done"
              onChangeText={remark => this.setState({CancelRemark: remark})}
            />
          ) : null}
        </KeyboardAvoidingView>
        {/* onPress={() => this.onOrderCancelPress()} */}
        <TouchableOpacity
          style={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginBottom: 10,
            marginRight: 5,
            marginLeft: 5,
            marginTop: 10,
          }}
          onPress={() => this.onCancelSubmitPress()}>
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
                fontFamily:
                  Platform.OS === 'ios' ? 'Asap-Regular_Medium' : 'AsapMedium',
                fontSize: 18,
              }}>
              Submit
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  onCancelSubmitPress = () => {
    if (!this.CanceltouchableInactive) {
      this.CanceltouchableInactive = true;
      var Reason = '';
      var Selected = this.state.CancelReason.filter(i => i.isSelected === true);

      switch (Selected.length) {
        case 1:
          Reason = Selected[0].message;
          break;
        case 2:
          Reason = Selected[0].message + ' | ' + Selected[1].message;
          break;
        case 3:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message;
          break;
        case 4:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message +
            ' | ' +
            Selected[3].message;
          break;
        case 5:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message +
            ' | ' +
            Selected[3].message +
            ' | ' +
            Selected[4].message;
          break;
        case 6:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message +
            ' | ' +
            Selected[3].message +
            ' | ' +
            Selected[4].message +
            ' | ' +
            Selected[5].message;
          break;
        case 7:
          Reason =
            Selected[0].message +
            ' | ' +
            Selected[1].message +
            ' | ' +
            Selected[2].message +
            ' | ' +
            Selected[3].message +
            ' | ' +
            Selected[4].message +
            ' | ' +
            Selected[5].message +
            ' | ' +
            Selected[6].message;
          break;

        default:
          break;
      }

      if (this.state.isClickAddReason) {
        if (this.state.CancelRemark !== '') {
          Reason = Reason + ' | ' + this.state.CancelRemark;
          this.onOrderCancelPress(Reason);
        } else {
          Alert.alert('Warning', 'Type your reason');
          this.CanceltouchableInactive = false;
        }
      } else {
        this.onOrderCancelPress(Reason);
      }
    }
  };

  onOrderCancelPress = Reason => {
    fetch(APIURL, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        HasReturnData: 'F',
        Parameters: [
          {
            Para_Data: '103',
            Para_Direction: 'Input',
            Para_Lenth: 10,
            Para_Name: '@Iid',
            Para_Type: 'int',
          },
          {
            Para_Data: this.state.OrderID,
            Para_Direction: 'Input',
            Para_Lenth: 50000,
            Para_Name: '@Text1',
            Para_Type: 'varchar',
          },
          {
            Para_Data: Reason,
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
        if (json.strRturnRes) {
          // this.RBSheet.close();

          this.props.navigation.navigate('OrderScreen', {
            OrderID: this.state.OrderID,
            Screen: 'OrderCancelScreen',
          });
        } else {
          // this.RBSheet.close();
          this.CanceltouchableInactive = false;
          Alert.alert('Warning', 'Your order not completely canceled');
        }
      })
      .catch(er => {
        console.log('onOrderCancelPress', er);
        // this.RBSheet.close();
        this.CanceltouchableInactive = false;
        Alert.alert('Error', 'Your order canceled operation failure');
      });
  };
}
