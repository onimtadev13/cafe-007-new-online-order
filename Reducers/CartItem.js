const initialState = {
  products: [],
};
const CartItems = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      // console.log(state.findIndex(x => x.ProductName === action.payload.ProductName));
      // return [...state, action.payload]
      if (
        state.some(product => product.CartItemID === action.payload.CartItemID)
      ) {
        // return [...state, action.payload]
        return state.map(product =>
          product.CartItemID === action.payload.CartItemID
            ? {
                ...product,
                Qty: action.payload.Qty,
                Addons: action.payload.Addons,
              }
            : product,
        );
      }
      return [...state, action.payload];

    case 'UPDATE_FROM_CART':
      return state.map((product, index) =>
        index === action.payload.index
          ? {
              ...product,
              Qty: action.payload.Qty,
              Amount: action.payload.Amount,
              NetTotal: action.payload.NetTotal,
              Addons: action.payload.Addons,
              Extra: action.payload.Extra,
            }
          : product,
      );
    case 'REMOVE_FROM_CART':
      return state.filter((cartItem, index) => index !== action.payload.index);
    case 'RESET_CART':
      return [];
  }

  return state;
};

export default CartItems;
