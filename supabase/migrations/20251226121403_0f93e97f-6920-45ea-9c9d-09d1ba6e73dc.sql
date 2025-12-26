-- Allow anyone (including unauthenticated users) to view artist profiles
CREATE POLICY "Anyone can view artist profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM artists WHERE artists.user_id = profiles.id
  )
);