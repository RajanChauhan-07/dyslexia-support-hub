
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message);
          setError(error.message);
          return;
        }

        if (data.session) {
          console.log('Authentication successful');
        } else {
          console.log('No session found, but no error returned');
        }

        // Redirect to home page
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Unexpected error during auth callback:', err);
        setError('An unexpected error occurred during authentication.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Authentication error: {error}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="animate-pulse">
            <h2 className="text-2xl font-semibold mb-2">Completing authentication...</h2>
            <p className="text-muted-foreground">You'll be redirected shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
