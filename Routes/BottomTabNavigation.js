import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  AccountStackNavigation,
  CartStackNavigation,
  ItemSearchStackNavigation,
  OrderStackNavigation,
  StackNavigation,
} from './StackNavigation';
import {connect} from 'react-redux';
import {getFocusedRouteNameFromRoute} from '@react-navigation/core';

const activeTintLabelColor = 'black';
const inactiveTintLabelColor = '#808080';
const Tab = createBottomTabNavigator();

const getTabBarVisible = route => {
  const routeName = getFocusedRouteNameFromRoute(route);

  if (routeName === 'CheckoutScreen') {
    return false;
  } else if (routeName === 'CreditCardScreen') {
    return false;
  } else if (routeName === 'EditInfoScreen') {
    return false;
  } else if (routeName === 'RatingScreen') {
    return false;
  } else if (routeName === 'OrderDetailsScreen') {
    return false;
  } else if (routeName === 'OrderCancelScreen') {
    return false;
  }
  return true;
};

const BottomTabNavigation = props => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      safeAreaInsets={{bottom: 0, top: 0}}
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home-sharp' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
            // return <CartIcon IconName={iconName} />
          } else if (route.name === 'Orders') {
            iconName = focused ? 'basket' : 'basket-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={30} color={color} />;
        },
        tabBarStyle: {height: 50},
        tabBarLabelStyle: {fontSize: 12, fontWeight: 'bold', marginBottom: 5},
        tabBarIconStyle: {marginTop: 5},
        tabBarShowLabel: false,
        tabBarActiveTintColor: activeTintLabelColor,
        tabBarInactiveTintColor: inactiveTintLabelColor,
        tabBarHideOnKeyboard: false,
        headerShown: false,
      })}
      animationEnabled={true}>
      <Tab.Screen
        name="Home"
        component={StackNavigation}
        options={({route}) => ({tabBarVisible: getTabBarVisible(route)})}
      />

      <Tab.Screen name="Search" component={ItemSearchStackNavigation} />

      <Tab.Screen
        name="Cart"
        component={CartStackNavigation}
        options={({route}) => ({
          tabBarVisible: getTabBarVisible(route),
          tabBarBadge:
            props.cartItems.length === 0 ? null : props.cartItems.length,
        })}
      />

      <Tab.Screen
        name="Orders"
        component={OrderStackNavigation}
        options={({route}) => ({tabBarVisible: getTabBarVisible(route)})}
      />

      <Tab.Screen
        name="Account"
        component={AccountStackNavigation}
        options={({route}) => ({tabBarVisible: getTabBarVisible(route)})}
      />
    </Tab.Navigator>
  );
};

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

export default connect(mapStateToProps)(BottomTabNavigation);
