import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FileUploader from '@/components/upload/FileUploader';
import { supabase } from '@/integrations/supabase/client';
import { Music, Sparkles, Zap, Users, Settings, Shield } from 'lucide-react';

interface Track {
  id: string;
  filename: string;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);

  useEffect(() => {
    if (user && (role === 'user' || role === 'admin')) {
      loadRecentTracks();
    }
  }, [user, role]);

  const loadRecentTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, filename, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentTracks(data || []);
    } catch (error) {
      console.error('Error loading tracks:', error);
    }
  };

  const handleUploadComplete = (trackId: string) => {
    navigate(`/visualizer/${trackId}`);
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleAdminAccess = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Header with user info */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* User status bar */}
          {user && (
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  {user.email}
                </Badge>
                {role && (
                  <Badge variant={role === 'admin' ? 'default' : role === 'user' ? 'secondary' : 'outline'}>
                    {role === 'admin' && <Shield className="w-4 h-4 mr-1" />}
                    {role === 'admin' ? 'Administrateur' : 
                     role === 'user' ? 'Utilisateur' : 'En attente'}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {role === 'admin' && (
                  <Button variant="outline" onClick={handleAdminAccess}>
                    <Settings className="w-4 h-4 mr-1" />
                    Administration
                  </Button>
                )}
                <Button variant="ghost" onClick={() => supabase.auth.signOut()}>
                  Se déconnecter
                </Button>
              </div>
            </div>
          )}
          
          <div className="text-center">
            <div className="space-y-6 mb-12">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-violet bg-clip-text text-transparent">
              Neon Vinyl Visualizer
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transform your music into mesmerizing 3D visualizations. 
              Upload audio and watch as neon-drenched vinyl spins to life.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="glass p-6 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-neon-cyan" />
              <h3 className="text-lg font-semibold mb-2">Audio-Reactive</h3>
              <p className="text-sm text-muted-foreground">
                Real-time frequency analysis drives stunning visual effects
              </p>
            </Card>
            
            <Card className="glass p-6 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-neon-magenta" />
              <h3 className="text-lg font-semibold mb-2">Cinematic 3D</h3>
              <p className="text-sm text-muted-foreground">
                Immersive camera orbits around detailed vinyl room scenes
              </p>
            </Card>
            
            <Card className="glass p-6 text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-neon-violet" />
              <h3 className="text-lg font-semibold mb-2">Neon Aesthetic</h3>
              <p className="text-sm text-muted-foreground">
                Cyberpunk-inspired visuals with customizable color themes
              </p>
            </Card>
          </div>

          {/* Upload Section */}
          <div className="max-w-2xl mx-auto">
            {user ? (
              role === 'user' || role === 'admin' ? (
                <div className="space-y-4">
                  <FileUploader onUploadComplete={handleUploadComplete} />
                  {role === 'admin' && (
                    <Card className="glass p-6 text-center">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-neon-cyan" />
                      <p className="text-sm text-muted-foreground mb-3">
                        En tant qu'administrateur, vous avez accès au panel d'administration
                      </p>
                      <Button variant="outline" size="sm" onClick={handleAdminAccess}>
                        <Settings className="mr-2 h-4 w-4" />
                        Panel Admin
                      </Button>
                    </Card>
                  )}
                </div>
              ) : role === 'pending' ? (
                <Card className="glass p-8 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-xl font-semibold mb-4">Compte en attente</h3>
                  <p className="text-muted-foreground mb-6">
                    Votre demande de création de compte est en cours de traitement par un administrateur.
                  </p>
                  <Badge variant="outline">Statut : En attente d'approbation</Badge>
                </Card>
              ) : (
                <FileUploader onUploadComplete={handleUploadComplete} />
              )
            ) : (
              <Card className="glass p-8 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-neon-cyan" />
                <h3 className="text-xl font-semibold mb-4">Get Started</h3>
                <p className="text-muted-foreground mb-6">
                  Sign in to upload your music and create stunning visualizations
                </p>
                <Button variant="neon-solid" size="xl" onClick={handleSignIn}>
                  Sign In to Start
                </Button>
              </Card>
            )}
          </div>

          {/* Recent Tracks */}
          {user && (role === 'user' || role === 'admin') && recentTracks.length > 0 && (
            <div className="max-w-2xl mx-auto mt-12">
              <h3 className="text-lg font-semibold text-neon-magenta mb-4">
                Recent Tracks
              </h3>
              <div className="space-y-2">
                {recentTracks.map((track) => (
                  <Card
                    key={track.id}
                    className="glass p-4 flex items-center justify-between cursor-pointer hover:border-neon-cyan/50 transition-colors"
                    onClick={() => navigate(`/visualizer/${track.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-neon-cyan" />
                      <span className="font-medium">{track.filename}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(track.created_at).toLocaleDateString()}
                    </span>
                  </Card>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
