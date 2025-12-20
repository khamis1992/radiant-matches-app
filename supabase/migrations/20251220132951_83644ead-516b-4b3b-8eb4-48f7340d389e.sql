-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'artist');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'customer',
  UNIQUE (user_id, role)
);

-- Create artists table (extends profile for artist-specific data)
CREATE TABLE public.artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  studio_address TEXT,
  portfolio_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('client_home', 'artist_studio')),
  location_address TEXT,
  notes TEXT,
  status booking_status NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Default role is customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for artists
CREATE POLICY "Anyone can view artists" ON public.artists FOR SELECT USING (true);
CREATE POLICY "Artists can update own profile" ON public.artists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Artists can insert own profile" ON public.artists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Artists can delete own profile" ON public.artists FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for services
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Artists can manage own services" ON public.services FOR ALL USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);

-- RLS Policies for bookings
CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Artists can view their bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Artists can update their bookings" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews for completed bookings" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = customer_id AND
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND customer_id = auth.uid() AND status = 'completed')
);
CREATE POLICY "Customers can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Customers can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = customer_id);

-- Function to update artist rating when review is added
CREATE OR REPLACE FUNCTION public.update_artist_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.artists
  SET 
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM public.reviews WHERE artist_id = NEW.artist_id),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE artist_id = NEW.artist_id)
  WHERE id = NEW.artist_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_artist_rating();