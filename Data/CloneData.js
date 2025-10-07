// export const APIURL = "http://173.225.101.83:7874/api/AndroidApi/CommonExecute";

// ORIGINAL API
export const APIURL = 'http://apionlinecafe007.onimtait.lk/api/AndroidApi/CommonExecute';
export const PLACEORDERURL =
  'http://apionlinecafe007.onimtait.lk/api/android/onlineOrder';
export const OTPAPIURL =
  'http://apionlinecafe007.onimtait.lk/api/android/onlineOrderOTP';
export const ORDERVIEW = 'http://apionlinecafe007.onimtait.lk/api/android/OrderView';
export const SENDTESTNOTIFICTION =
  'http://apionlinecafe007.onimtait.lk/api/testrun/otpnotify';

// CLOUD TEST API
// export const APIURL = "http://173.225.101.83:9312/api/AndroidApi/CommonExecute";
// export const PLACEORDERURL = "http://173.225.101.83:9312/api/android/onlineOrder";
// export const OTPAPIURL = "http://173.225.101.83:9312/api/android/onlineOrderOTP";
// export const ORDERVIEW = "http://173.225.101.83:9312/api/android/OrderView";
// export const SENDTESTNOTIFICTION = "http://173.225.101.83:9312/api/testrun/otpnotify";

// OFFICE API
// export const APIURL = "http://173.225.101.83:9311/api/AndroidApi/CommonExecute";
// export const PLACEORDERURL = "http://192.168.1.60:8000/api/android/onlineOrder";
// export const OTPAPIURL = "http://173.225.101.83:9311/api/android/onlineOrderOTP";
// export const ORDERVIEW = "http://173.225.101.83:9311/api/android/OrderView";
// export const SENDTESTNOTIFICTION = "http://173.225.101.83:9311/api/testrun/otpnotify";

// Asap-Regular_Medium
// Asap-Regular
// Asap-Regular_Bold
// Asap-Regular_SemiBold

// Platform.OS === "ios" ? 'Asap-Regular_Medium' : 'AsapMedium'
// Platform.OS === "ios" ? 'Asap-Regular_SemiBold' : 'AsapSemiBold'
// Platform.OS === "ios" ? 'Asap-Regular' : 'AsapRegular'
// Platform.OS === "ios" ? 'Asap-Regular_Bold' : 'AsapBold'

// 1 - Processing
// 2 - Accept
// 3 - Prepairing
// 4 - Delivering
// 5 - Complete

export const CancelReason = [
  {
    id: 1,
    message: 'I want to order a different meal',
    isSelected: false,
  },
  {
    id: 2,
    message: 'I am getting a better price',
    isSelected: false,
  },
  {
    id: 3,
    message: 'I want to re-order using promo code',
    isSelected: false,
  },
  {
    id: 4,
    message: 'I places the order by mistake',
    isSelected: false,
  },
  {
    id: 5,
    message: 'Order not dispatched',
    isSelected: false,
  },
  {
    id: 6,
    message: 'Other',
    isSelected: false,
  },
  {
    id: 7,
    message: 'Not Satisfied',
    isSelected: false,
  },
];

export const Offers = [
  {
    id: 1,
    title: 'Best steak Re-Opening Resturant',
    description:
      'You can now enjoy 25% off every friday and saturday until the 27th march 2021 with your points. grab this amazing offer before expire. T&C apply.',
    imagepath: require('../assets/offer1.jpg'),
    promocode: 'ABCD123',
  },
  {
    id: 2,
    title: 'Kisko steak Re-Opening Resturant',
    description:
      'You can now enjoy 25% off every friday and saturday until the 27th march 2021 with your points. grab this amazing offer before expire. T&C apply.',
    imagepath: require('../assets/offer2.jpg'),
    promocode: 'EFGH123',
  },
];

export const FoodAddons = [
  {
    id: 0,
    addonsId: 90,
    name: 'Extra Sugar',
    price: 20,
  },
  {
    id: 1,
    addonsId: 91,
    name: 'Extra Caffein',
    price: 40,
  },
  {
    id: 2,
    addonsId: 92,
    name: 'Extra French Fry',
    price: 60,
  },
  {
    id: 3,
    addonsId: 93,
    name: 'Extra Eggs',
    price: 80,
  },
];

export const AdditionalFoodAddons = [
  {
    id: 0,
    extraId: 80,
    name: 'Chicken Leg',
    price: 100,
  },
  {
    id: 1,
    extraId: 81,
    name: 'Sausage',
    price: 80,
  },
];
