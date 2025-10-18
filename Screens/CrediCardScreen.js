import React, {PureComponent} from 'react';
import {Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native';
// import IonicIcon from 'react-native-vector-icons/Ionicons';
import {CreditCardInput} from '@rajeshsmallarc/react-native-creditcard';
import {openDatabase} from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

var db = openDatabase({name: 'UserDatabase.db'});

export default class CreditCardScreen extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isValid: false,
      number: '',
      expiry: '',
      cvc: '',
      type: '',
      name: '',
    };
  }

  onSaveCardPress = () => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM credit_card where card_number = ?',
          [this.state.number],
          (tx, results) => {
            var len = results.rows.length;
            if (len > 0) {
              Alert.alert(
                'Alert',
                'This card already registered',
                [
                  {
                    text: 'Go Back',
                    onPress: () => this.props.navigation.goBack(),
                  },
                ],
                {cancelable: false},
              );
            } else {
              this.saveCard();
            }
          },
        );
      });
    } catch (error) {
      console.log(error);
    }
  };

  saveCard = async () => {
    var userID = await AsyncStorage.getItem('phonenumber');
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO credit_card (user_name, card_type, card_number, card_exp, card_cvv, userID) VALUES (?,?,?,?,?,?)',
        [
          this.state.name,
          this.state.type,
          this.state.number,
          this.state.expiry,
          this.state.cvc,
          userID,
        ],
        (tx, results) => {
          console.log('Results', results.rowsAffected);
          if (results.rowsAffected > 0) {
            Alert.alert(
              'Success',
              'You are Card Registered Successfully',
              [
                {
                  text: 'Ok',
                  onPress: () => this.props.navigation.goBack(),
                },
              ],
              {cancelable: false},
            );
          } else Alert.alert('Registration Failed');
        },
      );
    });
  };

  render() {
    return (
      <View style={{flex: 1}}>
        <TouchableOpacity onPress={() => this.props.navigation.goBack()}>
          {/* <IonicIcon name="chevron-back" size={35} style={{margin: 30}} /> */}
           <FontAwesome6 name="chevron-left" size={35} style={{ margin: 30 }} solid />
        </TouchableOpacity>
        <ScrollView>
          <CreditCardInput
            onChange={card => {
              this.setState({
                isValid: card.valid,
                number: card.values.number,
                expiry: card.values.expiry,
                cvc: card.values.cvc,
                type: card.values.type,
                name: card.values.name,
              });
            }}
            requiresName
            validColor={'black'}
            invalidColor={'red'}
            inputStyle={{
              color: 'black',
              backgroundColor: '#f0f0f0',
              height: 40,
              paddingLeft: 25,
              borderRadius: 5,
              borderColor: '#dbdbdb',
              borderWidth: 1,
              fontSize: 18,
              fontFamily: 'AsapRegular',
            }}
            labelStyle={{
              fontFamily: 'AsapRegular',
              fontSize: 18,
              margin: 10,
              color: 'black',
            }}
            inputContainerStyle={{}}
            labels={{
              name: 'Card Holder Name',
              number: 'Card Number',
              expiry: 'Exp.date',
              cvc: 'CVV',
            }}
            placeholders={{
              name: 'Card Holder Name',
              number: 'Card Number',
              expiry: 'MM/YY',
              cvc: 'CVV',
            }}
            placeholderColor={'#7a7a7a'}
          />

          <TouchableOpacity
            disabled={!this.state.isValid}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -10,
              marginLeft: 30,
              marginRight: 30,
              marginBottom: 30,
            }}
            onPress={() => this.onSaveCardPress()}>
            <View
              style={{
                width: '100%',
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: this.state.isValid ? 'black' : '#cfcfcf',
              }}>
              <Text
                style={{
                  color: 'white',
                  fontFamily: 'AsapMedium',
                  fontSize: 18,
                }}>
                Save
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}
