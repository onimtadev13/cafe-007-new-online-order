import React from 'react';
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
import { withTheme } from '../Context/ThemeContext';

const Tab = createBottomTabNavigator();

const getTabBarVisible = route => {
  const routeName = getFocusedRouteNameFromRoute(route);
  const hiddenScreens = [
    'CheckoutScreen',
    'CreditCardScreen',
    'EditInfoScreen',
    'RatingScreen',
    'OrderDetailsScreen',
    'OrderCancelScreen',
  ];
  return !hiddenScreens.includes(routeName);
};

const iconMap = {
  Home: { name: 'house' },
  Search: { name: 'magnifying-glass' },
  Cart: { name: 'cart-shopping' },
  Orders: { name: 'basket-shopping' },
  Account: { name: 'user' },
};

const BottomTabNavigation = props => {
  const { theme } = props;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      safeAreaInsets={{ bottom: 0, top: 0 }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
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

        // ── Theme-aware tab bar styles ──────────────────────────────
        tabBarStyle: {
          height: 50,
          backgroundColor: theme.card,
          borderTopColor: theme.separator,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 5,
        },
        tabBarIconStyle: { marginTop: 5 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textMuted,
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
            const state = navigation.getState();
            const cartStack = state.routes.find(r => r.name === 'Cart');
            if (cartStack?.state?.index > 0) {
              e.preventDefault();
              navigation.navigate('Cart', { screen: 'CartScreen' });
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
  );
};

const mapStateToProps = state => ({ cartItems: state });

export default connect(mapStateToProps)(withTheme(BottomTabNavigation));
