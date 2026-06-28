import React, { createContext, useState, useContext, useEffect } from 'react';
import { getEffectiveUnitPrice, computeDeliveryChargeTotal, computeSubtotal } from '../utils/pricing';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const getCartKey = (product, variant) => {
  if (variant?.variantId) return `${product._id}-${variant.variantId}`;
  return product._id;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('sylbets_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('sylbets_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, variant = null) => {
    const stock = variant ? variant.stock : product.stock;
    if (stock <= 0) return false;

    const cartKey = getCartKey(product, variant);

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.cartKey === cartKey);
      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (newQty > stock) return prevItems;
        return prevItems.map(item =>
          item.cartKey === cartKey
            ? { ...item, quantity: newQty }
            : item
        );
      }
      if (quantity > stock) return prevItems;

      const cartItem = {
        ...product,
        cartKey,
        quantity,
        deliveryCharge: variant
          ? Number(variant.deliveryCharge ?? product.deliveryCharge) || 0
          : Number(product.deliveryCharge) || 0,
      };

      if (variant) {
        cartItem.variantId = variant.variantId;
        cartItem.variantOptions = variant.variantOptions;
        cartItem.price = variant.price;
        cartItem.salePrice = variant.salePrice;
        cartItem.stock = variant.stock;
        if (variant.images?.length > 0) {
          cartItem.image = variant.images[0];
          cartItem.images = variant.images;
        }
      }

      return [...prevItems, cartItem];
    });
    return true;
  };

  const removeFromCart = (cartKey) => {
    setCartItems(prevItems => prevItems.filter(item => (item.cartKey || item._id) !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item => {
        if ((item.cartKey || item._id) === cartKey) {
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
