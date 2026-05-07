import React from 'react';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import { Platform } from 'react-native';
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
import PopularScreen from '../Screens/PopularScreen';
import NewlyAddedScreen from '../Screens/NewlyAddedScreen';
import TrendingScreen from '../Screens/TrendingScreen';
import { useTheme } from '../Context/ThemeContext';

const Stack = createStackNavigator();

const AuthStackNavigation = ({
  isClick,
  isVisible,
  OTPNotification,
  isLoading,
  isUpdated,
}) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="LoginScreen"
        options={{
          presentation: 'modal',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          headerShown: false,
          gestureEnabled: true,
          cardStyle: { backgroundColor: theme.bg },
        }}
      >
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
          cardStyle: { backgroundColor: theme.bg },
        }}
      />
      <Stack.Screen
        name="AddInfoScreen"
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      >
        {props => <AddInfoScreen {...props} isLoading={isLoading} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const StackNavigation = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
        cardStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="DashboardScreen"
        component={DashboardScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="ItemScreen"
        component={ItemScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="RatingScreen"
        component={RatingScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forRevealFromBottomAndroid,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="PromotionsScreen"
        component={PromotionsScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="PopularScreen"
        component={PopularScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="NewlyAddedScreen"
        component={NewlyAddedScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="TrendingScreen"
        component={TrendingScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />
    </Stack.Navigator>
  );
};

const ItemSearchStackNavigation = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        cardStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="ProductListScreen"
        component={ProductListScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="ItemScreen"
        component={ItemScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />
    </Stack.Navigator>
  );
};

const CartStackNavigation = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        cardStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="CartScreen"
        component={CartScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            if (navigation.canGoBack()) {
              navigation.popToTop();
            }
          },
        })}
      />

      <Stack.Screen
        name="ItemScreen"
        component={ItemScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forScaleFromCenterAndroid,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="CreditCardScreen"
        component={CreditCardScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forScaleFromCenterAndroid,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="OrderDetailsScreen"
        component={OrderDetailsScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="OrderCancelScreen"
        component={OrderCancelScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="OrderScreen"
        component={OrderScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />
    </Stack.Navigator>
  );
};

const OrderStackNavigation = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forScaleFromCenterAndroid,
        cardStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="OrderScreen"
        component={OrderScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="OrderDetailsScreen"
        component={OrderDetailsScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="OrderCancelScreen"
        component={OrderCancelScreen}
        options={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />
    </Stack.Navigator>
  );
};

const AccountStackNavigation = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        cardStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="AccountScreen"
        component={AccountScreen}
        options={{
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="CreditCardScreen"
        component={CreditCardScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forScaleFromCenterAndroid,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
        }}
      />

      <Stack.Screen
        name="EditInfoScreen"
        component={EditInfoScreen}
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forScaleFromCenterAndroid,
          headerShown: false,
          cardStyle: { backgroundColor: theme.bg },
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