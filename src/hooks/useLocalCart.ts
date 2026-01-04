/**
 * Local Storage Cart Management
 * Persists cart items for logged-out users
 */

export interface LocalCartItem {
  product_id: string;
  quantity: number;
  added_at: string;
}

const LOCAL_CART_KEY = "glam_guest_cart";

export const getLocalCart = (): LocalCartItem[] => {
  try {
    const stored = localStorage.getItem(LOCAL_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const setLocalCart = (items: LocalCartItem[]): void => {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
};

export const addToLocalCart = (productId: string, quantity: number = 1): LocalCartItem[] => {
  const cart = getLocalCart();
  const existingIndex = cart.findIndex((item) => item.product_id === productId);

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({
      product_id: productId,
      quantity,
      added_at: new Date().toISOString(),
    });
  }

  setLocalCart(cart);
  return cart;
};

export const updateLocalCartItem = (productId: string, quantity: number): LocalCartItem[] => {
  const cart = getLocalCart();
  const index = cart.findIndex((item) => item.product_id === productId);

  if (index >= 0) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
  }

  setLocalCart(cart);
  return cart;
};

export const removeFromLocalCart = (productId: string): LocalCartItem[] => {
  const cart = getLocalCart().filter((item) => item.product_id !== productId);
  setLocalCart(cart);
  return cart;
};

export const clearLocalCart = (): void => {
  try {
    localStorage.removeItem(LOCAL_CART_KEY);
  } catch (error) {
    console.error("Failed to clear local cart:", error);
  }
};

export const getLocalCartCount = (): number => {
  return getLocalCart().reduce((sum, item) => sum + item.quantity, 0);
};
