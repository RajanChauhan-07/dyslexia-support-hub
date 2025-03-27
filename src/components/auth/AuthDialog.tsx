
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LogIn } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'signup';

const AuthDialog = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const { user } = useAuth();

  if (user) {
    return null; // Don't show auth dialog if user is logged in
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' 
              ? 'Enter your details to sign in to your account.' 
              : 'Fill in the information below to create your account.'}
          </DialogDescription>
        </DialogHeader>
        
        {mode === 'login' ? (
          <LoginForm onSuccess={() => setOpen(false)} />
        ) : (
          <SignupForm onSuccess={() => setOpen(false)} />
        )}
        
        <div className="mt-4 text-center text-sm">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => setMode('signup')}
              >
                Create one
              </Button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => setMode('login')}
              >
                Sign in
              </Button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
