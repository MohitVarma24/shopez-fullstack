import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API from '../lib/api';
import { User, CartItem, Product } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  cart: CartItem[];
  cartCount: number;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCartState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to decode JWT token
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT token', e);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Derive if user is an admin
  const isAdmin = user?.role === 'admin';

  // Calculate cart items count
  const cartCount = cart.reduce((count, item) => count + (item.quantity || 1), 0);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('shopez_token');
      if (storedToken) {
        try {
          setToken(storedToken);
          const decoded = parseJwt(storedToken);
          
          if (decoded) {
            // Reconstruct user payload from JWT
            const userData: User = {
              id: decoded.id || decoded._id || decoded.sub || '',
              name: decoded.name || decoded.username || 'User',
              email: decoded.email || '',
              role: decoded.role || 'user',
            };
            setUser(userData);
            
            // Set the token inside local storage to be sure
            localStorage.setItem('shopez_token', storedToken);
            
            // Fetch cart right after auth loads
            try {
              // We'll perform GET /api/cart, but wrapped so failures don't crash auth state
              const res = await API.get('/api/cart');
              parseAndSetCart(res.data);
            } catch (err) {
              console.warn('Could not load cart during init', err);
            }
          } else {
            // Invalid token
            logout();
          }
        } catch (error) {
          console.error('Error during auth initialization', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Set cart helper that handles various backend structures safely
  const parseAndSetCart = (data: any) => {
    if (!data) {
      setCart([]);
      return;
    }
    
    // Check if the data itself is an array of items
    if (Array.isArray(data)) {
      setCart(data);
      return;
    }

    // Check if nested in nested properties
    if (data.items && Array.isArray(data.items)) {
      setCart(data.items);
      return;
    }

    if (data.cartItems && Array.isArray(data.cartItems)) {
      setCart(data.cartItems);
      return;
    }

    if (data.cart && Array.isArray(data.cart)) {
      setCart(data.cart);
      return;
    }

    if (data.cart && data.cart.items && Array.isArray(data.cart.items)) {
      setCart(data.cart.items);
      return;
    }

    if (data.cart && data.cart.cartItems && Array.isArray(data.cart.cartItems)) {
      setCart(data.cart.cartItems);
      return;
    }

    // Otherwise fallback
    setCart([]);
  };

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await API.get('/api/cart');
      parseAndSetCart(res.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!token) {
      throw new Error('Please login to manage your cart');
    }
    try {
      // POST /api/cart with quantity & productId. 
      // Many backends support both payload structures:
      // { productId, quantity } or { product: productId, quantity }
      const res = await API.post('/api/cart', { productId, quantity });
      
      // Refresh cart or use returned cart
      await fetchCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!token) return;
    try {
      // DELETE /api/cart/:productId
      await API.delete(`/api/cart/${productId}`);
      await fetchCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCartState = () => {
    setCart([]);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await API.post('/api/auth/login', { email, password });
      
      // Get token from login response
      const loginToken = res.data.token || res.data.accessToken;
      if (!loginToken) {
        throw new Error('No token received from backend');
      }

      localStorage.setItem('shopez_token', loginToken);
      setToken(loginToken);

      // Parse payload to build user profile
      const decoded = parseJwt(loginToken);
      
      // Some backends return user profile directly as part of the response
      const userProfile = res.data.user || {};
      
      const userData: User = {
        id: userProfile.id || userProfile._id || decoded?.id || decoded?._id || decoded?.sub || '',
        name: userProfile.name || decoded?.name || decoded?.username || 'User',
        email: userProfile.email || email,
        role: userProfile.role || decoded?.role || 'user',
      };

      setUser(userData);
      
      // Fetch cart immediately for this authenticated user
      try {
        const cartRes = await API.get('/api/cart');
        parseAndSetCart(cartRes.data);
      } catch (cErr) {
        console.warn('Could not fetch cart on login', cErr);
      }

      setLoading(false);
      return res.data;
    } catch (error: any) {
      setLoading(false);
      console.error('Error loggin in:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      // POST /api/auth/register
      const res = await API.post('/api/auth/register', { name, email, password });
      
      // Some registers automatically log the user in and return a token, 
      // otherwise user needs to sign in manually. We check if a token was returned.
      const registerToken = res.data.token || res.data.accessToken;
      if (registerToken) {
        localStorage.setItem('shopez_token', registerToken);
        setToken(registerToken);

        const decoded = parseJwt(registerToken);
        const userProfile = res.data.user || {};
        
        const userData: User = {
          id: userProfile.id || userProfile._id || decoded?.id || decoded?._id || decoded?.sub || '',
          name: userProfile.name || name || decoded?.name || 'User',
          email: userProfile.email || email,
          role: userProfile.role || decoded?.role || 'user',
        };

        setUser(userData);
        await fetchCart();
      }
      
      setLoading(false);
      return res.data;
    } catch (error) {
      setLoading(false);
      console.error('Error registering:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('shopez_token');
    setUser(null);
    setToken(null);
    setCart([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        cart,
        cartCount,
        login,
        register,
        logout,
        fetchCart,
        addToCart,
        removeFromCart,
        clearCartState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
