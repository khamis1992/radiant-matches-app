import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ArtistProfile {
  id: string;
  user_id: string;
  bio: string | null;
  experience_years: number | null;
  studio_address: string | null;
  is_available: boolean | null;
  portfolio_images: string[] | null;
  rating: number | null;
  total_reviews: number | null;
}

export interface ArtistService {
  id: string;
  artist_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  is_active: boolean | null;
}

export interface ArtistBooking {
  id: string;
  customer_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number;
  location_type: string;
  location_address: string | null;
  notes: string | null;
  service?: {
    name: string;
    duration_minutes: number;
  } | null;
  customer?: {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

export const useCurrentArtist = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["current-artist", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ArtistProfile | null;
    },
    enabled: !!user?.id,
  });
};

export const useArtistBookings = () => {
  const { data: artist } = useCurrentArtist();
  
  return useQuery({
    queryKey: ["artist-bookings", artist?.id],
    queryFn: async () => {
      if (!artist?.id) return { upcoming: [], past: [] };
      
      const today = new Date().toISOString().split("T")[0];
      
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("artist_id", artist.id)
        .order("booking_date", { ascending: false });

      if (error) throw error;
      if (!bookings || bookings.length === 0) return { upcoming: [], past: [] };

      // Fetch services
      const serviceIds = [...new Set(bookings.map(b => b.service_id).filter(Boolean))];
      const { data: services } = await supabase
        .from("services")
        .select("id, name, duration_minutes")
        .in("id", serviceIds);

      // Fetch customer profiles
      const customerIds = [...new Set(bookings.map(b => b.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .in("id", customerIds);

      const serviceMap = new Map(services?.map(s => [s.id, s]) || []);
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedBookings = bookings.map(booking => ({
        ...booking,
        service: serviceMap.get(booking.service_id!) || null,
        customer: profileMap.get(booking.customer_id) || null,
      })) as ArtistBooking[];

      const upcoming = enrichedBookings.filter(
        b => b.booking_date >= today && b.status !== "cancelled" && b.status !== "completed"
      );
      const past = enrichedBookings.filter(
        b => b.booking_date < today || b.status === "completed" || b.status === "cancelled"
      );

      return { upcoming, past };
    },
    enabled: !!artist?.id,
  });
};

export const useArtistServices = () => {
  const { data: artist } = useCurrentArtist();
  
  return useQuery({
    queryKey: ["artist-services", artist?.id],
    queryFn: async () => {
      if (!artist?.id) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("artist_id", artist.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ArtistService[];
    },
    enabled: !!artist?.id,
  });
};

export const useUpdateArtistProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updates: Partial<ArtistProfile>) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("artists")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-artist"] });
    },
  });
};

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: BookingStatus }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-bookings"] });
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();
  const { data: artist } = useCurrentArtist();
  
  return useMutation({
    mutationFn: async (service: Omit<ArtistService, "id" | "artist_id">) => {
      if (!artist?.id) throw new Error("No artist profile");
      
      const { data, error } = await supabase
        .from("services")
        .insert({ ...service, artist_id: artist.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-services"] });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ArtistService> & { id: string }) => {
      const { data, error } = await supabase
        .from("services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-services"] });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-services"] });
    },
  });
};
