-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tracks table for uploaded audio files
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  duration NUMERIC,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create presets table for saved visualizer configurations
CREATE TABLE public.presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  config JSONB NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Tracks policies
CREATE POLICY "Users can view their own tracks and public tracks" 
ON public.tracks FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own tracks" 
ON public.tracks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" 
ON public.tracks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks" 
ON public.tracks FOR DELETE 
USING (auth.uid() = user_id);

-- Presets policies
CREATE POLICY "Users can view their own presets and public presets" 
ON public.presets FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own presets" 
ON public.presets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets" 
ON public.presets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets" 
ON public.presets FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_presets_updated_at
  BEFORE UPDATE ON public.presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('tracks', 'tracks', false);

-- Storage policies for tracks bucket
CREATE POLICY "Users can view their own audio files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own audio files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own audio files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();