-- Products table for artist marketplace
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_products_artist_id ON public.products(artist_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

-- Product orders table
CREATE TABLE IF NOT EXISTS public.product_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  artist_id UUID NOT NULL REFERENCES public.artists(id),
  items JSONB NOT NULL,
  total_qar DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for product_orders
CREATE INDEX IF NOT EXISTS idx_product_orders_customer_id ON public.product_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_artist_id ON public.product_orders(artist_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON public.product_orders(status);

-- Shopping cart table
CREATE TABLE IF NOT EXISTS public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create index for shopping_cart
CREATE INDEX IF NOT EXISTS idx_shopping_cart_user_id ON public.shopping_cart(user_id);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Artists can view their own products"
  ON public.products FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.artists WHERE artists.id = products.artist_id AND artists.user_id = auth.uid()
  ));

CREATE POLICY "Artists can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.artists WHERE artists.id = artist_id AND artists.user_id = auth.uid()
  ));

CREATE POLICY "Artists can update their own products"
  ON public.products FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.artists WHERE artists.id = products.artist_id AND artists.user_id = auth.uid()
  ));

CREATE POLICY "Artists can delete their own products"
  ON public.products FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.artists WHERE artists.id = products.artist_id AND artists.user_id = auth.uid()
  ));

CREATE POLICY "Everyone can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

-- RLS Policies for product_orders
CREATE POLICY "Customers can view their own orders"
  ON public.product_orders FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Artists can view orders for their products"
  ON public.product_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.artists WHERE artists.id = product_orders.artist_id AND artists.user_id = auth.uid()
  ));

CREATE POLICY "Users can create orders"
  ON public.product_orders FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Artists can update order status"
  ON public.product_orders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.artists WHERE artists.id = product_orders.artist_id AND artists.user_id = auth.uid()
  ));

-- RLS Policies for shopping_cart
CREATE POLICY "Users can view their own cart"
  ON public.shopping_cart FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert to their own cart"
  ON public.shopping_cart FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cart"
  ON public.shopping_cart FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete from their own cart"
  ON public.shopping_cart FOR DELETE
  USING (user_id = auth.uid());

-- Trigger for products updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for product_orders updated_at
CREATE TRIGGER update_product_orders_updated_at BEFORE UPDATE ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();