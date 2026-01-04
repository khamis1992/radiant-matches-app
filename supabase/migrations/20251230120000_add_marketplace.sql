-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table for artist marketplace
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('physical', 'digital', 'bundle', 'gift_card')),
  category TEXT NOT NULL,
  price_qar DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_at_price DECIMAL(10,2),
  images JSONB DEFAULT '[]'::jsonb,
  inventory_count INTEGER DEFAULT 0,
  digital_content_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_artist_id ON products(artist_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- Product orders table
CREATE TABLE IF NOT EXISTS product_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES profiles(id),
  items JSONB NOT NULL,
  total_qar DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for product_orders
CREATE INDEX IF NOT EXISTS idx_product_orders_customer_id ON product_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_artist_id ON product_orders(artist_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_orders(status);

-- Shopping cart table
CREATE TABLE IF NOT EXISTS shopping_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create index for shopping_cart
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON shopping_cart(user_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Artists can view their own products"
  ON products FOR SELECT
  USING (artist_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Artists can insert their own products"
  ON products FOR INSERT
  WITH CHECK (artist_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Artists can update their own products"
  ON products FOR UPDATE
  USING (artist_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Artists can delete their own products"
  ON products FOR DELETE
  USING (artist_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Everyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- RLS Policies for product_orders
CREATE POLICY "Customers can view their own orders"
  ON product_orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Artists can view orders for their products"
  ON product_orders FOR SELECT
  USING (artist_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create orders"
  ON product_orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Artists can update order status"
  ON product_orders FOR UPDATE
  USING (artist_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- RLS Policies for shopping_cart
CREATE POLICY "Users can view their own cart"
  ON shopping_cart FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert to their own cart"
  ON shopping_cart FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cart"
  ON shopping_cart FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete from their own cart"
  ON shopping_cart FOR DELETE
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_orders_updated_at BEFORE UPDATE ON product_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
