import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import Scene3D from '@/components/visualizer/Scene3D';
import AudioControls from '@/components/visualizer/AudioControls';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Track {
  id: string;
  filename: string;
  storage_path: string;
  duration: number;
}

export default function Visualizer() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [track, setTrack] = useState<Track | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackId) {
      navigate('/');
      return;
    }

    loadTrack();
  }, [trackId, user]);

  const loadTrack = async () => {
    try {
      // Fetch track metadata
      const { data: trackData, error: trackError } = await supabase
        .from('tracks')
        .select('*')
        .eq('id', trackId)
        .single();

      if (trackError) throw trackError;

      setTrack(trackData);

      // Get signed URL for audio file
      const { data: urlData, error: urlError } = await supabase.storage
        .from('tracks')
        .createSignedUrl(trackData.storage_path, 3600); // 1 hour expiry

      if (urlError) throw urlError;

      setAudioUrl(urlData.signedUrl);
    } catch (error: any) {
      console.error('Error loading track:', error);
      toast({
        title: "Error Loading Track",
        description: error.message || "Failed to load the audio track.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background cyber-grid">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neon-cyan">Loading visualizer...</p>
        </div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Track not found</p>
          <Button variant="neon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border/50 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-neon-cyan">
                {track.filename}
              </h1>
              <p className="text-sm text-muted-foreground">
                Neon Vinyl Visualizer
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* 3D Scene */}
        <div className="flex-1 relative">
          <Scene3D />
        </div>

        {/* Controls Sidebar */}
        <div className="w-80 p-6 glass border-l border-border/50 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-neon-magenta mb-4">
              Audio Controls
            </h2>
            <AudioControls audioUrl={audioUrl} />
          </div>

          {/* Additional controls can be added here */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-neon-violet">
              Visual Settings
            </h3>
            <p className="text-sm text-muted-foreground">
              More controls coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}