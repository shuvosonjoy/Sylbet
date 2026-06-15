import React, { createContext, useState, useContext, useEffect } from 'react';
import { getEffectiveUnitPrice, computeDeliveryChargeTotal, computeSubtotal } from '../utils/pricing';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('sylbets_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('sylbets_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    if (product.stock <= 0) return false;

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (newQty > product.stock) return prevItems;
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: newQty }
            : item
        );
      }
      if (quantity > product.stock) return prevItems;
      // Persist deliveryCharge alongside the cart item so cart math survives
      // a page reload even if the product is later edited.
      return [...prevItems, { ...product, quantity, deliveryCharge: Number(product.deliveryCharge) || 0 }];
    });
    return true;
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item => {
        if (item._id === productId) {
          const maxQty = item.stock || 999;
          return { ...item, quantity: Math.min(quantity, maxQty) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartSubtotal = computeSubtotal(cartItems);
  const cartDeliveryCharge = computeDeliveryChargeTotal(cartItems);
  const cartTotal = cartSubtotal + cartDeliveryCharge;
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const getEffectivePrice = getEffectiveUnitPrice;

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartSubtotal,
      cartDeliveryCharge,
      cartTotal,
      cartCount,
      getEffectivePrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
