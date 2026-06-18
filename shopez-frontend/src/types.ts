export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Product {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  imageUrl?: string; // Support both image and imageUrl
  countInStock?: number;
  stock?: number; // Support both stock naming conventions
}

export interface CartItem {
  _id?: string;
  product: Product; // Full product info
  quantity: number;
}

export interface OrderItem {
  _id?: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  _id?: string;
  id?: string;
  orderItems: OrderItem[];
  items?: any[];
  shippingAddress: string | {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
  totalPrice: number;
  totalAmount?: number;
  status?: string;
  isPaid?: boolean;
  paidAt?: string;
  isDelivered?: boolean;
  deliveredAt?: string;
  createdAt: string;
  user?: {
    _id?: string;
    name: string;
    email: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}
