import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const getEffectivePrice = (item) => {
  return item.discountPrice && item.discountPrice < item.price ? item.discountPrice : item.price;
};

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
      return [...prevItems, { ...product, quantity }];
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

  const cartTotal = cartItems.reduce((total, item) => total + (getEffectivePrice(item) * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      getEffectivePrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
