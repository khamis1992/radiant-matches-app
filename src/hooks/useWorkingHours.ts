import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorkingHour {
  id: string;
  artist_id: string;
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export interface WorkingHourUpdate {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

export const useWorkingHours = (artistId: string | undefined) => {
  return useQuery({
    queryKey: ["working-hours", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      const { data, error } = await supabase
        .from("artist_working_hours")
        .select("*")
        .eq("artist_id", artistId)
        .order("day_of_week");

      if (error) throw error;
      return data as WorkingHour[];
    },
    enabled: !!artistId,
  });
};

export const useUpdateWorkingHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      artistId,
      hours,
    }: {
      artistId: string;
      hours: WorkingHourUpdate[];
    }) => {
      // Delete existing hours and insert new ones
      const { error: deleteError } = await supabase
        .from("artist_working_hours")
        .delete()
        .eq("artist_id", artistId);

      if (deleteError) throw deleteError;

      const hoursWithArtistId = hours.map((h) => ({
        ...h,
        artist_id: artistId,
      }));

      const { error: insertError } = await supabase
        .from("artist_working_hours")
        .insert(hoursWithArtistId);

      if (insertError) throw insertError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["working-hours", variables.artistId],
      });
    },
  });
};
