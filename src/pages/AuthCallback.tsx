
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      navigate('/', { replace: true });
      return;
    }

    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      
      // Redirect to home page regardless of success/error
      navigate('/', { replace: true });
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-pulse text-center">
        <h2 className="text-2xl font-semibold">Completing authentication...</h2>
        <p className="text-muted-foreground">You'll be redirected shortly.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
