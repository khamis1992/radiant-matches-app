export type ProductType = 'physical' | 'digital' | 'bundle' | 'gift_card';

export type ProductCategory =
  | 'makeup'
  | 'beauty_tools'
  | 'skincare'
  | 'accessories'
  | 'tutorial'
  | 'guide'
  | 'consultation'
  | 'bundle'
  | 'gift_card';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Product {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  product_type: ProductType;
  category: ProductCategory;
  price_qar: number;
  compare_at_price: number | null;
  images: string[];
  inventory_count: number;
  digital_content_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductOrderItem {
  product_id: string;
  product_title: string;
  product_image: string;
  quantity: number;
  price: number;
}

export interface ProductOrder {
  id: string;
  customer_id: string;
  artist_id: string;
  items: ProductOrderItem[];
  total_qar: number;
  status: OrderStatus;
  shipping_address: ShippingAddress | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product: Product;
  created_at: string;
}

export interface CreateProductInput {
  title: string;
  description?: string;
  product_type: ProductType;
  category: ProductCategory;
  price_qar: number;
  compare_at_price?: number;
  images: string[];
  inventory_count?: number;
  digital_content_url?: string;
  is_featured?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}
