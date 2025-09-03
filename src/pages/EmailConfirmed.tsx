import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const EmailConfirmed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to auth page after 10 seconds
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl gradient-text">
            Email confirmé !
          </CardTitle>
          <CardDescription>
            Merci d'avoir confirmé votre adresse email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Votre compte est maintenant en attente d'approbation par un administrateur. 
              Vous recevrez une notification une fois votre compte activé.
            </AlertDescription>
          </Alert>
          
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Vous pouvez fermer cette page ou vous serez automatiquement redirigé vers la page de connexion dans 10 secondes.
            </p>
            
            <Button 
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Aller à la page de connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmed;