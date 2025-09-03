import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (role === 'admin') {
        navigate("/admin");
      } else if (role === 'user') {
        navigate("/");
      } else if (role === 'pending') {
        // L'utilisateur est connecté mais son compte n'est pas encore approuvé
        return;
      }
    }
  }, [user, role, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/neon-groove-orbit/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: email.split('@')[0]
            }
          }
        });

        if (error) throw error;

        toast({
          title: "Demande envoyée",
          description: "Votre demande de création de compte a été envoyée. Un administrateur doit l'approuver avant que vous puissiez vous connecter.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté à votre compte.",
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: "Erreur d'authentification",
        description: error.message || "Une erreur est survenue lors de l'authentification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Si l'utilisateur est connecté mais en attente d'approbation
  if (user && role === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="gradient-text">Compte en attente</CardTitle>
            <CardDescription>
              Votre demande de création de compte est en cours de traitement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Votre compte a été créé mais doit être approuvé par un administrateur avant que vous puissiez accéder à l'application.
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Connecté en tant que : {user.email}
              </p>
              <Button 
                variant="outline" 
                onClick={() => supabase.auth.signOut()}
                className="w-full"
              >
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">
            {isSignUp ? "Créer un compte" : "Se connecter"}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Demander la création d'un nouveau compte" 
              : "Connectez-vous à votre compte existant"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
                placeholder="votre@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
                placeholder="••••••••"
              />
            </div>
            
            {isSignUp && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Votre demande sera examinée par un administrateur avant l'activation de votre compte.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? "Création..." : "Connexion..."}
                </>
              ) : (
                isSignUp ? "Demander un compte" : "Se connecter"
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp 
                ? "Déjà un compte ? Se connecter" 
                : "Pas de compte ? Demander un accès"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;