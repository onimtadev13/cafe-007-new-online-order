import React from 'react';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import HomeScreen from '../Screens/HomeScreen';
import ItemScreen from '../Screens/ItemScreen';
import CartScreen from '../Screens/CartScreen';
import CheckoutScreen from '../Screens/CheckoutScreen';
import AccountScreen from '../Screens/AccountScreen';
import CreditCardScreen from '../Screens/CrediCardScreen';
import EditInfoScreen from '../Screens/EditInfoScreen';
import LoginScreen from '../Screens/LoginScreen';
import AddInfoScreen from '../Screens/AddInfoScreen';
import DashboardScreen from '../Screens/DashboardScreen';
import RatingScreen from '../Screens/RatingScreen';
import SearchScreen from '../Screens/SearchScreen';
import ProductListScreen from '../Screens/ProductListScreen';
import OrderDetailsScreen from '../Screens/OrderDetailsScreen';
import OrderScreen from '../Screens/OrderScreen';
import OrderCancelScreen from '../Screens/OrderCancelScreen';
import BottomTabNavigation from './BottomTabNavigation';
import PromotionsScreen from '../Screens/PromotionsScreen';

const Stack = createStackNavigator();

const AuthStackNavigation = ({
  isClick,
  isVisible,
  OTPNotification,
  isLoading,
  isUpdated,
}) => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      
      <Stack.Screen
        name="LoginScreen"
        // options={{
        //   cardStyleInterpolator:
        //     CardStyleInterpolators.forFadeFromBottomAndroid,
        //   headerShown: false,
        // }}
        options={{
          presentation: 'modal',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          headerShown: false,
          gestureEnabled: true,
        }}>
        {props => (
          <LoginScreen
            {...props}
            isClick={isClick}
            isVisible={isVisible}
            OTPNotification={OTPNotification}
            isUpdated={isUpdated}
          />
          
        )}
      </Stack.Screen>
      
      <Stack.Screen
        name="DashboardScreen"
        component={DashboardScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="AddInfoScreen"
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
        }}>
        {props => <AddInfoScreen {...props} isLoading={isLoading} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const StackNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
      }}>
      {/*<Stack.Screen*/}
      {/*    name="BottomTabNavigation"*/}
      {/*    component={BottomTabNavigation}*/}
      {/*    options={{*/}
      {/*        headerShown: false*/}
      {/*    }}*/}
      {/*/>*/}


      <Stack.Screen
        name="DashboardScreen"
        component={DashboardScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ItemScreen"
        component={ItemScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="RatingScreen"
        component={RatingScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forRevealFromBottomAndroid,
          headerShown: false,
        }}
      />
      

      <Stack.Screen
        name="PromotionsScreen"
        component={PromotionsScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const ItemSearchStackNavigation = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ProductListScreen"
        component={ProductListScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ItemScreen"
        component={ItemScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

const CartStackNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <Stack.Screen
        name="CartScreen"
        component={CartScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="ItemScreen"
        component={ItemScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forScaleFromCenterAndroid,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CreditCardScreen"
        component={CreditCardScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forScaleFromCenterAndroid,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="OrderDetailsScreen"
        component={OrderDetailsScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name={'OrderCancelScreen'}
        component={OrderCancelScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="OrderScreen"
        component={OrderScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const OrderStackNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forScaleFromCenterAndroid,
      }}>
      <Stack.Screen
        name="OrderScreen"
        component={OrderScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="OrderDetailsScreen"
        component={OrderDetailsScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name={'OrderCancelScreen'}
        component={OrderCancelScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

const AccountStackNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}>
      <Stack.Screen
        name="AccountScreen"
        component={AccountScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="CreditCardScreen"
        component={CreditCardScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forScaleFromCenterAndroid,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="EditInfoScreen"
        component={EditInfoScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forScaleFromCenterAndroid,
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export {
  AuthStackNavigation,
  StackNavigation,
  ItemSearchStackNavigation,
  CartStackNavigation,
  OrderStackNavigation,
  AccountStackNavigation,
};
