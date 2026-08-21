import React, { useContext } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  AccountStackNavigation,
  CartStackNavigation,
  ItemSearchStackNavigation,
  OrderStackNavigation,
  StackNavigation,
} from './StackNavigation';
import { connect } from 'react-redux';
import { getFocusedRouteNameFromRoute } from '@react-navigation/core';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import NetworkContext from '../Components/NetworkContext';
import OfflineBanner from '../Components/OfflineBanner';

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

const iconMap = {
  Home: { name: 'house' },
  Search: { name: 'magnifying-glass' },
  Cart: { name: 'cart-shopping' },
  Orders: { name: 'basket-shopping' },
  Account: { name: 'user' },
};

const BottomTabNavigation = props => {
  const { isOffline } = useContext(NetworkContext);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
      initialRouteName="Home"
      safeAreaInsets={{ bottom: 0, top: 0 }}
      screenListeners={{
        tabPress: e => {
          if (isOffline) {
            e.preventDefault();
          }
        },
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconInfo = iconMap[route.name];
          if (!iconInfo) return null;
          return (
            <FontAwesome6
              name={iconInfo.name}
              size={25}
              color={color}
              solid={focused}
            />
          );
        },
        tabBarStyle: { height: 50 },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 5,
        },
        tabBarIconStyle: { marginTop: 5 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: activeTintLabelColor,
        tabBarInactiveTintColor: inactiveTintLabelColor,
        tabBarHideOnKeyboard: false,
        headerShown: false,
      })}
      animationEnabled={true}
    >
      <Tab.Screen
        name="Home"
        component={StackNavigation}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
        })}
      />
      <Tab.Screen name="Search" component={ItemSearchStackNavigation} />
      <Tab.Screen
        name="Cart"
        component={CartStackNavigation}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
          tabBarBadge:
            props.cartItems && props.cartItems.length > 0
              ? props.cartItems.length
              : null,
        })}
        listeners={({ navigation }) => ({
          tabPress: e => {
            // Get the current state
            const state = navigation.getState();
            const cartStack = state.routes.find(r => r.name === 'Cart');

            // If we're on CheckoutScreen or any other screen in Cart stack
            if (cartStack?.state?.index > 0) {
              // Prevent default behavior
              e.preventDefault();

              // Navigate to the Cart tab and reset to CartScreen
              navigation.navigate('Cart', {
                screen: 'CartScreen',
              });
            }
          },
        })}
      />
      <Tab.Screen
        name="Orders"
        component={OrderStackNavigation}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
        })}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackNavigation}
        options={({ route }) => ({
          tabBarVisible: getTabBarVisible(route),
        })}
      />
      </Tab.Navigator>

      <OfflineBanner visible={isOffline} />
    </View>
  );
};

const mapStateToProps = state => {
  return {
    cartItems: state,
  };
};

export default connect(mapStateToProps)(BottomTabNavigation);
